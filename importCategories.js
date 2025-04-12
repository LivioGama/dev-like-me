import dotenv from 'dotenv'
import PocketBase from 'pocketbase'
import {techCategories} from "./src/models/techCategories.js";

dotenv.config()

const COLLECTION_NAME = 'tech_categories'
const isDev = process.env.NODE_ENV !== 'production'

const PB_URL = isDev ? 'http://127.0.0.1:8090' : 'https://devlikeme-pocketbase.liviogama.com'

const importTechCategories = async () => {
  console.log('Starting tech categories import...')

  // Initialize PocketBase connection
  const pb = new PocketBase(PB_URL)
  pb.autoCancellation(false)

  try {
    // Authenticate with PocketBase
    console.log('Authenticating with PocketBase...')
    await pb
      .collection('_superusers')
      .authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD)
    console.log('Authentication successful')

    console.log(`Found ${techCategories.length} tech categories to import`)

    // Clear existing records if any
    await clearExistingRecords(pb)

    // Import each category
    for (const category of techCategories) {
      await importCategory(pb, category)
    }

    console.log('Import completed successfully!')
  } catch (error) {
    console.error('Error during import:', error)
  }
}


const clearExistingRecords = async pb => {
  try {
    const records = await pb.collection(COLLECTION_NAME).getFullList()

    if (records.length > 0) {
      console.log(`Removing ${records.length} existing records...`)

      for (const record of records) {
        await pb.collection(COLLECTION_NAME).delete(record.id)
      }

      console.log('Existing records removed')
    }
  } catch (error) {
    console.error('Error clearing existing records:', error)
    throw error
  }
}

const importCategory = async (pb, category) => {
  try {
    console.log(
      `Importing "${category.title}" with ${category.technologies.length} technologies...`,
    )

    await pb.collection(COLLECTION_NAME).create({
      title: category.title,
      technologies: category.technologies,
    })

    console.log(`Imported "${category.title}" successfully`)
  } catch (error) {
    console.error(`Error importing category "${category.title}":`, error)
  }
}

// Run the import
importTechCategories()
