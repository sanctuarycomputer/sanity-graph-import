import { SanityAssetDocument } from '@sanity/client'
import hash from 'hash-sum'
import { isPlainObject } from 'lodash'
import {
  MigratedAsset,
  MigratedDocument,
  SanityDocument,
  SanityFieldValue,
  SanityObject,
  SanityReference,
  SanityAssetObject,
} from '../types'
import { flat, unique, definitely } from './misc'

/**
 * Type Guards
 */

const isReference: IsReferenceFn = (obj: any): obj is SanityReference =>
  Boolean(obj) &&
  // obj._type === 'reference' &&
  typeof obj._ref === 'string' &&
  obj._ref.length > 0

const assetIdRegexp = /^(image-|file-)/

const isDocumentReference: IsReferenceFn = (obj: any): obj is SanityReference =>
  isReference(obj) && !assetIdRegexp.test(obj._ref)

const isAssetReference: IsReferenceFn = (obj: any): obj is SanityReference =>
  isReference(obj) && assetIdRegexp.test(obj._ref)

export const isAsset = (doc: SanityDocument): doc is SanityAssetDocument =>
  Boolean(doc) &&
  (doc._type === 'sanity.imageAsset' || doc._type === 'sanity.fileAsset')

export const isSanityAssetObject = (obj: any): obj is SanityAssetObject =>
  Boolean(obj) &&
  (obj._type === 'image' || obj._type === 'file') &&
  obj.asset !== undefined &&
  isAssetReference(obj.asset)

export const isSanityObject = (obj: any): obj is SanityObject => {
  return isPlainObject(obj)
}

export function isMigratedDocument<DocType extends SanityDocument>(
  pair: any
): pair is MigratedDocument<DocType> {
  return Boolean(pair) && Boolean(pair.source) && Boolean(pair.destination)
}

/**
 * Getters
 */

type IsReferenceFn = (obj: any) => obj is SanityReference

const findReferencedIds = (isReferenceFn: IsReferenceFn) => (
  doc: SanityDocument | SanityObject
): string[] => {
  const getIds = (value: SanityFieldValue): string[] => {
    if (!value) return []
    if (isReferenceFn(value)) return [value._ref]
    if (Array.isArray(value)) {
      return flat(definitely(value.map(getIds)))
    }
    if (isSanityObject(value)) {
      return findReferencedIds(isReferenceFn)(value)
    }
    return []
  }
  const result = Object.values(doc).reduce<string[]>((referenceIds, value) => {
    const ids = getIds(value)
    return [...referenceIds, ...ids]
  }, [])
  return unique(result)
}

export const findReferencedDocumentIds = findReferencedIds(isDocumentReference)
export const findReferencedAssetIds = findReferencedIds(isAssetReference)

export const getUploadedFilename = (asset: SanityAssetDocument): string =>
  asset.path.replace(/(.*\/)*/, '')

export const getImageHash = (asset: SanityAssetDocument): string =>
  hash(asset.metadata.lqip)

export const getAssetType = (document: SanityDocument) => {
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

/**
 * Typeguards
 */

/**
 * Transformers
 */

export const createRemapAssetReferences = (uploadedAssets: MigratedAsset[]) => (
  document: SanityDocument
): SanityDocument => {
  const originalAssets = uploadedAssets.map(({ source }) => source)
  const newAssets = uploadedAssets.map(({ destination }) => destination)

  const findMigratedReference = (
    refObject: SanityAssetObject
  ): SanityAssetObject => {
    const originalAsset = originalAssets.find(
      (originalAsset) => originalAsset._id === refObject.asset._ref
    )
    if (!originalAsset) {
      throw new Error(
        `Could not find original asset match for ${refObject.asset._ref}`
      )
    }
    const newAsset = newAssets.find(
      (newAsset) => getImageHash(originalAsset) === newAsset.label
    )
    if (!newAsset) {
      throw new Error(
        `Could not find migrated asset match for ${refObject.asset._ref}`
      )
    }

    return {
      _type: refObject._type,
      migrationId: refObject.asset._ref,
      asset: {
        _type: 'reference',
        _ref: newAsset._id,
      },
    }
  }

  /* Recursively update all asset references */
  const remap = <T extends SanityDocument | SanityObject>(obj: T): T => {
    const getNewValue = <T>(
      value: T
    ): SanityAssetObject | SanityAssetObject[] | T => {
      if (isReference(value)) return value
      if (isSanityAssetObject(value)) return findMigratedReference(value)
      if (Array.isArray(value)) {
        return value.map(getNewValue)
      }
      if (isSanityObject(value)) {
        return remap(value)
      }
      return value
    }
    return Object.entries(obj).reduce<T>((previousValues, [key, oldValue]) => {
      const newValue = getNewValue(oldValue)
      return {
        ...previousValues,
        [key]: newValue,
      }
    }, {} as T)
  }

  const parsed = remap(document)

  return parsed
}

export const createRemapDocumentReferences = (allDocs: SanityDocument[]) => (
  doc: SanityDocument,
  _weak = true
): SanityDocument => {
  const remap = <T extends SanityDocument | SanityObject>(obj: T): T => {
    const getNewValue = (
      oldValue: SanityFieldValue
    ): SanityFieldValue | void => {
      if (isReference(oldValue)) {
        const referencedDocExists = allDocs.some(
          (doc) => doc._id === oldValue._ref
        )
        // Strip out references to documents that do not exist
        if (!referencedDocExists) return undefined
        return {
          ...oldValue,
          _weak,
        }
      }
      if (isSanityObject(oldValue)) {
        return remap(oldValue)
      }
      if (Array.isArray(oldValue)) {
        return definitely(oldValue.map(getNewValue))
      }
      return oldValue
    }
    return Object.entries(obj).reduce<T>((previousValues, [key, oldValue]) => {
      const newValue = getNewValue(oldValue)
      return {
        ...previousValues,
        [key]: newValue,
      }
    }, {} as T)
  }
  return remap(doc)
}

export const createRemapReferences = (
  allDocs: SanityDocument[],
  uploadedAssets: MigratedAsset[]
) => (document: SanityDocument, _weak = true): SanityDocument => {
  const remapDocumentReferences = createRemapDocumentReferences(
    allDocs.concat(uploadedAssets.map(({ destination }) => destination))
  )
  const remapAssetReferences = createRemapAssetReferences(uploadedAssets)
  return remapDocumentReferences(remapAssetReferences(document), _weak)
}
