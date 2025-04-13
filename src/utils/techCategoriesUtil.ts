import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090')
pb.autoCancellation(false)

export const getCategoryEmoji = (category: string): string => {
  switch (category) {
    case 'AI Coding Tools':
      return '🤖'
    case 'Web Frontend':
      return '🖥️'
    case 'Web Frontend Storage':
      return '💾'
    case 'Web Frontend UI Libraries':
      return '🎨'
    case 'Mobile':
      return '📱'
    case 'Backend':
      return '⚙️'
    case 'SaaS':
      return '☁️'
    case 'Database':
      return '🗄️'
    case 'Task Management':
      return '📋'
    case 'Git Hosting':
      return '📂'
    case 'Languages':
      return '🔤'
    case 'DevOps':
      return '🚀'
    case 'Design':
      return '🎭'
    case 'QA':
      return '🧪'
    case 'Architecture':
      return '🏗️'
    default:
      return '💻'
  }
}

export const fetchTechCategories = async () => {
  try {
    const records = await pb.collection('tech_categories').getFullList()


    return records.map(record => ({
      title: record.title,
      technologies: record.technologies || []
    }))
  } catch (error) {
    console.error('Error fetching tech categories:', error)
  }
}

export const generateTechCategoryBlocks = async (userSelections?: string[]) => {
  const blocks: any[] = []

  const categories = await fetchTechCategories()

  categories.forEach(category => {
    const emoji = getCategoryEmoji(category.title)

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *${category.title} Technologies*`,
      },
    })

    blocks.push({
      type: 'divider',
    })

    blocks.push({
      type: 'actions',
      block_id: `${category.title.toLowerCase()}_techs`,
      elements: category.technologies.map(tech => {
        const isSelected = userSelections?.includes(tech.value)
        return {
          type: 'button',
          action_id: `action_${tech.id}`,
          text: {
            type: 'plain_text',
            text: isSelected ? `✅ ${tech.value}` : tech.value,
          },
          value: tech.value,
          style: isSelected ? 'primary' : undefined
        }
      }),
    })

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: ' ',
        },
      ],
    })
  })

  return blocks
}
