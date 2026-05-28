let allItems = [];
let filteredItems = [];
let currentFilter = 'all';
let searchQuery = '';
let selectedIndex = -1;

const timelineEl = document.getElementById('timeline');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearBtn = document.getElementById('clearBtn');
const appContainer = document.querySelector('.app-container');

// SVG Icons
const icons = {
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>`,
  starFilled: `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
};

// Listen to data from main process
window.electronAPI.onClipboardData((data) => {
  allItems = data;
  applyFilters();
});

window.electronAPI.onNewItem((item) => {
  // If it's a replacement (same text), remove old one
  if (item.type === 'text') {
    allItems = allItems.filter(i => i.type !== 'text' || i.content !== item.content);
  }
  
  allItems.unshift(item);
  applyFilters();
});

// Initial load
async function loadData() {
  allItems = await window.electronAPI.getItems();
  applyFilters();
}

// Search
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase();
  applyFilters();
});

// Filters
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.type;
    applyFilters();
  });
});

// Clear
clearBtn.addEventListener('click', async () => {
  await window.electronAPI.clearHistory();
  loadData();
});

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Meta' || e.key === 'Control') {
    appContainer.classList.add('show-hotkeys');
  }

  // Quick Paste Cmd+1 to Cmd+9
  if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
    e.preventDefault();
    const index = parseInt(e.key) - 1;
    if (index < filteredItems.length) {
      pasteItem(filteredItems[index]);
    }
  }

  // Arrow keys for selection
  if (e.key === 'ArrowRight') {
    if (selectedIndex < filteredItems.length - 1) {
      selectedIndex++;
      updateSelection();
    }
  } else if (e.key === 'ArrowLeft') {
    if (selectedIndex > 0) {
      selectedIndex--;
      updateSelection();
    }
  } else if (e.key === 'Enter' && selectedIndex >= 0) {
    pasteItem(filteredItems[selectedIndex]);
  } else if (e.key === 'Escape') {
    // We could hide window here if we wanted
    searchInput.blur();
    selectedIndex = -1;
    updateSelection();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Meta' || e.key === 'Control') {
    appContainer.classList.remove('show-hotkeys');
  }
});

function updateSelection() {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    if (index === selectedIndex) {
      card.classList.add('selected');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      card.classList.remove('selected');
    }
  });
}

function applyFilters() {
  filteredItems = allItems.filter(item => {
    // Type filter
    if (currentFilter === 'favorites') {
      if (!item.favorite) return false;
    } else if (currentFilter !== 'all' && item.type !== currentFilter) {
      return false;
    }

    // Search filter
    if (searchQuery && item.type !== 'image') {
      return item.content.toLowerCase().includes(searchQuery);
    }

    return true;
  });

  selectedIndex = -1;
  renderTimeline();
}

function formatTime(timestamp) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
  const hoursDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60));
  const minsDifference = Math.round((timestamp - Date.now()) / (1000 * 60));
  
  if (Math.abs(minsDifference) < 60) return rtf.format(minsDifference, 'minute');
  if (Math.abs(hoursDifference) < 24) return rtf.format(hoursDifference, 'hour');
  return rtf.format(daysDifference, 'day');
}

function renderTimeline() {
  timelineEl.innerHTML = '';

  if (filteredItems.length === 0) {
    timelineEl.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <p>No clipboard history found</p>
      </div>
    `;
    return;
  }

  filteredItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = item.id;
    card.dataset.index = index;
    
    // Add hotkey hint (1-9)
    if (index < 9) {
      const hint = document.createElement('div');
      hint.className = 'hotkey-hint';
      hint.textContent = index + 1;
      card.appendChild(hint);
    }

    let contentHtml = '';
    if (item.type === 'image') {
      contentHtml = `<img src="${item.content}" class="image-content" alt="Clipboard image">`;
    } else {
      contentHtml = `<div class="text-content">${escapeHtml(item.content)}</div>`;
    }

    card.innerHTML += `
      <div class="card-content">
        ${contentHtml}
      </div>
      <div class="card-footer">
        <div class="card-meta">
          <span class="type-badge">${item.type}</span>
          <span>${formatTime(item.timestamp)}</span>
        </div>
        <div class="card-actions">
          <button class="action-btn star ${item.favorite ? 'active' : ''}" title="Favorite">
            ${item.favorite ? icons.starFilled : icons.star}
          </button>
          <button class="action-btn delete" title="Delete">
            ${icons.trash}
          </button>
        </div>
      </div>
    `;

    // Events
    card.addEventListener('click', (e) => {
      // Ignore click if clicking actions
      if (e.target.closest('.card-actions')) return;
      pasteItem(item);
    });

    const starBtn = card.querySelector('.star');
    starBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const updated = await window.electronAPI.toggleFavorite(item.id);
      
      // Update local state
      const allItemIndex = allItems.findIndex(i => i.id === item.id);
      if (allItemIndex !== -1) allItems[allItemIndex].favorite = updated.favorite;
      
      item.favorite = updated.favorite;
      starBtn.classList.toggle('active');
      starBtn.innerHTML = updated.favorite ? icons.starFilled : icons.star;
      
      // If we're on favorites filter and just unfavorited, remove card
      if (currentFilter === 'favorites' && !updated.favorite) {
        applyFilters();
      }
    });

    const delBtn = card.querySelector('.delete');
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.electronAPI.deleteItem(item.id);
      
      // Update local state
      allItems = allItems.filter(i => i.id !== item.id);
      applyFilters();
    });

    timelineEl.appendChild(card);
  });
}

function pasteItem(item) {
  window.electronAPI.pasteItem(item);
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Accessibility Check
const accessibilityBanner = document.getElementById('accessibilityBanner');
const accessibilityBtn = document.getElementById('accessibilityBtn');
let checkInterval;

async function checkAccessibility() {
  const isTrusted = await window.electronAPI.checkAccessibility(false);
  if (!isTrusted) {
    accessibilityBanner.style.display = 'block';
    if (!checkInterval) {
      checkInterval = setInterval(async () => {
        const trusted = await window.electronAPI.checkAccessibility(false);
        if (trusted) {
          accessibilityBanner.style.display = 'none';
          clearInterval(checkInterval);
          checkInterval = null;
        }
      }, 1000);
    }
  } else {
    accessibilityBanner.style.display = 'none';
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }
}

accessibilityBtn.addEventListener('click', async () => {
  await window.electronAPI.checkAccessibility(true);
  accessibilityBtn.textContent = "Restart App After Granting";
  accessibilityBtn.style.background = "linear-gradient(135deg, #ef4444, #b91c1c)";
  accessibilityBtn.style.color = "white";
});

// Initial fetch
loadData();
checkAccessibility();
