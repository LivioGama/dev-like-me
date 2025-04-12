import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import { registerCommands } from './handlers/commands.js';
import { initDatabase } from './utils/database.js';

dotenv.config();

// Initialize the app with your bot token and signing secret from environment variables
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initialize in-memory database
const userPreferences = initDatabase();

// Register commands
registerCommands(app, userPreferences);

// Start the app
const startApp = async () => {
  await app.start();
  console.log('⚡️ Bolt app is running!');
};

startApp();
