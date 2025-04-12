const pb = new PocketBase('https://devlikeme-pocketbase.liviogama.com')
const COLLECTION_NAME = 'tech_categories'
const categoriesContainer = document.getElementById('categoriesContainer')
const currentYearSpan = document.getElementById('current-year')

const init = async () => {
  try {
    document.body.classList.add('loading-state')
    setupCurrentYear()
    await loadCategories()
    document.body.classList.remove('loading-state')
  } catch (error) {
    console.error('Initialization error:', error)
    showError('Failed to initialize the application. Please check if PocketBase is running.')
    document.body.classList.remove('loading-state')
  }
}

const setupCurrentYear = () => {
  currentYearSpan.textContent = new Date().getFullYear()
}

const loadCategories = async () => {
  try {
    categoriesContainer.innerHTML = `
      <div class="loading">
        <i class="fas fa-circle-notch fa-spin"></i> Loading technologies...
      </div>`

    const records = await pb.collection(COLLECTION_NAME).getFullList({
      sort: 'title',
    })

    categoriesContainer.innerHTML = ''

    if (!records.length) {
      categoriesContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-database"></i>
          <p>No technology categories found</p>
        </div>`
      return
    }

    records.forEach((category, index) => {
      const categoryCard = createCategoryCard(category)
      categoriesContainer.appendChild(categoryCard)

      // Add staggered animation
      setTimeout(() => {
        categoryCard.classList.add('visible')
      }, index * 100)
    })
  } catch (error) {
    console.error('Error loading categories:', error)
    categoriesContainer.innerHTML = `
      <div class="loading error">
        <i class="fas fa-triangle-exclamation"></i>
        <p>Failed to load technology categories</p>
      </div>`
  }
}

const createCategoryCard = category => {
  const categoryEl = document.createElement('div')
  categoryEl.className = 'category-card'
  categoryEl.dataset.id = category.id

  const titleEl = document.createElement('div')
  titleEl.className = 'category-title'
  titleEl.innerHTML = `
    <span><i class="fas fa-layer-group"></i> ${category.title}</span>
    <span class="tech-count">${category.technologies?.length || 0} technologies</span>
  `

  const techList = document.createElement('ul')
  techList.className = 'tech-list'

  if (category.technologies && category.technologies.length) {
    category.technologies.forEach(tech => {
      const techItem = document.createElement('li')
      techItem.className = 'tech-item'
      techItem.innerHTML = `<span><i class="fas fa-microchip"></i> ${tech.value}</span>`
      techList.appendChild(techItem)
    })
  } else {
    const emptyItem = document.createElement('li')
    emptyItem.className = 'empty-tech'
    emptyItem.innerHTML = '<i class="fas fa-circle-info"></i> No technologies added yet'
    techList.appendChild(emptyItem)
  }

  // Add "Add Tech" button directly to each category card
  const addTechDiv = document.createElement('div')
  addTechDiv.className = 'add-tech-inline'

  const addTechInput = document.createElement('input')
  addTechInput.type = 'text'
  addTechInput.placeholder = 'New technology name'

  const addTechBtn = document.createElement('button')
  addTechBtn.innerHTML = '<i class="fas fa-plus"></i> Add'
  addTechBtn.className = 'add-tech-btn'
  addTechBtn.type = 'button' // Explicitly set button type

  addTechDiv.appendChild(addTechInput)
  addTechDiv.appendChild(addTechBtn)

  // Handle button click with preventDefault
  addTechBtn.addEventListener('click', event => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    const techName = addTechInput.value.trim()
    if (techName) {
      // Check for duplicates
      if (category.technologies && category.technologies.some(tech =>
        tech.value.toLowerCase() === techName.toLowerCase())) {
        showError(`"${techName}" already exists in this category`)
        addTechInput.focus()
        return
      }

      addTechnology(category.id, techName, addTechBtn, techList, category)
      addTechInput.value = ''
    } else {
      showError('Please enter a technology name')
      addTechInput.focus()
    }
  })

  // Handle Enter key with preventDefault
  addTechInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      addTechBtn.click()
    }
  })

  categoryEl.appendChild(titleEl)
  categoryEl.appendChild(techList)
  categoryEl.appendChild(addTechDiv)

  return categoryEl
}

const addTechnology = async (categoryId, techName, button, techList, category) => {
  try {
    // Show loading state on button
    const originalContent = button.innerHTML
    button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Adding'
    button.disabled = true

    // Create tech ID
    const newTechId = generateTechId(category.title, techName)

    // Optimistic UI update - add item to DOM immediately
    const techItem = document.createElement('li')
    techItem.className = 'tech-item optimistic'
    techItem.innerHTML = `<span><i class="fas fa-microchip"></i> ${techName}</span>`

    // Remove empty message if it exists
    const emptyTech = techList.querySelector('.empty-tech')
    if (emptyTech) {
      techList.removeChild(emptyTech)
    }

    techList.appendChild(techItem)

    // Update the tech count in the UI
    const techCount = techList.closest('.category-card').querySelector('.tech-count')
    const currentCount = (category.technologies?.length || 0) + 1
    techCount.textContent = `${currentCount} technologies`

    // Clone the technologies array and add the new one
    const technologies = [...(category.technologies || [])]
    technologies.push({
      id: newTechId,
      value: techName,
    })

    // Update the local category object to keep it in sync
    category.technologies = technologies

    // Update server in the background
    await pb.collection(COLLECTION_NAME).update(categoryId, {
      technologies,
    })

    // Mark as successful
    techItem.classList.remove('optimistic')

    // Reset button state
    button.innerHTML = originalContent
    button.disabled = false
  } catch (error) {
    console.error('Error adding technology:', error)
    showError('Failed to add technology')

    // Find and remove the optimistic item
    const optimisticItem = techList.querySelector('.optimistic')
    if (optimisticItem) {
      techList.removeChild(optimisticItem)
    }

    // If this made the list empty again, restore the empty message
    if (!techList.children.length) {
      const emptyItem = document.createElement('li')
      emptyItem.className = 'empty-tech'
      emptyItem.innerHTML = '<i class="fas fa-circle-info"></i> No technologies added yet'
      techList.appendChild(emptyItem)
    }

    // Update the tech count back to original
    const techCount = techList.closest('.category-card').querySelector('.tech-count')
    techCount.textContent = `${category.technologies?.length || 0} technologies`

    // Reset button state
    button.innerHTML = '<i class="fas fa-plus"></i> Add'
    button.disabled = false
  }
}

const generateTechId = (categoryTitle, techName) => {
  const categoryPrefix = categoryTitle.toLowerCase().replace(/[^\w]/g, '_')
  const techSuffix = techName.toLowerCase().replace(/[^\w]/g, '_')
  return `${categoryPrefix}_${techSuffix}`
}

const showError = message => {
  const toast = document.createElement('div')
  toast.className = 'toast error'
  toast.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${message}`

  document.body.appendChild(toast)

  // Animate in
  setTimeout(() => {
    toast.classList.add('visible')
  }, 10)

  // Animate out and remove
  setTimeout(() => {
    toast.classList.remove('visible')
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 3000)
}

document.addEventListener('DOMContentLoaded', init)
