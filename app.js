document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let state = {
    stories: [],
    lastUpdated: null,
    bookmarks: JSON.parse(localStorage.getItem('briefly_bookmarks')) || [],
    currentCategory: 'All',
    viewingBookmarksOnly: false,
    currentOpenStoryRank: null
  };

  // DOM Elements
  const storyListEl = document.getElementById('story-list');
  const categoryContainerEl = document.getElementById('category-container');
  const toggleThemeBtn = document.getElementById('toggle-theme');
  const toggleBookmarksBtn = document.getElementById('toggle-bookmarks');
  const lastUpdatedEl = document.getElementById('last-updated');
  const countdownEl = document.getElementById('update-countdown');
  
  // Reader Modal DOM Elements
  const readerOverlay = document.getElementById('reader-overlay');
  const readerPanel = document.getElementById('reader-panel');
  const readerCloseBtn = document.getElementById('reader-close-btn');
  const readerProgressBar = document.getElementById('reader-progress-bar');
  const readerCategory = document.getElementById('reader-category');
  const readerReadTime = document.getElementById('reader-read-time');
  const readerTitle = document.getElementById('reader-title');
  const readerBody = document.getElementById('reader-body');
  const readerSourceLink = document.getElementById('reader-source-link');
  const readerBookmarkBtn = document.getElementById('reader-bookmark-btn');
  const nextArticleNav = document.getElementById('next-article-nav');
  const nextArticleTitle = document.getElementById('next-article-title');

  // Initialize Theme
  const savedTheme = localStorage.getItem('briefly_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  // Theme Toggle Click Handler
  toggleThemeBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('briefly_theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    toggleThemeBtn.innerHTML = theme === 'dark' 
      ? `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2 2 6.48 2 12zm10 8c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M12.1 12.1c-.8.8-2 1.3-3.3 1.3-2.6 0-4.7-2.1-4.7-4.7 0-1.3.5-2.5 1.3-3.3C3.6 6.5 2 9.1 2 12c0 5.5 4.5 10 10 10 2.9 0 5.5-1.6 6.6-3.4-.8.8-2 1.3-3.3 1.3-2.6 0-4.7-2.1-4.7-4.7 0-1.3.5-2.5 1.5-3.1z"/></svg>`;
  }

  // Load Data
  fetch('data/stories.json')
    .then(res => {
      if (!res.ok) throw new Error('Data file not found');
      return res.json();
    })
    .then(data => {
      state.stories = data.stories || [];
      state.lastUpdated = data.last_updated;
      initApp();
    })
    .catch(err => {
      console.error('Error fetching stories:', err);
      storyListEl.innerHTML = `
        <div class="empty-state">
          <h3 class="empty-state-title">Something went wrong</h3>
          <p class="empty-state-text">Could not load today's briefs. Please run update_news.py and refresh.</p>
        </div>
      `;
    });

  function initApp() {
    // Render last updated date
    if (state.lastUpdated) {
      const date = new Date(state.lastUpdated);
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      lastUpdatedEl.textContent = date.toLocaleDateString('en-US', options);
      setupCountdown(state.lastUpdated);
    }
    
    setupCategoryFilters();
    renderStories();

    // Toggle Bookmarks Only View
    toggleBookmarksBtn.addEventListener('click', () => {
      state.viewingBookmarksOnly = !state.viewingBookmarksOnly;
      toggleBookmarksBtn.classList.toggle('active', state.viewingBookmarksOnly);
      
      // If we turned on bookmarks view, clear category chip styling
      if (state.viewingBookmarksOnly) {
        document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
      } else {
        // Fall back to All
        state.currentCategory = 'All';
        const allChip = document.querySelector('[data-category="All"]');
        if (allChip) allChip.classList.add('active');
      }
      
      renderStories();
    });

    // Close Reader Event Listeners
    readerCloseBtn.addEventListener('click', closeReader);
    readerOverlay.addEventListener('click', (e) => {
      if (e.target === readerOverlay) closeReader();
    });
    
    // Keypress esc to close reader
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeReader();
    });

    // Track scroll in reader panel for progress bar
    readerPanel.addEventListener('scroll', () => {
      const scrollTop = readerPanel.scrollTop;
      const scrollHeight = readerPanel.scrollHeight - readerPanel.clientHeight;
      if (scrollHeight > 0) {
        const percentage = (scrollTop / scrollHeight) * 100;
        readerProgressBar.style.width = `${percentage}%`;
      } else {
        readerProgressBar.style.width = '0%';
      }
    });

    // Bookmark Action inside Reader
    readerBookmarkBtn.addEventListener('click', () => {
      toggleBookmark(state.currentOpenStoryRank);
      updateReaderBookmarkBtn(state.currentOpenStoryRank);
      renderStories(); // refresh main feed cards
    });

    // Next Article Click in Reader
    nextArticleNav.addEventListener('click', () => {
      const currentRank = state.currentOpenStoryRank;
      const nextStory = state.stories.find(s => s.rank === currentRank + 1);
      if (nextStory) {
        openReader(nextStory.rank);
      }
    });
  }

  // Setup Countdown to 24h refresh
  function setupCountdown(lastUpdatedStr) {
    const lastUpdated = new Date(lastUpdatedStr);
    const nextUpdate = new Date(lastUpdated.getTime() + 24 * 60 * 60 * 1000);

    function tick() {
      const now = new Date();
      const diff = nextUpdate - now;
      if (diff <= 0) {
        countdownEl.textContent = "Feed updates: Ready to refresh";
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      countdownEl.textContent = `Next update in ${hours}h ${minutes}m`;
    }

    tick();
    setInterval(tick, 60000); // Update every minute
  }

  // Render Category Chips
  function setupCategoryFilters() {
    const categories = ['All', 'World', 'India', 'Business', 'Technology', 'Science', 'Sports', 'Entertainment'];
    categoryContainerEl.innerHTML = '';

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `filter-chip ${cat === 'All' ? 'active' : ''}`;
      btn.textContent = cat;
      btn.setAttribute('data-category', cat);
      
      btn.addEventListener('click', () => {
        state.viewingBookmarksOnly = false;
        toggleBookmarksBtn.classList.remove('active');
        state.currentCategory = cat;
        
        document.querySelectorAll('.filter-chip').forEach(chip => {
          chip.classList.toggle('active', chip.getAttribute('data-category') === cat);
        });
        
        renderStories();
      });

      categoryContainerEl.appendChild(btn);
    });
  }

  // Render main stream list of stories
  function renderStories() {
    storyListEl.innerHTML = '';
    
    // Filter logic
    let filteredStories = state.stories;
    
    if (state.viewingBookmarksOnly) {
      filteredStories = state.stories.filter(story => state.bookmarks.includes(story.rank));
    } else if (state.currentCategory !== 'All') {
      filteredStories = state.stories.filter(story => story.category === state.currentCategory);
    }

    // Sort by rank ascending (1 to 10)
    filteredStories.sort((a, b) => a.rank - b.rank);

    if (filteredStories.length === 0) {
      const viewType = state.viewingBookmarksOnly ? 'bookmarks' : 'stories';
      storyListEl.innerHTML = `
        <div class="empty-state">
          <h3 class="empty-state-title">No saved stories</h3>
          <p class="empty-state-text">Bookmark articles by tapping the bookmark icon in the article view to save them for later.</p>
        </div>
      `;
      return;
    }

    filteredStories.forEach(story => {
      const card = document.createElement('article');
      card.className = 'story-card';
      
      // format rank to 01, 02...
      const formattedRank = String(story.rank).padStart(2, '0');
      const isBookmarked = state.bookmarks.includes(story.rank);
      
      card.innerHTML = `
        <div class="story-rank">${formattedRank}</div>
        <div class="story-main">
          <div class="story-meta">
            <span class="story-category">${story.category}</span>
            <span class="story-read-time">${story.read_time} min read</span>
          </div>
          <h2 class="story-title">${story.title}</h2>
          <p class="story-excerpt">${story.excerpt}</p>
        </div>
      `;

      card.addEventListener('click', () => {
        openReader(story.rank);
      });

      storyListEl.appendChild(card);
    });
  }

  // Bookmark Toggle logic
  function toggleBookmark(rank) {
    const index = state.bookmarks.indexOf(rank);
    if (index === -1) {
      state.bookmarks.push(rank);
    } else {
      state.bookmarks.splice(index, 1);
    }
    localStorage.setItem('briefly_bookmarks', JSON.stringify(state.bookmarks));
  }

  // Update Reader view Bookmark Icon State
  function updateReaderBookmarkBtn(rank) {
    const isBookmarked = state.bookmarks.includes(rank);
    readerBookmarkBtn.innerHTML = isBookmarked
      ? `<svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/></svg>`;
  }

  // Focus Reader Views Opening
  function openReader(rank) {
    const story = state.stories.find(s => s.rank === rank);
    if (!story) return;

    state.currentOpenStoryRank = rank;
    
    // Populate fields
    readerCategory.textContent = story.category;
    readerReadTime.textContent = `${story.read_time} min read`;
    readerTitle.textContent = story.title;
    
    // Format paragraph breaks
    const formattedContent = story.content
      .split('\n\n')
      .map(para => `<p>${para.trim()}</p>`)
      .join('');
    readerBody.innerHTML = formattedContent;
    
    // Source URL
    readerSourceLink.href = story.source_url;
    
    // Update Bookmark Button
    updateReaderBookmarkBtn(rank);

    // Setup next article bar at bottom
    const nextStory = state.stories.find(s => s.rank === rank + 1);
    if (nextStory) {
      nextArticleNav.style.display = 'flex';
      nextArticleTitle.textContent = nextStory.title;
    } else {
      nextArticleNav.style.display = 'none';
    }

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Show Overlay
    readerOverlay.classList.add('active');
    readerPanel.scrollTop = 0;
    readerProgressBar.style.width = '0%';
  }

  function closeReader() {
    readerOverlay.classList.remove('active');
    document.body.style.overflow = '';
    state.currentOpenStoryRank = null;
  }
});
