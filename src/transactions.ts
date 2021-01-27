import {
  SanityClient,
  SanityAssetDocument,
  Transaction,
  MultipleMutationResult,
} from '@sanity/client'
import cliProgress from 'cli-progress'
import getHashedBufferForUri from '@sanity/import/src/util/getHashedBufferForUri'
import { MigratedAsset, UnMigratedAsset, SanityDocument } from './types'
import {
  definitely,
  logFetch,
  logWrite,
  logDelete,
  partition,
  getImageHash,
  isMigratedDocument,
  getUploadedFilename,
  chunk,
  createRemapReferences,
  queue,
} from './utils'

export const fetchDocumentsByType = async (
  client: SanityClient,
  type: string,
  count: number
): Promise<SanityDocument[]> => {
  logFetch(`Fetching documents by type: ${type}`)
  const documents = await client.fetch<SanityDocument[]>(
    `
    *[_type == $type]
    | order(releaseDate desc)
    | order(_createdAt desc) [0...$count]{
      ...
    }
    `,
    { type, count }
  )
  logFetch(` - Fetched ${documents.length} documents`)

  return documents
}

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

const getAssetType = (document: SanityDocument) => {
  const { _type } = document
  const assetType = _type.replace(/^sanity./, '').replace(/Asset$/, '')
  if (
    !/^sanity\./.test(_type) ||
    (assetType !== 'file' && assetType !== 'image')
  ) {
    throw new Error(`"${_type}" is not a valid sanity asset type`)
  }
  return assetType as 'image' | 'file'
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

  const uploadProgressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  )

  uploadProgressBar.start(unmigrated.length, 0)
  const newAssets = await queue(
    unmigrated.map(({ source }) => async () => {
      const uploadResult = await uploadAsset(client, source)
      uploadProgressBar.increment()
      return uploadResult
    })
  )
  uploadProgressBar.stop()
  return [...migrated, ...newAssets]
}

interface InsertDocumentOptions {
  batchSize: number
}

export const insertDocuments = async (
  client: SanityClient,
  sourceDocuments: SanityDocument[],
  sourceAssets: SanityAssetDocument[],
  { batchSize }: InsertDocumentOptions
) => {
  const dataset = client.config().dataset
  const uploadedAssets = await uploadAssets(client, sourceAssets)

  const remapRefs = createRemapReferences(sourceDocuments, uploadedAssets)
  const updatedDocuments = sourceDocuments.map((doc) => remapRefs(doc))

  const insertBatch = async (
    batch: SanityDocument[]
  ): Promise<MultipleMutationResult> => {
    const transaction = batch.reduce<Transaction>(
      (prevTrx, document) => prevTrx.createOrReplace(document),
      client.transaction()
    )

    return transaction.commit()
  }

  const documentBatches = chunk(updatedDocuments, batchSize)

  logWrite(
    `Inserting ${sourceDocuments.length} documents into dataset "${dataset}"`
  )

  const batchProgressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  )

  batchProgressBar.start(updatedDocuments.length, 0)
  await queue(
    documentBatches.map((batch) => async () => {
      const result = await insertBatch(batch)
      batchProgressBar.increment(batch.length)
      return result
    })
  )
  batchProgressBar.stop()
  logWrite(`Inserted ${updatedDocuments.length} documents`)
  const updatedStrong = sourceDocuments.map((doc) => remapRefs(doc, false))
  const strongBatches = chunk(updatedStrong, batchSize)

  logWrite('Strengthening references..')

  const strongProgressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  )

  strongProgressBar.start(updatedStrong.length, 0)

  const strongResults = await queue(
    strongBatches.map((batch) => async () => {
      const result = await insertBatch(batch)
      strongProgressBar.increment(batch.length)
      return result
    })
  )
  strongProgressBar.stop()
  return strongResults
}
