import { isEmpty } from 'lodash'
import PocketBase from 'pocketbase'

const isDev = process.env.NODE_ENV !== 'production'
let pb: PocketBase

export const initDatabase = async () => {
  // Initialize PocketBase connection
  pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090')

  try {
    // Check if the collection exists, create it if it doesn't
    if (isDev) {
      await ensureCollectionExists()
    }
    
    return pb
  } catch (error) {
    console.error('Error initializing PocketBase:', error)
    throw error
  }
}

const ensureCollectionExists = async () => {
  try {
    // Check if the collection already exists
    await pb.collections.getOne('slack_devs')
  } catch (error) {
    // Collection doesn't exist, create it
    try {
      await pb.collections.create({
        name: 'slack_devs',
        type: 'base',
        schema: [
          {
            name: 'slackUserId',
            type: 'text',
            required: true,
            unique: true
          },
          {
            name: 'prefs',
            type: 'json',
            required: false
          }
        ]
      })
      console.log('Created slack_devs collection')
    } catch (createError) {
      console.error('Error creating collection:', createError)
    }
  }
}

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
