import { get } from 'lodash'
import {
  createRemapReferences,
  createRemapDocumentReferences,
  createRemapAssetReferences,
  findReferencedIds,
  getUploadedFilename,
  getAssetType,
  isAsset,
  isSanityAssetObject,
  isSanityObject,
  isReference,
  isMigratedDocument,
} from '../parsing'
import {
  sourceImage1,
  migratedImage1,
  migratedImage2,
  migratedAssets,
  mockDoc,
  mockAuthors,
  mockSections,
  mockArticles,
} from './stubs'

describe('findReferencedIds', () => {
  it('should extract a list of referenced IDs from a sanity document', () => {
    expect(findReferencedIds(mockDoc)).toEqual([
      'section-1',
      'article-1',
      'article-2',
      'image-2',
      'author-1',
      'author-2',
      'image-1',
    ])
  })
})

describe('remapAssetReference', () => {
  it('should replace asset references with the migrated asset', () => {
    const remapped = createRemapAssetReferences(migratedAssets)(mockDoc)
    expect(get(remapped, 'featuredImage.asset._ref')).toBe(migratedImage1._id)
    // Within arrays
    expect(get(remapped, 'gallery[0].asset._ref')).toBe(migratedImage1._id)
    expect(get(remapped, 'gallery[1].asset._ref')).toBe(migratedImage1._id)
    // Deeply nested
    expect(get(remapped, 'nestedGallery.modules[0].images[0].asset._ref')).toBe(
      migratedImage1._id
    )
    expect(
      get(remapped, 'layoutModules[0].widgets.slides[0].image.asset._ref')
    ).toBe(migratedImage2._id)
    expect(
      get(remapped, 'layoutModules[0].widgets.slides[1].image.asset._ref')
    ).toBe(migratedImage2._id)
  })

  it('should throw if unable to find an original asset match', () => {
    const remap = createRemapAssetReferences(migratedAssets.slice(2))
    const fn = () => {
      remap(mockDoc)
    }
    expect(fn).toThrow('Could not find original asset match for')
  })

  it('should throw if unable to find a migrated asset match', () => {
    const remap = createRemapAssetReferences([
      {
        source: migratedAssets[0].source,
        destination: {
          ...migratedAssets[0].destination,
          label: 'bad-ref',
        },
      },
      ...migratedAssets.slice(1),
    ])
    const fn = () => {
      remap(mockDoc)
    }
    expect(fn).toThrow('Could not find migrated asset match for')
  })
})

describe('remapDocumentReferences', () => {
  it('should omit references to documents that will not be uploaded', () => {
    const remapped = createRemapDocumentReferences([mockDoc, mockAuthors[0]])(
      mockDoc
    )
    expect(remapped.section).toBe(undefined)
    expect(get(remapped, 'authors.length')).toBe(1)
  })

  it('should preserve all existing properties', () => {
    const remapped = createRemapDocumentReferences([mockDoc])(mockDoc)
    expect(Object.keys(remapped)).toEqual(Object.keys(mockDoc))
  })

  it('should make all existing references weak', () => {
    const remapped = createRemapDocumentReferences([
      mockDoc,
      ...mockArticles,
      ...mockAuthors,
      ...mockSections,
    ])(mockDoc)
    expect(get(remapped, 'section._weak')).toBe(true)
    expect(get(remapped, 'authors[0]._weak')).toBe(true)
    expect(get(remapped, 'authors[1]._weak')).toBe(true)
    expect(get(remapped, 'story.article._weak')).toBe(true)
    // an object with no "_type"
    expect(get(remapped, 'stories1.article1._weak')).toBe(true)
  })

  it('should make all existing references strong when specified', () => {
    const remapped = createRemapDocumentReferences([
      mockDoc,
      ...mockArticles,
      ...mockAuthors,
      ...mockSections,
    ])(mockDoc, false)
    expect(get(remapped, 'section._weak')).toBe(false)
    expect(get(remapped, 'authors[0]._weak')).toBe(false)
    expect(get(remapped, 'authors[1]._weak')).toBe(false)
    expect(get(remapped, 'story.article._weak')).toBe(false)
    // an object with no "_type"
    expect(get(remapped, 'stories1.article1._weak')).toBe(false)
  })
})

describe('remapReferences', () => {
  it('should not omit asset references', () => {
    const remap = createRemapReferences([mockDoc], migratedAssets)
    const remapped = remap(mockDoc)
    expect(get(remapped, 'featuredImage.asset._ref')).toBe(migratedImage1._id)
    expect(get(remapped, 'featuredImage.asset._weak')).toBe(true)
  })
})

describe('getUploadedFilename', () => {
  it('should return the filename from the URL', () => {
    expect(getUploadedFilename(migratedImage1)).toBe('food-logo.svg')
  })
})

describe('typeguards', () => {
  it('isAsset', () => {
    expect(isAsset(mockArticles[0])).toBe(false)
    expect(isAsset(migratedImage1)).toBe(true)
  })

  it('isSanityAssetObject', () => {
    expect(isSanityAssetObject(mockDoc.featuredImage)).toBe(true)
    expect(isSanityAssetObject(migratedImage1)).toBe(false)
  })

  it('isSanityObject', () => {
    expect(isSanityObject(mockDoc.stories1)).toBe(true)
    expect(isSanityObject(mockDoc.layoutModules)).toBe(false)
  })

  it('isReference', () => {
    expect(isReference(mockDoc.story)).toBe(false)
    expect(isReference(mockDoc.section)).toBe(true)
  })

  it('isMigratedDocument', () => {
    expect(isMigratedDocument(migratedAssets[0])).toBe(true)
    expect(
      isMigratedDocument({
        source: migratedAssets[0].source,
      })
    ).toBe(false)
  })
})

describe('getAssetType', () => {
  it('should return "image" for images', () => {
    expect(getAssetType(sourceImage1)).toBe('image')
  })

  it('should return "file" for files', () => {
    const dummyFile = {
      ...sourceImage1,
      _type: 'sanity.fileAsset',
    }
    expect(getAssetType(dummyFile)).toBe('file')
  })

  it('should throw if given a non-asset', () => {
    const fn = () => getAssetType(mockSections[0])
    expect(fn).toThrow('"section" is not a valid sanity asset type')
  })
})
