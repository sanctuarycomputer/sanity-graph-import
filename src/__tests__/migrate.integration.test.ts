import CreateClient from '@sanity/client'
import { migrate } from '../../src'
import dotenv from 'dotenv'
dotenv.config()

const sourceClient = CreateClient({
  projectId: process.env.TEST_STUDIO_SOURCE_PROJECTID,
  dataset: process.env.TEST_STUDIO_SOURCE_DATASET,
})

const destinationClient = CreateClient({
  projectId: process.env.TEST_STUDIO_TARGET_PROJECTID,
  dataset: process.env.TEST_STUDIO_TARGET_DATASET,
  token: process.env.TEST_STUDIO_TARGET_TOKEN,
})

const initialQuer

const main = async () => {}

main()
