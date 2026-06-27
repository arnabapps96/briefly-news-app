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
  const readerProgressText = document.getElementById('reader-progress-text');
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
    
    // Rerender layout to update dynamic SVGs for current theme
    renderStories();
  });

  function updateThemeIcon(theme) {
    toggleThemeBtn.innerHTML = theme === 'dark' 
      ? `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2 2 6.48 2 12zm10 8c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M12.1 12.1c-.8.8-2 1.3-3.3 1.3-2.6 0-4.7-2.1-4.7-4.7 0-1.3.5-2.5 1.3-3.3C3.6 6.5 2 9.1 2 12c0 5.5 4.5 10 10 10 2.9 0 5.5-1.6 6.6-3.4-.8.8-2 1.3-3.3 1.3-2.6 0-4.7-2.1-4.7-4.7 0-1.3.5-2.5 1.5-3.1z"/></svg>`;
  }

  // Load Data
  fetch('data/stories.json', { cache: 'no-store' })
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
          <div class="empty-state-card">
            <h3 class="empty-state-title">Something went wrong</h3>
            <p class="empty-state-text">Could not load today's briefs. Please run update_news.py and refresh.</p>
          </div>
        </div>
      `;
    });

  // Humanize reading time labels
  function formatReadTime(minutes) {
    if (minutes <= 1) return '60 sec';
    if (minutes === 2) return '2 min';
    if (minutes === 3) return 'Quick read';
    if (minutes === 4) return 'Medium read';
    return 'Deep read';
  }

  // Dynamic Abstract Geometric Editorial Artwork Generator
  function generateAbstractArtwork(category) {
    const colors = {
      'World': { primary: '#9c8e75', secondary: '#FAF9F6' },
      'India': { primary: '#df8137', secondary: '#FFF8F2' },
      'Business': { primary: '#378b60', secondary: '#F2FAF5' },
      'Technology': { primary: '#4e8098', secondary: '#F2F7FA' },
      'Science': { primary: '#8652cc', secondary: '#F7F2FA' },
      'Sports': { primary: '#c54848', secondary: '#FAF2F2' },
      'Entertainment': { primary: '#bfa054', secondary: '#FAF8F2' }
    };
    
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const c = colors[category] || { primary: '#8C7B65', secondary: '#FAF9F6' };
    
    const fillAccent = c.primary;
    const fillBg = theme === 'dark' ? '#14171A' : c.secondary;
    const strokeColor = theme === 'dark' ? '#ECE9DF' : '#1A1A1A';
    const opacity = theme === 'dark' ? '0.12' : '0.06';
    
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 280" width="100%" height="100%">
        <rect width="100%" height="100%" fill="${fillBg}"/>
        
        <!-- Abstract Grid -->
        <g stroke="${strokeColor}" stroke-width="0.5" opacity="${opacity}">
          <line x1="100" y1="0" x2="100" y2="280"/>
          <line x1="200" y1="0" x2="200" y2="280"/>
          <line x1="300" y1="0" x2="300" y2="280"/>
          <line x1="400" y1="0" x2="400" y2="280"/>
          <line x1="500" y1="0" x2="500" y2="280"/>
          <line x1="600" y1="0" x2="600" y2="280"/>
          <line x1="700" y1="0" x2="700" y2="280"/>
          
          <line x1="0" y1="70" x2="800" y2="70"/>
          <line x1="0" y1="140" x2="800" y2="140"/>
          <line x1="0" y1="210" x2="800" y2="210"/>
        </g>
        
        <!-- Intersecting Abstract Shapes -->
        <circle cx="240" cy="140" r="90" fill="${fillAccent}" opacity="0.12"/>
        <circle cx="560" cy="140" r="75" stroke="${fillAccent}" stroke-width="1.5" fill="none" opacity="0.35"/>
        
        <!-- Angled Editorial Lines -->
        <g stroke="${fillAccent}" stroke-width="1.5" opacity="0.3">
          <line x1="150" y1="220" x2="650" y2="60"/>
          <line x1="170" y1="220" x2="670" y2="60" stroke-dasharray="6 6"/>
        </g>
        
        <!-- Minimal geometric polygons -->
        <rect x="360" y="90" width="100" height="100" fill="none" stroke="${strokeColor}" stroke-width="1" opacity="0.2"/>
        <polygon points="360,90 460,90 360,190" fill="${fillAccent}" opacity="0.12"/>
        
        <!-- Tiny Accent dots -->
        <circle cx="150" cy="100" r="4" fill="${fillAccent}"/>
        <circle cx="650" cy="180" r="4" fill="${fillAccent}"/>
        <circle cx="200" cy="200" r="2.5" fill="${strokeColor}" opacity="0.4"/>
        <circle cx="600" cy="80" r="2.5" fill="${strokeColor}" opacity="0.4"/>
      </svg>
    `;
  }

  function initApp() {
    // Dynamic Edition Number Calculations (Reference Launch: June 1, 2025)
    const launchDate = new Date('2025-06-01');
    const today = new Date();
    
    // Parse lastUpdated if present, otherwise fallback to today
    const activeDate = state.lastUpdated ? new Date(state.lastUpdated) : today;
    
    const diffTime = Math.abs(activeDate - launchDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const editionNumber = diffDays;
    
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(activeDate);
    
    // Set dynamically calculated edition branding
    document.getElementById('edition-title').textContent = `${dayName} Brief`;
    document.getElementById('edition-number').textContent = `Edition #${editionNumber}`;

    // Render last updated date
    if (state.lastUpdated) {
      const date = new Date(state.lastUpdated);
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      lastUpdatedEl.textContent = date.toLocaleDateString('en-US', options);
      setupCountdown(state.lastUpdated);
    }
    
    // Total reading time calculation (e.g. 8 minutes total)
    const totalReadingTime = state.stories.reduce((sum, story) => sum + (story.read_time || 3), 0);
    document.getElementById('edition-reading-time').textContent = `You'll finish reading in about ${totalReadingTime} minutes.`;

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
        countdownEl.textContent = "Next edition ready to refresh";
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      countdownEl.textContent = `Next edition in ${hours}h ${minutes}m`;
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
      storyListEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-card">
            <div class="empty-state-icon-wrap">
              <svg viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z"/>
              </svg>
            </div>
            <h3 class="empty-state-title">No saved stories yet</h3>
            <p class="empty-state-text">When a story surprises you, inspires you, or teaches you something, save it here for later.</p>
          </div>
        </div>
      `;
      return;
    }

    filteredStories.forEach(story => {
      const card = document.createElement('article');
      
      // Cover Story vs Regular Card checks
      const isCoverStory = story.rank === 1 && state.currentCategory === 'All' && !state.viewingBookmarksOnly;
      card.className = isCoverStory ? 'story-card cover-story' : 'story-card';
      
      // Format rank to 01, 02...
      const formattedRank = String(story.rank).padStart(2, '0');
      const humanReadTime = formatReadTime(story.read_time);
      const catLower = story.category.toLowerCase();
      
      if (isCoverStory) {
        // Render Cover Story layout (featured, artwork, larger header)
        card.innerHTML = `
          <div class="story-rank">${formattedRank}</div>
          <div class="editorial-artwork">${generateAbstractArtwork(story.category)}</div>
          <div class="story-main">
            <div class="story-meta">
              <span class="story-category-dot dot-${catLower}"></span>
              <span class="story-category">${story.category}</span>
              <span class="bullet-divider">&bull;</span>
              <span class="story-read-time">${humanReadTime}</span>
            </div>
            <h2 class="story-title">${story.title}</h2>
            <p class="story-excerpt">${story.excerpt}</p>
          </div>
        `;
      } else {
        // Render minimal List Card layout
        card.innerHTML = `
          <div class="story-rank">${formattedRank}</div>
          <div class="story-main">
            <div class="story-meta">
              <span class="story-category-dot dot-${catLower}"></span>
              <span class="story-category">${story.category}</span>
              <span class="bullet-divider">&bull;</span>
              <span class="story-read-time">${humanReadTime}</span>
            </div>
            <h2 class="story-title">${story.title}</h2>
            <p class="story-excerpt">${story.excerpt}</p>
          </div>
        `;
      }

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
    readerReadTime.textContent = formatReadTime(story.read_time);
    readerTitle.textContent = story.title;
    
    // Story progress numbering (e.g. Story 3 of 10)
    readerProgressText.textContent = `Story ${story.rank} of 10`;
    
    // Format paragraph breaks
    const paragraphs = story.content.split('\n\n');
    let formattedContent = paragraphs
      .map(para => `<p>${para.trim()}</p>`)
      .join('');
      
    // Append the dynamic "why this matters" editorial wrap-up at the end of the text
    if (story.why_this_matters) {
      formattedContent += `
        <div class="reader-why-matters">
          <span class="reader-why-label">Why this matters</span>
          ${story.why_this_matters}
        </div>
      `;
    }
    
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
