import { WebClient } from '@slack/web-api'
import { getUserPreferences, saveUserPreferences } from '../utils/database'
import { generateTechCategoryBlocks } from '../utils/techCategoriesUtil'

export const setupActionHandlers = (app: any, userPreferences: Record<string, string[]>, client: WebClient) => {
  // Handle tech button actions
  app.action(/^tech_/, async ({ack, body, action, respond}: any) => {
    await ack()
    
    const userId = body.user.id
    
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
      
      // Update the message with all new blocks
      await respond({
        response_type: 'ephemeral',
        replace_original: true,
        blocks: updatedBlocks,
        text: 'Select your tech preferences'
      })
    } catch (error) {
      console.error('Error updating preferences:', error)
      await respond({
        response_type: 'ephemeral',
        text: 'Sorry, there was an error updating your preferences. Please try again later.'
      })
    }
  })
} 