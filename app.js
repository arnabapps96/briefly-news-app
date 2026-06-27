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
  const readerContentWrap = document.getElementById('reader-content-wrap');
  const completionPanel = document.getElementById('completion-panel');
  const completionCloseBtn = document.getElementById('completion-close-btn');
  const completionTitleText = document.getElementById('completion-title-text');
  
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

  // Dynamic Hand-Drawn-Style Minimalist Editorial Artwork Generator
  function generateAbstractArtwork(category) {
    const colors = {
      'World': { primary: '#C5A059', secondary: '#FAF9F6' },
      'India': { primary: '#E08A3C', secondary: '#FFF8F2' },
      'Business': { primary: '#3D9460', secondary: '#F2FAF5' },
      'Technology': { primary: '#4E8098', secondary: '#F2F7FA' },
      'Science': { primary: '#7D53B2', secondary: '#F7F2FA' },
      'Sports': { primary: '#E07A5F', secondary: '#FAF2F2' },
      'Entertainment': { primary: '#C5A059', secondary: '#FAF8F2' }
    };
    
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const c = colors[category] || { primary: '#C5A059', secondary: '#FAF9F6' };
    
    const fillAccent = c.primary;
    const fillBg = theme === 'dark' ? '#14171A' : c.secondary;
    const strokeColor = theme === 'dark' ? '#ECE9DF' : '#1A1A1A';
    const opacityLine = theme === 'dark' ? '0.2' : '0.1';
    const opacityHatch = theme === 'dark' ? '0.1' : '0.05';
    
    // Generate fine vertical lines to resemble an engraving / newspaper print sketch
    let hatching = '';
    for (let i = 25; i < 780; i += 12) {
      hatching += `<line x1="${i}" y1="15" x2="${i - 20}" y2="265" stroke="${strokeColor}" stroke-width="0.5" opacity="${opacityHatch}" />`;
    }
    
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 280" width="100%" height="100%">
        <rect width="100%" height="100%" fill="${fillBg}"/>
        
        <!-- Engraving Hatching Background Texture -->
        <g>${hatching}</g>
        
        <!-- Restrained Thin Broadsheet Frame Border -->
        <rect x="15" y="15" width="770" height="250" fill="none" stroke="${strokeColor}" stroke-width="0.5" opacity="${opacityLine * 2.5}"/>
        
        <!-- Concentric Engraved Layout Details -->
        <g stroke="${strokeColor}" fill="none" stroke-width="0.8">
          <circle cx="400" cy="140" r="95" opacity="${opacityLine * 1.5}"/>
          <circle cx="400" cy="140" r="75" opacity="${opacityLine}"/>
          <circle cx="400" cy="140" r="55" opacity="${opacityLine * 0.5}"/>
          
          <!-- Axis alignments -->
          <line x1="50" y1="140" x2="750" y2="140" opacity="${opacityLine * 2}"/>
          <line x1="400" y1="35" x2="400" y2="245" opacity="${opacityLine * 1.5}"/>
          
          <!-- Focal rays -->
          <line x1="310" y1="50" x2="490" y2="230" opacity="${opacityLine}"/>
          <line x1="490" y1="50" x2="310" y2="230" opacity="${opacityLine}"/>
        </g>
        
        <!-- Minimal Muted accent focus points -->
        <circle cx="400" cy="140" r="25" fill="${fillAccent}" opacity="0.15"/>
        <polygon points="375,140 400,95 425,140" fill="${fillAccent}" opacity="0.1"/>
        
        <!-- Blueprint-style ticks -->
        <g stroke="${strokeColor}" stroke-width="1.2" opacity="0.5">
          <line x1="400" y1="20" x2="400" y2="28"/>
          <line x1="400" y1="252" x2="400" y2="260"/>
          <line x1="25" y1="140" x2="33" y2="140"/>
          <line x1="767" y1="140" x2="775" y2="140"/>
        </g>
        
        <!-- Broadsheet Technical Text Notes -->
        <text x="35" y="40" font-family="'Inter', sans-serif" font-size="9" font-weight="600" letter-spacing="2" fill="${strokeColor}" opacity="0.45">${category.toUpperCase()} DIAGRAM</text>
        <text x="735" y="245" font-family="'Inter', sans-serif" font-size="9" font-weight="600" fill="${strokeColor}" opacity="0.45">NO. ${category.charCodeAt(0) % 99}</text>
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
    document.getElementById('edition-title').textContent = `${dayName} Edition`;
    document.getElementById('edition-number').textContent = `Edition #${editionNumber}`;

    // Render last updated date
    if (state.lastUpdated) {
      const date = new Date(state.lastUpdated);
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      lastUpdatedEl.textContent = date.toLocaleDateString('en-US', options);
      setupCountdown(state.lastUpdated);
    }
    
    // Total reading time calculation (e.g. 8 minutes total)
    const totalReadingTime = state.stories.reduce((sum, story) => sum + (story.read_time || 2), 0);
    document.getElementById('edition-reading-time').textContent = `You'll finish today's 10 stories in about ${totalReadingTime} minutes.`;

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
    completionCloseBtn.addEventListener('click', closeReader);
    
    readerOverlay.addEventListener('click', (e) => {
      if (e.target === readerOverlay) closeReader();
    });
    
    // Keypress esc to close reader
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeReader();
    });

    // Track scroll in reader panel for progress bar
    readerPanel.addEventListener('scroll', () => {
      // Only track if completion panel is NOT active
      if (completionPanel.classList.contains('active')) {
        readerProgressBar.style.width = '100%';
        return;
      }
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

    // Next Article / Complete Edition Click in Reader
    nextArticleNav.addEventListener('click', () => {
      const currentRank = state.currentOpenStoryRank;
      const nextStory = state.stories.find(s => s.rank === currentRank + 1);
      if (nextStory) {
        openReader(nextStory.rank);
      } else if (currentRank === 10) {
        // Last story complete - launch quiet completion screen
        showCompletionScreen();
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
      // Warm Bookmark Empty State with custom outline SVG icon and instructions
      storyListEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-card">
            <div class="empty-state-icon-wrap">
              <svg viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <h3 class="empty-state-title">The best stories deserve a second read.</h3>
            <p class="empty-state-text">Save stories worth revisiting for later reference.</p>
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
        // Render Cover Story layout ordered: Category -> Large headline -> Excerpt -> Illustration underneath
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
          <div class="editorial-artwork">${generateAbstractArtwork(story.category)}</div>
        `;
      } else {
        // Render regular minimal card layouts (headline is sans-serif in css)
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
    
    // Reset reader display states
    readerContentWrap.style.display = 'block';
    completionPanel.classList.remove('active');
    
    // Populate fields
    readerCategory.textContent = story.category;
    readerReadTime.textContent = formatReadTime(story.read_time);
    readerTitle.textContent = story.title;
    
    // Story progress numbering
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
      nextArticleNav.querySelector('.next-article-label').textContent = 'Next Story';
      nextArticleTitle.textContent = nextStory.title;
    } else if (rank === 10) {
      // Story 10 has no next story, so display completion trigger CTA
      nextArticleNav.style.display = 'flex';
      nextArticleNav.querySelector('.next-article-label').textContent = 'Edition Complete';
      nextArticleTitle.textContent = "Complete today's reading &rarr;";
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

  // Launch Calm Completion Page View inside the Reader Overlay
  function showCompletionScreen() {
    // Hide standard article text wrapper
    readerContentWrap.style.display = 'none';
    
    // Dynamically calculate actual text for current day
    const activeDate = state.lastUpdated ? new Date(state.lastUpdated) : new Date();
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(activeDate);
    
    completionTitleText.textContent = `${dayName} Edition Complete`;
    
    // Show Completion Overlay Panel
    completionPanel.classList.add('active');
    readerProgressBar.style.width = '100%';
    readerPanel.scrollTop = 0;
  }

  function closeReader() {
    readerOverlay.classList.remove('active');
    document.body.style.overflow = '';
    state.currentOpenStoryRank = null;
    
    // Reset view variables
    readerContentWrap.style.display = 'block';
    completionPanel.classList.remove('active');
  }
});
