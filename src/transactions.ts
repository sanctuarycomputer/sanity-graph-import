import {
  SanityClient,
  SanityAssetDocument,
  Transaction,
  MultipleMutationResult,
} from '@sanity/client'
import getHashedBufferForUri from '@sanity/import/src/util/getHashedBufferForUri'
import { MigratedAsset, UnMigratedAsset, SanityDocument } from './types'
import {
  CaughtError,
  retryCaughtErrors,
  definitely,
  logWrite,
  logDelete,
  logError,
  partition,
  getImageHash,
  getAssetType,
  isMigratedDocument,
  getUploadedFilename,
  chunk,
  createRemapReferences,
  queue,
} from './utils'

export const deleteAll = async (
  client: SanityClient
): Promise<MultipleMutationResult> => {
  const { dataset, projectId } = client.config()
  logDelete(`Clearing ${projectId}/${dataset} dataset...`)
  const allDocuments = await client.fetch<SanityDocument[]>('*[]')
  const ids = allDocuments
    .map((doc) => doc._id)
    .filter(
      (id) =>
        /* Reserved and internal documents start with "_." Omit these. */
        !/^_\./.test(id)
    )
  const initialTrx = client.transaction()
  const finalTrx = ids.reduce<Transaction>(
    (previousTrx, id) => previousTrx.delete(id),
    initialTrx
  )
  const result = await finalTrx.commit()
  logDelete(`Removed ${ids.length} documents from ${projectId}/${dataset}`)
  return result
}

export const uploadAsset = async (
  client: SanityClient,
  originalAsset: SanityAssetDocument
): Promise<MigratedAsset> => {
  const url = originalAsset.url
  const assetType = getAssetType(originalAsset)
  const { buffer } = await getHashedBufferForUri(url)

  const options = {
    label: getImageHash(originalAsset),
    filename: getUploadedFilename(originalAsset),
    source: {
      id: originalAsset._id,
      source: 'migration',
      url: originalAsset.url,
    },
  }
  const uploadResult = await client.assets.upload(
    // @ts-ignore not sure how to enforce the string type for the overloads
    assetType,
    buffer,
    options
  )
  return {
    source: originalAsset,
    destination: uploadResult,
  }
}

export const uploadAssets = async (
  client: SanityClient,
  sourceAssets: SanityAssetDocument[]
): Promise<MigratedAsset[]> => {
  const originalHashes = definitely(sourceAssets.map(getImageHash))

  /* Find assets that already exist */
  const existingAssets = await client.fetch<SanityAssetDocument[]>(
    `*[label in $originalHashes]`,
    { originalHashes }
  )

  const assetPairs = sourceAssets.map<MigratedAsset | UnMigratedAsset>(
    (source) => ({
      source,
      destination: existingAssets.find(
        (existingAsset) => existingAsset.label === getImageHash(source)
      ),
    })
  )

  const [migrated, unmigrated] = partition<MigratedAsset, UnMigratedAsset>(
    assetPairs,
    isMigratedDocument
  )

  if (unmigrated.length === 0) {
    logWrite('Found no new assets to upload')
    return migrated
  }

  logWrite(`Found ${unmigrated.length} new assets to upload`)

  const [newAssets, errors] = await queue(
    unmigrated.map(({ source }) => () => uploadAsset(client, source))
  )

  if (errors.length) {
    errors.forEach((error) => {
      console.log(error)
    })
  }

  return [...migrated, ...newAssets]
}

interface InsertDocumentOptions {
  batchSize: number
}

type InsertDocumentsResponse = [MultipleMutationResult[], CaughtError[]]

export const insertDocuments = async (
  client: SanityClient,
  sourceDocuments: SanityDocument[],
  sourceAssets: SanityAssetDocument[],
  { batchSize }: InsertDocumentOptions
): Promise<InsertDocumentsResponse> => {
  const dataset = client.config().dataset
  const uploadedAssets = await uploadAssets(client, sourceAssets)

  const remapRefs = createRemapReferences(sourceDocuments, uploadedAssets)
  const updatedDocuments = sourceDocuments.map((doc) => remapRefs(doc))

  const insertBatch = async (
    batch: SanityDocument[]
  ): Promise<MultipleMutationResult> => {
    const initialTransaction = client.transaction()
    const transaction = batch.reduce<Transaction>(
      (prevTrx, document) => prevTrx.createOrReplace(document),
      initialTransaction
    )

    const result = await transaction.commit().catch((err) => {
      throw err
    })
    return result
  }

  const documentBatches = chunk(updatedDocuments, batchSize)

  logWrite(
    `Inserting ${sourceDocuments.length} documents into dataset "${dataset}"`
  )

  const [insertResults, insertErrors] = await queue(
    documentBatches.map((batch) => () => insertBatch(batch))
  )

  if (insertErrors.length) {
    logError(
      `There were ${insertResults.length} errors inserting your documents. Retrying..`
    )
  }
  const [
    retryInsertResults,
    retryInsertErrors,
  ] = await retryCaughtErrors<MultipleMutationResult>(insertErrors)

  const successfulInserts = [...insertResults, ...retryInsertResults]

  logWrite(
    `Inserted ${updatedDocuments.length} documents in ${successfulInserts.length} batches`
  )
  const updatedStrong = sourceDocuments.map((doc) => remapRefs(doc, false))
  const strongBatches = chunk(updatedStrong, batchSize)

  logWrite('Strengthening references..')

  const [strongResults, strongResultErrors] = await queue(
    strongBatches.map((batch) => () => insertBatch(batch))
  )

  if (strongResultErrors.length) {
    logError(
      `There were ${strongResultErrors.length} errors inserting your documents. Retrying..`
    )
  }
  const [
    retryStrongResults,
    retryStrongErrors,
  ] = await retryCaughtErrors<MultipleMutationResult>(strongResultErrors)

  const successfulStrongs = [...strongResults, ...retryStrongResults]

  const successes = [...successfulInserts, ...successfulStrongs]
  const errors = [...retryInsertErrors, ...retryStrongErrors]

  return [successes, errors]
}
