import { App } from '@slack/bolt'
import { WebClient } from '@slack/web-api'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { setupActionHandlers } from './handlers/actions'
import { setupCommandHandlers } from './handlers/commands'
import { getAllUserPreferences, initDatabase } from './utils/database'

dotenv.config()

const PORT = Number(process.env.PORT) || 3000
const STATIC_PORT = PORT + 1

// Default values for development
const isDev = process.env.NODE_ENV !== 'production'
const signingSecret = process.env.SLACK_SIGNING_SECRET
const botToken = process.env.SLACK_BOT_TOKEN

if (!signingSecret) {
  throw new Error('SLACK_SIGNING_SECRET is required')
}

// Initialize the Slack app
const app = new App({
  token: botToken,
  signingSecret,
  socketMode: false,
  port: PORT,
})

// Initialize the WebClient
const client = new WebClient(botToken)

const expressApp = express()
const staticPath = path.join(__dirname, '../public')

expressApp.use(express.static(staticPath))

expressApp.use((req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'))
})

const startApp = async () => {
  try {
    await initDatabase()

    // Get all user preferences from PocketBase
    const userPreferences = await getAllUserPreferences()

    // Set up action handlers
    setupActionHandlers(app, userPreferences, client)

    // Set up command handlers
    setupCommandHandlers(app, userPreferences, client)

    await app.start()
    console.log(
      `⚡️ Slack Bolt app is running in ${isDev ? 'development' : 'production'} mode on port ${PORT}!`,
    )

    expressApp.listen(STATIC_PORT, () => {
      console.log(`📊 Static file server running on port ${STATIC_PORT}!`)
    })
  } catch (error) {
    console.error('Error starting app:', error)
    process.exit(1)
  }
}

startApp()
