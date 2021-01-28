import { SanityAssetDocument } from '@sanity/client'
import { MigratedAsset, SanityDocument } from '../../types'
import { getImageHash } from '../parsing'

export const sourceImage1: SanityAssetDocument = {
  _createdAt: '2020-03-19T16:12:52Z',
  _id: 'image-1',
  _rev: 'o4d7Jp97n3QbbasabvN5uU',
  _type: 'sanity.imageAsset',
  _updatedAt: '2020-03-19T16:12:52Z',
  assetId: '16e00765731c34d54d301d7f11d435fc6d2ffd8e',
  extension: 'svg',
  mimeType: 'image/svg+xml',
  originalFilename: 'Sports Logo Copy.svg',
  path:
    'images/z2aip6ei/production/16e00765731c34d54d301d7f11d435fc6d2ffd8e-467x100.svg',
  sha1hash: '16e00765731c34d54d301d7f11d435fc6d2ffd8e',
  size: 4477,
  uploadId: '4gjptnOTKAcKOS3N08hxV6a2OR8Ltgcw',
  url:
    'https://cdn.sanity.io/images/z2aip6ei/production/16e00765731c34d54d301d7f11d435fc6d2ffd8e-467x100.svg',
  metadata: {
    lqip: 'a123456789',
  },
}

export const migratedImage1: SanityAssetDocument = {
  _type: 'sanity.imageAsset',
  _rev: '123',
  _createdAt: 'yesterday',
  _updatedAt: 'yesterday',
  uploadId: '9JKHaboqln0ypHm1KTr7qSz9QdyOizjg',
  _id: 'new-image-1',
  label: getImageHash(sourceImage1),
  assetId: '0a22f19843395c27c549d2f345035b3e7120e037',
  sha1hash: '0a22f19843395c27c549d2f345035b3e7120e037',
  path: 'images/nys454mt/staging/food-logo.svg',
  url: 'https://cdn.sanity.io/images/nys454mt/staging/food-logo.svg',
  originalFilename: '16e00765731c34d54d301d7f11d435fc6d2ffd8e-467x100.svg',
  extension: 'svg',
  size: 4378,
  mimeType: 'image/svg+xml',
  metadata: {
    lqip: 'a123456789',
  },
}

export const sourceImage2: SanityAssetDocument = {
  _createdAt: '2020-03-19T16:12:52Z',
  _id: 'image-2',
  _rev: 'o4d7Jp97n3QbbasabvN5uU',
  _type: 'sanity.imageAsset',
  _updatedAt: '2020-03-19T16:12:52Z',
  assetId: 'zzz00765731c34d54d301d7f11d435fc6d2ffd8e',
  extension: 'svg',
  mimeType: 'image/svg+xml',
  originalFilename: 'frank.png',
  path:
    'images/z2aip6ei/production/16e00765731c34d54d301d7f11d435fc6d2ffd8e-467x100.svg',
  sha1hash: '16e00765731c34d54d301d7f11d435fc6d2ffd8e',
  size: 4477,
  uploadId: '4gjptnOTKAcKOS3N08hxV6a2OR8Ltgcw',
  url:
    'https://cdn.sanity.io/images/z2aip6ei/production/16e00765731c34d54d301d7f11d435fc6d2ffd8e-467x100.svg',
  metadata: {
    lqip: 'b123456789',
  },
}

export const migratedImage2: SanityAssetDocument = {
  _type: 'sanity.imageAsset',
  _rev: '123',
  _createdAt: 'yesterday',
  _updatedAt: 'yesterday',
  uploadId: '9JKHaboqln0ypHm1KTr7qSz9QdyOizjg',
  _id: 'new-image-2',
  label: getImageHash(sourceImage2),
  assetId: 'f3e2f19843395c27c549d2f345035b3e7120e037',
  sha1hash: 'f3e2f19843395c27c549d2f345035b3e7120e037',
  path:
    'images/nys454mt/staging/f3e2f19843395c27c549d2f345035b3e7120e037-467x100.svg',
  url:
    'https://cdn.sanity.io/images/nys454mt/staging/f3e2f19843395c27c549d2f345035b3e7120e037-467x100.svg',
  originalFilename: '16e00765731c34d54d301d7f11d435fc6d2ffd8e-467x100.svg',
  extension: 'svg',
  size: 4378,
  mimeType: 'image/svg+xml',
  metadata: {
    lqip: 'b123456789',
  },
}

export const mockSections: SanityDocument[] = [
  {
    _type: 'section',
    _id: 'section-1',
    title: 'Section One',
  },
]

export const mockAuthors: SanityDocument[] = [
  {
    _type: 'author',
    _id: 'author-1',
    name: 'Frank',
  },
  {
    _type: 'author',
    _id: 'author-2',
    name: 'Muenster',
  },
]

export const mockArticles: SanityDocument[] = [
  {
    _id: 'article-1',
    _type: 'article',
    title: 'How to give your dog a haircut at home',
  },
  {
    _id: 'article-2',
    _type: 'article',
    title: 'How to give your dog a haircut at home part 2',
  },
]

export const mockDoc: SanityDocument = {
  _id: 'abc',
  _type: 'article',
  _rev: '123',
  title: 'Some Article',
  someField: undefined,
  _updatedAt: 'yesterday',
  _createdAt: 'yesterday',
  section: {
    _type: 'reference',
    _ref: 'section-1',
  },
  story: {
    _type: 'storyBlock',
    article: {
      _type: 'reference',
      _ref: 'article-1',
    },
  },
  stories1: {
    article1: {
      _type: 'reference',
      _ref: 'article-2',
    },
  },
  layoutModules: [
    {
      _type: 'layoutModule',
      widgets: {
        _key: '7230a163c7df',
        _type: 'photoSlideshowWidget',
        slides: [
          {
            _type: 'slide',
            _key: '18e6005a89d5',
            image: {
              _type: 'image',
              asset: {
                _ref: sourceImage2._id,
                _type: 'reference',
              },
            },
          },
          {
            _key: '3b6796158e6a',
            _type: 'slide',
            image: {
              _type: 'image',
              asset: {
                _ref: sourceImage2._id,
                _type: 'reference',
              },
            },
          },
        ],
        title: 'Journal of a Plague',
      },
    },
  ],

  authors: [
    {
      _ref: 'author-1',
      _type: 'reference',
    },
    {
      _ref: 'author-2',
      _type: 'reference',
    },
  ],
  featuredImage: {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: sourceImage1._id,
    },
  },
  gallery: [
    {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: sourceImage1._id,
      },
    },
    {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: sourceImage1._id,
      },
    },
  ],
  nestedGallery: {
    _type: 'gallery',
    modules: [
      {
        _id: 'module-1',
        _type: 'module',
        images: [
          {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: sourceImage1._id,
            },
          },
        ],
      },
    ],
  },
}

export const migratedAssets: MigratedAsset[] = [
  {
    source: sourceImage1,
    destination: migratedImage1,
  },
  {
    source: sourceImage2,
    destination: migratedImage2,
  },
]
