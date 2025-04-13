import { WebClient } from '@slack/web-api'
import { isEmpty } from 'lodash'
import { getAllUserPreferences, getLastTechMessageInfo, getUserPreferences, saveLastTechMessageTs } from '../utils/database'
import { generateTechCategoryBlocks } from '../utils/techCategoriesUtil'

export const setupCommandHandlers = (
  app: any,
  preferences: Record<string, string[]>,
  client: WebClient,
) => {
  app.command('/definetech', async ({command, ack, respond}: any) => {
    await ack()

    const userId = command.user_id
    const channelId = command.channel_id

    try {
      // Check if user has a previous tech preferences message and delete it
      const lastMessageInfo = await getLastTechMessageInfo(userId)
      if (lastMessageInfo.channelId && lastMessageInfo.messageTs) {
        try {
          await client.chat.delete({
            channel: lastMessageInfo.channelId,
            ts: lastMessageInfo.messageTs,
            as_user: true
          })
        } catch (deleteError) {
          // Ignore errors when deleting previous message (it might have been deleted manually)
          console.error('Error deleting previous tech message, continuing anyway:', deleteError)
        }
      }

      // Get user preferences from PocketBase
      const userPrefs = preferences[userId] || (await getUserPreferences(userId)) || []

      // Get the blocks for tech categories, passing existing preferences
      const blocks = await generateTechCategoryBlocks(userPrefs)

      // Add header block to explain the command
      blocks.unshift(
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

      // Send message and save its ID
      const messageResponse = await client.chat.postMessage({
        channel: channelId,
        blocks,
        text: 'Select your tech preferences'
      })

      if (messageResponse.ok && messageResponse.ts) {
        // Save the new message information
        await saveLastTechMessageTs(userId, channelId, messageResponse.ts)
      }
    } catch (error) {
      console.error('Error in /definetech command:', error)
      await respond({
        response_type: 'ephemeral',
        text: 'Sorry, there was an error processing your request. Please try again later.',
      })
    }
  })

  app.command('/matchdev', async ({command, ack, respond, client}: any) => {
    await ack()

    const userId = command.user_id

    // Get user preferences from PocketBase
    const userPrefs = preferences[userId] || (await getUserPreferences(userId)) || []

    if (isEmpty(userPrefs)) {
      await client.chat.postMessage({
        channel: command.channel_id,
        text: `You don't have any preferences set. Use /definetech to set your preferences first.`,
      })
      return
    }

    // Get latest preferences for all users
    const allPreferences = await getAllUserPreferences()

    // Find users with matching preferences and calculate intersection
    const usersWithMatches = await Promise.all(
      Object.entries(allPreferences)
        .filter(([id]) => id !== userId && !isEmpty(allPreferences[id]))
        .map(async ([id, prefs]) => {
          // Find matching preferences
          const matchingPrefs = prefs.filter(pref => userPrefs.includes(pref))

          if (isEmpty(matchingPrefs)) return null

          // Get user info to display name instead of ID
          const userInfo = await client.users.info({user: id})
          const username = userInfo.user?.real_name || userInfo.user?.name || id

          // Calculate match percentage based on intersection size divided by the smaller set size
          // This ensures having more techs doesn't decrease match percentage
          const matchPercentage = Math.round((matchingPrefs.length / Math.min(userPrefs.length, prefs.length)) * 100)

          return {
            username,
            matchingPrefs,
            matchPercentage,
          }
        }),
    )

    // Filter out null results and sort by match percentage
    const validMatches = usersWithMatches
      .filter(Boolean)
      .sort((a, b) => b.matchPercentage - a.matchPercentage)

    if (isEmpty(validMatches)) {
      await client.chat.postMessage({
        channel: command.channel_id,
        text: `No users found with similar tech preferences. Encourage your teammates to use /definetech!`,
      })
      return
    }

    // Format the output message with single backquotes around preferences
    const matchesText = validMatches
      .map(
        match =>
          `*${match.username}* (${match.matchPercentage}% match): ${match.matchingPrefs.map(pref => `\`${pref}\``).join(', ')}`,
      )
      .join('\n')

    // Find top matches for the summary
    const topMatches = validMatches.slice(0, 3)
    const topMatchesNames = topMatches.map(m => m.username).join(', ')

    await client.chat.postMessage({
      channel: command.channel_id,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '👩‍💻 Found Your Tech Matches! 👨‍💻',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Found *${validMatches.length}* ${validMatches.length === 1 ? 'dev' : 'devs'} with matching tech preferences. Top matches: ${topMatchesNames}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: matchesText,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_Percentages based on shared technologies relative to smallest tech set_`,
            },
          ],
        },
      ],
      text: `Found ${validMatches.length} devs with matching tech preferences`,
    })
  })
}
