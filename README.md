# Dev Like Me

A Slack bot for finding developers with similar tech interests.

## Features

- `/definetech` - Set your tech preferences
- `/matchdev` - Find other developers with similar tech interests

## Setup locally

- Clone this repository
- Install dependencies: `bun install`
- Copy `.env.example` to `.env` and fill in your Slack bot token and signing secret
- Start the bot: `bun start`

## PocketBase Setup locally

1. Run: `bun run pocketbase`
2. Access the admin UI at `http://127.0.0.1:8090/_/`
3. Create an admin account when prompted
4. The app uses PocketBase migrations to create the required collections (`slack_devs` and `tech_categories`)

## Technology Dashboard

A web dashboard is available to manage technologies in the database:
- https://devlikeme.liviogama.com/
