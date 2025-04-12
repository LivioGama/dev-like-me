import { techCategories } from '../models/techCategories'

const getCategoryEmoji = (category: string): string => {
  switch (category) {
    case 'Frontend':
      return '🖥️'
    case 'Backend':
      return '⚙️'
    case 'Database':
      return '🗄️'
    case 'DevOps':
      return '🚀'
    case 'Design':
      return '🎨'
    case 'QA':
      return '🧪'
    default:
      return '💻'
  }
}

export const generateTechCategoryBlocks = (userSelections?: string[]) => {
  const blocks: any[] = []

  techCategories.forEach(category => {
    const emoji = getCategoryEmoji(category.title)

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *${category.title} Technologies*`,
      },
    })

    if (category.title !== 'Frontend') {
      blocks.push({
        type: 'divider',
      })
    }

    blocks.push({
      type: 'actions',
      block_id: `${category.title.toLowerCase()}_techs`,
      elements: category.technologies.map(tech => {
        const isSelected = userSelections?.includes(tech.value)
        return {
          type: 'button',
          action_id: tech.id,
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
