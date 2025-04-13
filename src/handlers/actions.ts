import {WebClient} from '@slack/web-api'
import {getUserPreferences, saveLastTechMessageTs, saveUserPreferences} from '../utils/database'
import {generateTechCategoryBlocks} from '../utils/techCategoriesUtil'

export const setupActionHandlers = (app: any, userPreferences: Record<string, string[]>, client: WebClient) => {
  // Handle tech button actions
  app.action(/^action_/, async ({ack, body, action, respond}: any) => {
    await ack()

    const userId = body.user.id
    const messageTs = body.message.ts
    const channelId = body.channel.id

    try {
      // Get current user preferences from PocketBase
      const currentPrefs = userPreferences[userId] || await getUserPreferences(userId) || []

      // Convert to Set for easy manipulation
      const userPrefsSet = new Set(currentPrefs)

      const tech = (action as any).value

      // Toggle selection
      if (userPrefsSet.has(tech)) {
        userPrefsSet.delete(tech)
      } else {
        userPrefsSet.add(tech)
      }

      // Convert Set back to array
      const updatedPrefs = Array.from(userPrefsSet)

      // Save to PocketBase
      await saveUserPreferences(userId, updatedPrefs)

      // Update in-memory cache
      userPreferences[userId] = updatedPrefs

      // Regenerate all blocks with updated selections
      const updatedBlocks = await generateTechCategoryBlocks(updatedPrefs)

      // Add header block to re-explain the command
      updatedBlocks.unshift(
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Tech Preferences',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Select your tech preferences by clicking the buttons below. Your selections are automatically saved when you click a button. These preferences will help us match you with other devs with similar interests.',
          },
        },
      )

      // Update the message
      const updateResponse = await client.chat.update({
        channel: channelId,
        ts: messageTs,
        blocks: updatedBlocks,
        text: 'Select your tech preferences'
      })

      // Update the stored message timestamp if the message was updated
      if (updateResponse.ok && updateResponse.ts) {
        await saveLastTechMessageTs(userId, channelId, updateResponse.ts)
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      await respond({
        response_type: 'ephemeral',
        text: 'Sorry, there was an error updating your preferences. Please try again later.'
      })
    }
  })
}
