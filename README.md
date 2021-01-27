<div style="text-align: center">
# Sanity Graph Import
</div>

<p align="center">
<img alt="Latest Release" src="https://img.shields.io/github/v/release/sanctuarycomputer/sanity-graph-import?color=green">
<img alt="Build Status" src="https://img.shields.io/github/checks-status/sanctuarycomputer/sanity-graph-import/main" />
<img alt="Code Type" src="https://img.shields.io/github/languages/top/sanctuarycomputer/sanity-graph-import" />
<a href="#Contributors">
  <img alt="Contributor Count" src="https://img.shields.io/github/all-contributors/sanctuarycomputer/sanity-graph-import/main?color=green">
</a>
</p>

`sanity-graph-import` is a tool for making partial migrations from one [Sanity](https://www.sanity.io) dataset or project to another. This can be useful if you only want to import particular documents and those they reference. A common use case might be "refreshing" a staging dataset from production - when the production dataset is large and would otherwise take a lot of time and bandwidth to export & import.

This script will take a selection of initial documents (provided by you as simple Sanity queries), then traverse through all documents it references, find all assets used by any of these documents, then add them to your destination dataset as a "complete" dataset with fully resolved references.

Example: Your **production** dataset has 1000's of `article` documents, each of which contain references to one or more `author` documents. For your staging dataset, you only want the first 10 articles *and* their authors -- as well as any image & file assets these documents include.

Looking to copy an entire dataset? Use [Sanity's CLI instead](https://www.sanity.io/docs/importing-data) instead.

### Coming Soon

- Run from the command line
- Specify the depth of graph traversal (current default is 1)

# Installation

`yarn add @sanctucompu/sanity-graph-import`

# Usage

```js
// my-project/scripts/migrate.js
import { migrate } from '@sanctucompu/sanity-graph-import'
import CreateClient from '@sanity/client'

const sourceClient = CreateClient({
  projectId: 'abc123xyz',
  dataset: 'production',
})

const destinationClient = CreateClient({
  projectId: 'abc123xyz',
  dataset: 'staging',
  token: '789abc123xyz' // Required!
})

const initialQueries = [
  /* Fetch the 10 latest articles */
  {
    query: `
      *[_type == 'article']
      | order(releaseDate desc)
      | order(_createdAt desc) [0...$count]
    `,
    params: {
      count: 10
    }
  },
  /* Fetch the homepage document */
  {
    query: `*[_type == 'homepage']`
  }
]



async function run() {
  const config = {
    source: {
      client: sourceClient,
      initialQueries
    },
    desitination: {
      client: destinationClient
    }
  }

  await migrate(config)
}

run()
```

Then, run `node my-project/scripts/migrate.js`

This configuration will populate your destination dataset with:

- 10 article documents
- Every author document referenced in those articles
- The homepage document
- All assets from all of the above
- And any other documents referenced in the articles or the homepage

# API

## `migrate(config)`

**Returns**

A promise that resolve's with the final mutation results.

**`config`**: `ImportConfig`

```ts
interface ImportConfig {
  source: SourceConfig
  destination: DestinationConfig
}

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
}
```

# Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

# License

MIT

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://www.good-idea.studio"><img src="https://avatars.githubusercontent.com/u/11514928?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Joseph Thomas</b></sub></a><br /><a href="https://github.com/sanctuarycomputer/sanity-graph-import/commits?author=good-idea" title="Documentation">📖</a> <a href="https://github.com/sanctuarycomputer/sanity-graph-import/commits?author=good-idea" title="Code">💻</a> <a href="https://github.com/sanctuarycomputer/sanity-graph-import/commits?author=good-idea" title="Tests">⚠️</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
