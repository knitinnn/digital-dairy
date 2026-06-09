/* ============================================================
   Digital Diary — Diary Module (diary.js)
   ============================================================ */

'use strict';

/* ── State ─────────────────────────────────────────────────── */
let currentView     = 'grid';   // 'grid' | 'list'
let currentFilter   = 'all';    // 'all' | mood key
let searchQuery     = '';
let currentEditId   = null;
let autosaveTimer   = null;
let selectedTags    = [];
let selectedMood    = '';

/* ── DOM Refs ──────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

/* ════════════════════════════════════════════════════════════
   DIARY LIST VIEW
   ════════════════════════════════════════════════════════════ */

function renderDiaryPage() {
  if (!$('diary-grid-container')) return;

  loadDiaryList();
  initDiaryControls();
}

function loadDiaryList() {
  const container = $('diary-grid-container');
  if (!container) return;

  let entries = Entries.getAll();

  // Filter by mood
  if (currentFilter !== 'all') {
    entries = entries.filter(e => e.mood === currentFilter);
  }

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    entries = entries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.content || '').toLowerCase().includes(q) ||
      (e.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">📖</div>
        <div class="empty-state-title">No entries yet</div>
        <div class="empty-state-desc">
          ${searchQuery ? 'No entries match your search.' : 'Start writing your first diary entry and capture your memories.'}
        </div>
        ${!searchQuery ? '<button class="btn btn-primary btn-lg" onclick="openEntryEditor()">✏️ Write First Entry</button>' : ''}
      </div>`;
    return;
  }

  const viewClass = currentView === 'list' ? 'diary-list' : 'diary-grid';
  container.className = viewClass;
  container.innerHTML = entries.map((e, i) => renderEntryCard(e, i)).join('');
}

function renderEntryCard(entry, index = 0) {
  const mood = entry.mood ? getMoodMeta(entry.mood) : null;
  const tagsHTML = (entry.tags || []).slice(0, 3).map(t =>
    `<span class="tag tag-rose">${escape(t)}</span>`
  ).join('');

  return `
    <div class="diary-card animate-fade-in"
         style="animation-delay:${index * 50}ms"
         data-id="${entry.id}"
         onclick="viewEntry('${entry.id}')">
      <div class="diary-card-header">
        <div>
          <div class="diary-card-date">${formatDate(entry.date || entry.createdAt, { month:'short', day:'numeric', year:'numeric' })}</div>
          ${entry.time ? `<div class="text-small text-muted">${entry.time}</div>` : ''}
        </div>
        ${mood ? `<span class="mood-badge mood-${entry.mood}">${mood.emoji} ${mood.label}</span>` : ''}
      </div>
      <div class="diary-card-title">${escape(entry.title)}</div>
      <div class="diary-card-preview">${escape(truncate(entry.content || '', 160))}</div>
      <div class="diary-card-footer">
        <div class="diary-card-tags">${tagsHTML}</div>
        <div class="diary-card-actions" onclick="event.stopPropagation()">
          <button class="card-action-btn" title="Edit" onclick="openEntryEditor('${entry.id}')">✏️</button>
          <button class="card-action-btn danger" title="Delete" onclick="confirmDeleteEntry('${entry.id}')">🗑️</button>
        </div>
      </div>
    </div>`;
}

function initDiaryControls() {
  // View toggle
  const gridBtn = $('view-grid');
  const listBtn = $('view-list');

  if (gridBtn) gridBtn.addEventListener('click', () => {
    currentView = 'grid';
    gridBtn.classList.add('active');
    if (listBtn) listBtn.classList.remove('active');
    loadDiaryList();
  });

  if (listBtn) listBtn.addEventListener('click', () => {
    currentView = 'list';
    listBtn.classList.add('active');
    if (gridBtn) gridBtn.classList.remove('active');
    loadDiaryList();
  });

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter || 'all';
      loadDiaryList();
    });
  });

  // Search
  const searchInput = $('diary-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      loadDiaryList();
    });
  }
}

/* ════════════════════════════════════════════════════════════
   ENTRY EDITOR
   ════════════════════════════════════════════════════════════ */

function openEntryEditor(id = null) {
  currentEditId = id;
  selectedTags  = [];
  selectedMood  = '';

  if (id) {
    const entry = Entries.getById(id);
    if (!entry) return;
    selectedTags = [...(entry.tags || [])];
    selectedMood = entry.mood || '';
    populateEditor(entry);
  } else {
    clearEditor();
    // Load draft
    const draft = Storage.get(APP_KEYS.DRAFT);
    if (draft && !id) {
      if ($('entry-title')) $('entry-title').value = draft.title || '';
      if ($('entry-content')) $('entry-content').value = draft.content || '';
      selectedMood = draft.mood || '';
      selectedTags = draft.tags || [];
    }
  }

  renderTagsUI();
  updateMoodSelector();
  updateCharCounter();
  openModal('entry-modal');
  setupAutosave();
}

function clearEditor() {
  if ($('entry-title'))   $('entry-title').value   = '';
  if ($('entry-content')) $('entry-content').value = '';
  if ($('entry-date'))    $('entry-date').value    = todayStr();
  selectedTags = [];
  selectedMood = '';
}

function populateEditor(entry) {
  if ($('entry-title'))   $('entry-title').value   = entry.title || '';
  if ($('entry-content')) $('entry-content').value = entry.content || '';
  if ($('entry-date'))    $('entry-date').value    = (entry.date || entry.createdAt || '').slice(0, 10);
}

/* ── Autosave ──────────────────────────────────────────────── */
function setupAutosave() {
  const titleEl   = $('entry-title');
  const contentEl = $('entry-content');
  if (!titleEl || !contentEl) return;

  const handler = () => {
    clearTimeout(autosaveTimer);
    updateCharCounter();
    autosaveTimer = setTimeout(() => {
      if (!currentEditId) {
        Storage.set(APP_KEYS.DRAFT, {
          title:   titleEl.value,
          content: contentEl.value,
          mood:    selectedMood,
          tags:    selectedTags,
        });
        showAutosaveIndicator();
      }
    }, 1200);
  };

  titleEl.addEventListener('input', handler);
  contentEl.addEventListener('input', handler);
}

function showAutosaveIndicator() {
  const ind = $('autosave-indicator');
  if (!ind) return;
  ind.classList.add('visible');
  setTimeout(() => ind.classList.remove('visible'), 2500);
}

/* ── Char Counter ──────────────────────────────────────────── */
function updateCharCounter() {
  const contentEl = $('entry-content');
  const counterEl = $('char-count');
  if (!contentEl || !counterEl) return;

  const len = (contentEl.value || '').length;
  counterEl.textContent = len.toLocaleString();

  const parent = counterEl.closest('.char-counter');
  if (parent) {
    parent.classList.toggle('warning', len > 4500);
    parent.classList.toggle('over', len > 5000);
  }
}

/* ── Tags UI ───────────────────────────────────────────────── */
function renderTagsUI() {
  const container = $('tags-container');
  if (!container) return;

  const input = container.querySelector('.tags-input') || (() => {
    const inp = document.createElement('input');
    inp.className = 'tags-input';
    inp.placeholder = 'Add tags…';
    inp.setAttribute('aria-label', 'Add tag');
    inp.addEventListener('keydown', onTagInputKeydown);
    return inp;
  })();

  // Clear and re-render
  container.innerHTML = '';
  selectedTags.forEach(tag => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${escape(tag)} <button class="tag-chip-remove" aria-label="Remove tag ${escape(tag)}">×</button>`;
    chip.querySelector('.tag-chip-remove').addEventListener('click', () => {
      selectedTags = selectedTags.filter(t => t !== tag);
      renderTagsUI();
    });
    container.appendChild(chip);
  });

  container.appendChild(input);
  container.addEventListener('click', () => input.focus());
}

function onTagInputKeydown(e) {
  if ((e.key === 'Enter' || e.key === ',') && e.target.value.trim()) {
    e.preventDefault();
    const tag = e.target.value.trim().replace(/,/g, '');
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 8) {
      selectedTags.push(tag);
      e.target.value = '';
      renderTagsUI();
    }
  } else if (e.key === 'Backspace' && !e.target.value && selectedTags.length > 0) {
    selectedTags.pop();
    renderTagsUI();
  }
}

/* ── Mood Selector ─────────────────────────────────────────── */
function updateMoodSelector() {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.mood === selectedMood);
  });
}

function initMoodSelector() {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMood = btn.dataset.mood === selectedMood ? '' : btn.dataset.mood;
      updateMoodSelector();
    });
  });
}

/* ── Save Entry ────────────────────────────────────────────── */
function saveEntry() {
  const title   = ($('entry-title')?.value || '').trim();
  const content = ($('entry-content')?.value || '').trim();
  const dateVal = ($('entry-date')?.value || todayStr());

  if (!title) { showToast('Please add a title.', 'error'); return; }

  const now   = new Date();
  const entry = currentEditId
    ? { ...Entries.getById(currentEditId) }
    : { id: uid(), createdAt: now.toISOString() };

  entry.title     = title;
  entry.content   = content;
  entry.date      = dateVal;
  entry.time      = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  entry.mood      = selectedMood;
  entry.tags      = [...selectedTags];
  entry.updatedAt = now.toISOString();

  Entries.save(entry);

  // Log mood if set
  if (selectedMood) MoodLogs.log(selectedMood);

  // Clear draft
  Storage.remove(APP_KEYS.DRAFT);

  closeModal('entry-modal');
  showSaveSuccess();

  // Reload list if on diary page
  if ($('diary-grid-container')) loadDiaryList();
  currentEditId = null;
}

function showSaveSuccess() {
  const overlay = document.createElement('div');
  overlay.className = 'save-success active';
  overlay.innerHTML = `
    <div class="save-success-inner">
      <div class="save-success-icon">✨</div>
      <div class="save-success-text">Entry saved beautifully!</div>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 400);
  }, 1800);
}

/* ── View Entry ────────────────────────────────────────────── */
function viewEntry(id) {
  const entry = Entries.getById(id);
  if (!entry) return;

  const mood = entry.mood ? getMoodMeta(entry.mood) : null;
  const viewBody = $('entry-view-body');
  const viewHeader = $('entry-view-header-content');

  if (viewHeader) {
    viewHeader.innerHTML = `
      <div class="entry-view-date">
        📅 ${formatDate(entry.date || entry.createdAt, { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
        ${entry.time ? `&nbsp;·&nbsp; 🕐 ${entry.time}` : ''}
      </div>
      <div class="entry-view-title">${escape(entry.title)}</div>
      <div class="entry-view-meta">
        ${mood ? `<span class="mood-badge mood-${entry.mood}">${mood.emoji} ${mood.label}</span>` : ''}
        ${(entry.tags || []).map(t => `<span class="tag tag-rose">${escape(t)}</span>`).join('')}
      </div>`;
  }

  if (viewBody) viewBody.textContent = entry.content || '';

  // Set edit/delete buttons
  const editBtn   = $('view-edit-btn');
  const deleteBtn = $('view-delete-btn');
  if (editBtn)   editBtn.onclick   = () => { closeModal('view-modal'); openEntryEditor(id); };
  if (deleteBtn) deleteBtn.onclick = () => { closeModal('view-modal'); confirmDeleteEntry(id); };

  openModal('view-modal');
}

/* ── Delete Entry ──────────────────────────────────────────── */
function confirmDeleteEntry(id) {
  const entry = Entries.getById(id);
  if (!entry) return;

  const confirmEl = $('confirm-delete-name');
  if (confirmEl) confirmEl.textContent = entry.title;

  const confirmBtn = $('confirm-delete-btn');
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      Entries.delete(id);
      closeModal('confirm-delete-modal');
      loadDiaryList();
      showToast('Entry deleted.', 'info');
    };
  }

  openModal('confirm-delete-modal');
}

/* ── Init Diary Page ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('diary-grid-container')) return;

  renderDiaryPage();
  initMoodSelector();

  // Save button
  const saveBtn = $('save-entry-btn');
  if (saveBtn) saveBtn.addEventListener('click', saveEntry);

  // Entry date default
  const dateEl = $('entry-date');
  if (dateEl && !dateEl.value) dateEl.value = todayStr();

  // Setup modals
  setupModalClose('entry-modal');
  setupModalClose('view-modal');
  setupModalClose('confirm-delete-modal');

  // New entry button
  const newBtn = $('new-entry-btn');
  if (newBtn) newBtn.addEventListener('click', () => openEntryEditor());

  // Keyboard shortcut Ctrl+N
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'n' && !$('entry-modal')?.classList.contains('active')) {
      e.preventDefault();
      openEntryEditor();
    }
  });
});
