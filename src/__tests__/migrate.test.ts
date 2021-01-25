import CreateClient from '@sanity/client'
import { migrate } from '../index'

const sourceClientOpts = {
  projectId: '123',
  dataset: 'production',
  useProjectHostname: true,
  useCdn: true,
}

const destClientOpts = {
  projectId: '123',
  dataset: 'staging',
  useProjectHostname: true,
  token: 'abc123xyz',
  useCdn: true,
}

const initialQueries = [{ query: '*[_type == "someType"]' }]

describe('migrate', () => {
  it('should throw if both clients are the same', async () => {
    const config = {
      destination: {
        client: CreateClient(sourceClientOpts),
      },
      source: {
        client: CreateClient(sourceClientOpts),
        initialQueries,
      },
    }

    await expect(migrate(config)).rejects.toThrow(
      'Both clients have the same configuration'
    )
  })

  it('should throw if the source client has a token', async () => {
    console.warn = () => undefined
    const config = {
      source: {
        client: CreateClient({
          ...sourceClientOpts,
          token: '123qwerty',
        }),
        initialQueries,
      },

      destination: {
        client: CreateClient(destClientOpts),
      },
    }
    await expect(migrate(config)).rejects.toThrow(
      'The source client must not have a token'
    )
  })

  it('should throw if there are no initial queries', async () => {
    const config = {
      source: {
        client: CreateClient(sourceClientOpts),
        initialQueries: [],
      },

      destination: {
        client: CreateClient(destClientOpts),
      },
    }
    await expect(migrate(config)).rejects.toThrow(
      'You must include at least one initial query'
    )
  })

  it('should throw if the destination client does not have a token', async () => {
    const config = {
      source: {
        client: CreateClient(sourceClientOpts),
        initialQueries,
      },

      destination: {
        client: CreateClient({ ...destClientOpts, token: undefined }),
      },
    }
    await expect(migrate(config)).rejects.toThrow('must have a write token')
  })
})
