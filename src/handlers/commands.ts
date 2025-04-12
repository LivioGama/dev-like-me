import {App} from '@slack/bolt'

// In-memory user preferences storage
const userPreferences: Record<string, string[]> = {}

export const registerCommands = (app: App, preferences: Record<string, string[]>) => {
  // Register /techprefs command
  app.command('/techprefs', async ({ack, body, context}) => {
    await ack()
    // Open a modal for tech preferences
    await app.client.views.open({
      token: context.botToken,
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'techprefs_modal',
        title: {
          type: 'plain_text',
          text: 'Tech Preferences',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'techprefs_input',
            label: {
              type: 'plain_text',
              text: 'Enter your tech preferences (comma-separated)',
            },
            element: {
              type: 'plain_text_input',
              multiline: true,
            },
          },
          {
            type: 'actions',
            block_id: 'techprefs_actions',
            elements: [
              {
                type: 'button',
                action_id: 'save_preferences',
                text: {
                  type: 'plain_text',
                  text: 'Save',
                },
              },
              {
                type: 'button',
                action_id: 'cancel',
                text: {
                  type: 'plain_text',
                  text: 'Cancel',
                },
              },
            ],
          },
        ],
      },
    })
  })

  // Handle modal submission
  app.view('techprefs_modal', async ({ack, body, view}) => {
    await ack()
    const userId = body.user.id
    const preferencesInput = view.state.values.techprefs_input
    const preferencesArray = preferencesInput.techprefs_input.value
      .split(',')
      .map(item => item.trim())
    preferences[userId] = preferencesArray
    console.log(`User ${userId} preferences saved:`, preferencesArray)
  })

  // Handle modal actions
  app.action('save_preferences', async ({ack, body, context}) => {
    await ack()
    const userId = body.user.id
    const preferencesInput = context.views.state.values.techprefs_input
    const preferencesArray = preferencesInput.techprefs_input.value
      .split(',')
      .map(item => item.trim())
    preferences[userId] = preferencesArray
    console.log(`User ${userId} preferences saved:`, preferencesArray)
  })

  app.action('cancel', async ({ack, body}) => {
    await ack()
    console.log(`User ${body.user.id} cancelled preferences modal`)
  })

  // Register /finddevs command
  app.command('/finddevs', async ({ack, body, context}) => {
    await ack()
    const userId = body.user_id
    const userPrefs = preferences[userId] || []
    const similarUsers = Object.entries(preferences)
      .filter(([id, prefs]) => id !== userId && prefs.some(pref => userPrefs.includes(pref)))
      .map(([id]) => id)
    await app.client.chat.postMessage({
      channel: body.channel_id,
      text: `Users with similar preferences: ${similarUsers.join(', ') || 'none'}`,
    })
  })
}
