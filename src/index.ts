import type { SanityClient } from '@sanity/client'
import PromptConfirm from 'prompt-confirm'
import invariant from 'tiny-invariant'
import {
  logHeading,
  logError,
  debugResult,
  unique,
  findReferencedDocumentIds,
  findReferencedAssetIds,
  logFetch,
  queue,
  flat,
  chunk,
  definitely,
} from './utils'
import { deleteAll, insertDocuments } from './transactions'
import { SanityDocument, SanityAssetDocument } from './types'
import { DEFAULT_BATCH_SIZE } from './config'

type QueryParams = Record<string, any>

interface QueryArgs {
  query: string
  params?: QueryParams
}

interface SourceConfig {
  initialQueries: QueryArgs[]
  client: SanityClient
}

interface DestinationConfig {
  /* The destination client must have a write token! */
  client: SanityClient
  /**
   * The number of documents to include in a batch.
   *
   * default: 35
   *
   * If you are getting 'content-length' errors during migration,
   * set this to a lower number.
   */
  batchSize?: number

  /**
   * Set this value to true or false to skip the prompt to delete
   * all documents in the target dataset.
   *
   * default: undefined
   *
   * Leave undefined to include the prompt.
   */
  deleteData?: boolean | void
}

interface ImportConfig {
  source: SourceConfig
  destination: DestinationConfig
}

interface DocumentCounts {
  [key: string]: number
}

const getConfigString = (client: SanityClient): string => {
  const { projectId, dataset } = client.config()
  if (!projectId) invariant('Your client must include a projectId')
  if (!dataset) invariant('Your client must include a dataset')
  return [projectId, dataset].join(':')
}

export const migrate = async ({
  source,
  destination,
}: ImportConfig): Promise<void> => {
  try {
    const sourceClient = source.client
    const destinationClient = destination.client

    /**
     * Validate config
     */
    const sourceConfigString = getConfigString(sourceClient)
    const destConfigString = getConfigString(destinationClient)

    console.log({ sourceConfigString, destConfigString })
    console.log(sourceConfigString === destConfigString)
    invariant(
      Boolean(sourceConfigString !== destConfigString),
      `Both clients have the same configuration: ${sourceConfigString}`
    )

    invariant(
      Boolean(destinationClient.config().token),
      'The destination client must have a write token'
    )

    invariant(
      !Boolean(sourceClient.config().token),
      'The source client must not have a token'
    )

    invariant(
      source.initialQueries.length !== 0,
      'You must include at least one initial query'
    )

    /**
     * Fetch initial documents
     */

    logHeading(
      `Migrating from ${sourceClient.config().projectId}/${
        sourceClient.config().dataset
      } to ${destinationClient.config().projectId}/${
        destinationClient.config().dataset
      } `
    )

    logFetch(`Fetching ${source.initialQueries.length} initial queries..`)

    const [initialDocumentBatches, initialDocErrors] = await queue<
      SanityDocument[]
    >(
      source.initialQueries.map(({ query, params }) => () =>
        sourceClient.fetch(query, params || {})
      )
    )

    const initialDocuments = flat(initialDocumentBatches)

    if (initialDocErrors) {
      initialDocErrors.forEach((error) => {
        console.log(error)
      })
    }

    const docIds = initialDocuments.map(({ _id }) => _id)
    const referencedIds = flat(initialDocuments.map(findReferencedDocumentIds))
    const allIds = unique(docIds.concat(referencedIds))

    logFetch(`Found ${initialDocuments.length} initial documents`)
    logFetch(`  + ${referencedIds.length} referenced documents`)

    const allIdBatches = chunk(allIds, 5)
    logFetch(
      `Fetching referenced documents in ${allIdBatches.length} batches..`
    )
    const [batchedSourceDocuments, errors] = await queue(
      allIdBatches.map((allIds) => async () => {
        const result = await sourceClient
          .fetch<SanityDocument[]>(
            `*[_id in $allIds && _type != 'sanity.imageAsset' && _type != 'sanity.fileAsset']`,
            { allIds }
          )
          .catch((err) => {
            console.log(err)
          })
        return result
      })
    )

    if (errors) {
      errors.forEach((error) => {
        console.log(error)
      })
    }

    const sourceDocuments = flat(definitely(batchedSourceDocuments))

    const documentCounts = sourceDocuments.reduce<DocumentCounts>(
      (documentCounts, document) => {
        const type = document._type
        const currentCount = documentCounts[type] || 0
        return {
          ...documentCounts,
          [type]: currentCount + 1,
        }
      },
      {}
    )

    logFetch(`Fetched all original & referenced documents`)
    Object.entries(documentCounts).forEach(([type, count]) => {
      logFetch(`    ${type}: ${count}`)
    })

    const assetIds = flat(sourceDocuments.map(findReferencedAssetIds)).filter(
      (id) => id.startsWith('image-') || id.startsWith('file-')
    )
    const sourceAssets = await sourceClient.fetch<SanityAssetDocument[]>(
      `*[_id in $assetIds]`,
      { assetIds }
    )
    logFetch(`   + ${sourceAssets.length} source assets`)

    const { deleteData } = destination

    if (deleteData === undefined) {
      const confirmDelete = new PromptConfirm(
        'Do you want to remove all data from the destination dataset?'
      )
      const confirmed = await confirmDelete.run()
      if (confirmed) {
        await deleteAll(destinationClient)
      }
    } else if (deleteData === true) {
      await deleteAll(destinationClient)
    }
    const batchSize = destination.batchSize ?? DEFAULT_BATCH_SIZE

    const [insertResults, insertErrors] = await insertDocuments(
      destinationClient,
      sourceDocuments,
      sourceAssets,
      {
        batchSize,
      }
    )

    if (insertErrors.length) {
      logError('There were errors while attempting to insert documents:')
      insertErrors.forEach((caughtError) => {
        console.error(caughtError.error)
      })
    } else {
      logHeading('Success! 🎉')
      debugResult(`${insertResults.length} operations`)
    }
  } catch (err) {
    logError(err)
    throw err
  }
}
