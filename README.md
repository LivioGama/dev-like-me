# Dev Like Me

[![Made with Bun](https://img.shields.io/badge/Bun-F9F1E1?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh) [![Slack](https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white)](https://slack.com) [![PocketBase](https://img.shields.io/badge/PocketBase-B8DBE4?style=for-the-badge&logo=pocketbase&logoColor=black)](https://pocketbase.io/)

A Slack bot for finding developers with similar tech interests and preferences.

## 🚀 Features

- `/definetech` - Set your personal tech preferences
  
  ![Define Tech](/docs/prefs.webp)

- `/matchdev` - Find other developers with similar tech interests
  
  ![Match Developers](/docs/match.webp)

## 🖥️ Technology Management Dashboard

Manage technologies in the database through a web interface:

🔗 **[https://devlikeme.liviogama.com](https://devlikeme.liviogama.com)**

![Dashboard](/docs/dashboard.webp)

> **⚠️ Note:** Slack blocks payload doesn't allow more than 50 elements, which explains why many elements are commented out in `techCategories.js`. Please be selective about what to add.

## 🛠️ Local Setup

### Prerequisites

- [Bun](https://bun.sh) installed
- A Slack workspace with admin privileges
- Tunnel service (ngrok, serveo, etc.) for exposing localhost

### Frontend

1. Clone this repository
2. Install dependencies:
   ```bash
   bun i
   ```
3. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Fill in your Slack bot token and signing secret

4. Start the development server:
   ```bash
   bun run dev
   ```

### Backend

1. Start PocketBase:
   ```bash
   bun run pocketbase
   ```

2. Access admin UI at [http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/) and create an admin account

3. The app uses PocketBase migrations to create collections (`slack_devs` and `tech_categories`)
   - If migrations fail, import from `pocketbase/pb_schema.json` in the PocketBase UI
   - Import default categories:
     ```bash
     bun run import-categories
     ```

## 🔌 Slack App Configuration

This app is built with [@slack/bolt](https://github.com/slackapi/bolt-js). To configure your Slack app:

1. Create a new Slack app in your workspace
2. Add a bot user
3. Set environment variables:
   - `SLACK_SIGNING_SECRET` 
   - `SLACK_BOT_TOKEN`
4. Configure slash commands pointing to your tunneled URL:
   - `/definetech` → `http://[your-tunnel-url]/slack/events`
   - `/matchdev` → `http://[your-tunnel-url]/slack/events`
5. Enable interactions with the same endpoint:
   - `http://[your-tunnel-url]/slack/events`

## 📝 License

MIT
