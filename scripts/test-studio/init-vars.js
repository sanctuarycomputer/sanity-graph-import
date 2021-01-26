const fs = require('fs')
const path = require('path')

const configPath = path.resolve(
  __dirname,
  '..',
  '..',
  'test-studio',
  'sanity.json'
)
const sanityConfig = require(configPath)

const dotenvPath = path.resolve(__dirname, '..', '..', '.env')

const projectId = sanityConfig.api.projectId
const sourceDataset = sanityConfig.api.dataset

const updatedSanityConfig = {
  ...sanityConfig,
  env: {
    ...sanityConfig.env,
    development: {
      dataset: 'staging',
      ...sanityConfig.env.development,
    },
  },
}

fs.writeFileSync(
  configPath,
  JSON.stringify(updatedSanityConfig, null, 2),
  'utf8'
)

const envContents = `
TEST_STUDIO_SOURCE_PROJECTID=${projectId}
TEST_STUDIO_SOURCE_DATASET=${sourceDataset}
TEST_STUDIO_TARGET_PROJECTID=${projectId}
TEST_STUDIO_SOURCE_DATASET=staging
`

fs.writeFileSync(dotenvPath, envContents, 'utf8')
