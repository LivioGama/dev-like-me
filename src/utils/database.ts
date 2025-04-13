import { isEmpty } from 'lodash'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090')
pb.autoCancellation(false)

export const getUserPreferences = async (userId: string): Promise<string[]> => {
  try {
    const records = await pb.collection('slack_devs').getFullList({
      filter: `slackUserId = "${userId}"`
    })

    if (isEmpty(records)) {
      return []
    }

    return records[0].prefs || []
  } catch (error) {
    console.error(`Error getting preferences for user ${userId}:`, error)
    return []
  }
}

export const getAllUserPreferences = async (): Promise<Record<string, string[]>> => {
  try {
    const records = await pb.collection('slack_devs').getFullList()

    return records.reduce((acc, record) => {
      acc[record.slackUserId] = record.prefs || []
      return acc
    }, {} as Record<string, string[]>)
  } catch (error) {
    console.error('Error getting all user preferences:', error)
    return {}
  }
}

export const saveUserPreferences = async (userId: string, prefs: string[]): Promise<void> => {
  try {
    // Check if user record exists
    const records = await pb.collection('slack_devs').getFullList({
      filter: `slackUserId = "${userId}"`
    })

    if (isEmpty(records)) {
      // Create new record
      await pb.collection('slack_devs').create({
        slackUserId: userId,
        prefs
      })
    } else {
      // Update existing record
      await pb.collection('slack_devs').update(records[0].id, {
        prefs
      })
    }
  } catch (error) {
    console.error(`Error saving preferences for user ${userId}:`, error)
  }
}

export const saveLastTechMessageTs = async (userId: string, channelId: string, messageTs: string): Promise<void> => {
  try {
    const records = await pb.collection('slack_devs').getFullList({
      filter: `slackUserId = "${userId}"`
    })

    if (isEmpty(records)) {
      await pb.collection('slack_devs').create({
        slackUserId: userId,
        lastTechMessageChannelId: channelId,
        lastTechMessageTs: messageTs,
        prefs: []
      })
    } else {
      await pb.collection('slack_devs').update(records[0].id, {
        lastTechMessageChannelId: channelId,
        lastTechMessageTs: messageTs
      })
    }
  } catch (error) {
    console.error(`Error saving last tech message TS for user ${userId}:`, error)
  }
}

export const getLastTechMessageInfo = async (userId: string): Promise<{channelId?: string, messageTs?: string}> => {
  try {
    const records = await pb.collection('slack_devs').getFullList({
      filter: `slackUserId = "${userId}"`
    })

    if (isEmpty(records) || !records[0].lastTechMessageTs) {
      return {}
    }

    return {
      channelId: records[0].lastTechMessageChannelId,
      messageTs: records[0].lastTechMessageTs
    }
  } catch (error) {
    console.error(`Error getting last tech message TS for user ${userId}:`, error)
    return {}
  }
}
