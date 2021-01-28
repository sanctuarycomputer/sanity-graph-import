import CreateClient from '@sanity/client'
import dotenv from 'dotenv'
import { migrate } from '../../src'

jest.mock('../utils/logging')
dotenv.config()

global.console.warn = jest.fn()
const sourceClient = CreateClient({
  projectId: process.env.TEST_STUDIO_SOURCE_PROJECTID as string,
  dataset: process.env.TEST_STUDIO_SOURCE_DATASET as string,
  useProjectHostname: true,
})

const destinationClient = CreateClient({
  projectId: process.env.TEST_STUDIO_TARGET_PROJECTID as string,
  dataset: process.env.TEST_STUDIO_TARGET_DATASET as string,
  token: process.env.TEST_STUDIO_TARGET_TOKEN as string,
  useProjectHostname: true,
})

const initialQueries = [
  {
    query: `
      *[_type == "movie"]
      | order(releaseDate desc)
      | order(_createdAt desc) [0...$count]
      `,
    params: { count: 5 },
  },
]

describe('Full migration', () => {
  it('should print the same output given the same HTTP requests', async () => {
    const config = {
      source: {
        client: sourceClient,
        initialQueries,
      },
      destination: {
        client: destinationClient,
        deleteData: true,
      },
    }
    await expect(migrate(config)).resolves.toBe(undefined)
    // @ts-ignore
    global.console.log.mock.calls.forEach((call) => {
      expect(call).toMatchSnapshot()
    })
  })
})
