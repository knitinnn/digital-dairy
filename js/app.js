/* ============================================================
   Digital Diary — Core Application Logic (app.js)
   ============================================================ */

'use strict';

/* ── Constants ─────────────────────────────────────────────── */
const APP_KEYS = {
  PROFILE:    'dd_profile',
  ENTRIES:    'dd_entries',
  REMINDERS:  'dd_reminders',
  DATES:      'dd_dates',
  MOODS:      'dd_moods',
  VAULT_NOTES:'dd_vault_notes',
  VAULT_PIN:  'dd_vault_pin',
  SETTINGS:   'dd_settings',
  DRAFT:      'dd_draft',
};

const QUOTES = [
  { text: "The life of every man is a diary in which he means to write one story, and writes another.", author: "J.M. Barrie" },
  { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth" },
  { text: "Journal writing is a voyage to the interior.", author: "Christina Baldwin" },
  { text: "Keep a diary and one day it'll keep you.", author: "Mae West" },
  { text: "Writing in a journal reminds you of your goals and of your learning in life.", author: "Robin S. Sharma" },
  { text: "One must always be careful of blessings. In the deepest darkness, they shine brightest.", author: "Cassandra Clare" },
  { text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "In the journal I do not just express myself more openly than I could to any person; I create myself.", author: "Susan Sontag" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
  { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
  { text: "We write to taste life twice, in the moment and in retrospect.", author: "Anaïs Nin" },
];

const MOODS = [
  { key: 'happy',      emoji: '😊', label: 'Happy',      color: '#c9a84c' },
  { key: 'excited',    emoji: '🌟', label: 'Excited',     color: '#c47a5a' },
  { key: 'calm',       emoji: '😌', label: 'Calm',        color: '#8aad8f' },
  { key: 'productive', emoji: '💪', label: 'Productive',  color: '#a89bb5' },
  { key: 'tired',      emoji: '😴', label: 'Tired',       color: '#7d5a3c' },
  { key: 'sad',        emoji: '💙', label: 'Sad',         color: '#6b8ab5' },
];

const DATE_CATEGORIES = [
  { key: 'birthday',    icon: '🎂', label: 'Birthday',    color: 'var(--rose)' },
  { key: 'anniversary', icon: '💍', label: 'Anniversary', color: 'var(--gold)' },
  { key: 'achievement', icon: '🏆', label: 'Achievement', color: 'var(--sage)' },
  { key: 'custom',      icon: '📅', label: 'Custom',      color: 'var(--lavender)' },
];

/* ── Storage Helpers ───────────────────────────────────────── */
const Storage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove(key) { localStorage.removeItem(key); },
};

/* ── Profile ───────────────────────────────────────────────── */
const Profile = {
  get()   { return Storage.get(APP_KEYS.PROFILE, { name: 'Dear Diary', joinedAt: new Date().toISOString() }); },
  set(p)  { Storage.set(APP_KEYS.PROFILE, p); },
};

/* ── Settings ──────────────────────────────────────────────── */
const Settings = {
  defaults: { theme: 'light', username: '' },
  get()     { return { ...this.defaults, ...Storage.get(APP_KEYS.SETTINGS, {}) }; },
  set(s)    { Storage.set(APP_KEYS.SETTINGS, s); },
  update(k, v) {
    const s = this.get(); s[k] = v; this.set(s);
  },
};

/* ── Entries ───────────────────────────────────────────────── */
const Entries = {
  getAll()   { return Storage.get(APP_KEYS.ENTRIES, []); },
  getById(id){ return this.getAll().find(e => e.id === id) || null; },
  save(entry){
    const all = this.getAll();
    const idx = all.findIndex(e => e.id === entry.id);
    if (idx >= 0) all[idx] = entry; else all.unshift(entry);
    Storage.set(APP_KEYS.ENTRIES, all);
  },
  delete(id) {
    const all = this.getAll().filter(e => e.id !== id);
    Storage.set(APP_KEYS.ENTRIES, all);
  },
  search(q)  {
    const lower = q.toLowerCase();
    return this.getAll().filter(e =>
      e.title.toLowerCase().includes(lower) ||
      (e.content || '').toLowerCase().includes(lower) ||
      (e.tags || []).some(t => t.toLowerCase().includes(lower))
    );
  },
  getByDate(dateStr) {
    return this.getAll().filter(e => e.date && e.date.startsWith(dateStr));
  },
};

/* ── Reminders ─────────────────────────────────────────────── */
const Reminders = {
  getAll()    { return Storage.get(APP_KEYS.REMINDERS, []); },
  getById(id) { return this.getAll().find(r => r.id === id) || null; },
  save(r) {
    const all = this.getAll();
    const idx = all.findIndex(x => x.id === r.id);
    if (idx >= 0) all[idx] = r; else all.unshift(r);
    Storage.set(APP_KEYS.REMINDERS, all);
  },
  delete(id) {
    Storage.set(APP_KEYS.REMINDERS, this.getAll().filter(r => r.id !== id));
  },
  toggle(id) {
    const r = this.getById(id);
    if (r) { r.completed = !r.completed; this.save(r); }
  },
  getUpcoming() {
    const now = new Date();
    return this.getAll()
      .filter(r => !r.completed && r.datetime)
      .filter(r => new Date(r.datetime) > now)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      .slice(0, 5);
  },
};

/* ── Important Dates ───────────────────────────────────────── */
const ImportantDates = {
  getAll()    { return Storage.get(APP_KEYS.DATES, []); },
  getById(id) { return this.getAll().find(d => d.id === id) || null; },
  save(d) {
    const all = this.getAll();
    const idx = all.findIndex(x => x.id === d.id);
    if (idx >= 0) all[idx] = d; else all.unshift(d);
    Storage.set(APP_KEYS.DATES, all);
  },
  delete(id) {
    Storage.set(APP_KEYS.DATES, this.getAll().filter(d => d.id !== id));
  },
  getUpcoming(limit = 5) {
    const today = new Date(); today.setHours(0,0,0,0);
    return this.getAll()
      .map(d => {
        const next = nextOccurrence(d.date);
        return { ...d, _next: next, _days: daysBetween(today, next) };
      })
      .sort((a, b) => a._days - b._days)
      .slice(0, limit);
  },
};

/* ── Mood Logs ─────────────────────────────────────────────── */
const MoodLogs = {
  getAll()  { return Storage.get(APP_KEYS.MOODS, []); },
  log(mood) {
    const all = this.getAll();
    const today = todayStr();
    const existing = all.find(m => m.date === today);
    if (existing) { existing.mood = mood; existing.updatedAt = new Date().toISOString(); }
    else all.unshift({ id: uid(), date: today, mood, loggedAt: new Date().toISOString() });
    Storage.set(APP_KEYS.MOODS, all);
  },
  getByMonth(year, month) {
    const prefix = `${year}-${String(month).padStart(2,'0')}`;
    return this.getAll().filter(m => m.date && m.date.startsWith(prefix));
  },
  getTodayMood() {
    const t = todayStr();
    return (this.getAll().find(m => m.date === t) || {}).mood || null;
  },
  getSummary() {
    const all = this.getAll();
    const counts = {};
    MOODS.forEach(m => counts[m.key] = 0);
    all.forEach(m => { if (counts[m.mood] !== undefined) counts[m.mood]++; });
    return counts;
  },
};

/* ── Vault ─────────────────────────────────────────────────── */
const Vault = {
  getPin()       { return Storage.get(APP_KEYS.VAULT_PIN, null); },
  setPin(pin)    { Storage.set(APP_KEYS.VAULT_PIN, pin); },
  hasPin()       { return !!this.getPin(); },
  verify(pin)    { return this.getPin() === pin; },
  getNotes()     { return Storage.get(APP_KEYS.VAULT_NOTES, []); },
  getNote(id)    { return this.getNotes().find(n => n.id === id) || null; },
  saveNote(note) {
    const all = this.getNotes();
    const idx = all.findIndex(n => n.id === note.id);
    if (idx >= 0) all[idx] = note; else all.unshift(note);
    Storage.set(APP_KEYS.VAULT_NOTES, all);
  },
  deleteNote(id) {
    Storage.set(APP_KEYS.VAULT_NOTES, this.getNotes().filter(n => n.id !== id));
  },
};

/* ── Utility Functions ─────────────────────────────────────── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr, opts = {}) {
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  const defaults = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', { ...defaults, ...opts });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function nextOccurrence(dateStr) {
  const [, m, d] = dateStr.split('-');
  const today = new Date(); today.setHours(0,0,0,0);
  let next = new Date(today.getFullYear(), +m - 1, +d);
  if (next < today) next.setFullYear(next.getFullYear() + 1);
  return next;
}

function getMoodMeta(key) {
  return MOODS.find(m => m.key === key) || MOODS[0];
}

function getCategoryMeta(key) {
  return DATE_CATEGORIES.find(c => c.key === key) || DATE_CATEGORIES[3];
}

function escape(str = '') {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function truncate(str = '', len = 120) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function highlight(text, query) {
  if (!query) return escape(text);
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return escape(text).replace(re, '<mark class="search-highlight">$1</mark>');
}

/* ── Theme ─────────────────────────────────────────────────── */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  Settings.update('theme', theme);
}

function initTheme() {
  applyTheme(Settings.get().theme || 'light');
}

/* ── Toast Notifications ───────────────────────────────────── */
function showToast(message, type = 'success', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escape(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ── Modal Helpers ─────────────────────────────────────────── */
function openModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  // trap focus
  const firstFocusable = overlay.querySelector('input,textarea,select,button:not(.modal-close)');
  if (firstFocusable) setTimeout(() => firstFocusable.focus(), 100);
}

function closeModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
}

function setupModalClose(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlayId);
  });
  const closeBtn = overlay.querySelector('.modal-close');
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(overlayId));
  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal(overlayId);
  });
}

/* ── Animated Counter ──────────────────────────────────────── */
function animateCounter(el, target, duration = 600) {
  const start = parseInt(el.textContent) || 0;
  const diff = target - start;
  const startTime = performance.now();

  function step(now) {
    const elapsed = Math.min(now - startTime, duration);
    const progress = 1 - Math.pow(1 - elapsed / duration, 3);
    el.textContent = Math.round(start + diff * progress);
    if (elapsed < duration) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ── Sidebar ───────────────────────────────────────────────── */
function initSidebar() {
  const sidebar    = document.querySelector('.sidebar');
  const overlay    = document.querySelector('.sidebar-overlay');
  // Support both old toggle id and new hamburger class
  const hamburger  = document.querySelector('.hamburger-btn') ||
                     document.getElementById('sidebar-toggle');

  if (!sidebar) return;

  /* ── Helpers ── */
  function openSidebar() {
    sidebar.classList.add('mobile-open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scroll
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  }

  function isMobileBreakpoint() {
    return window.innerWidth < 768;
  }

  /* ── Active nav item ── */
  const current = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    if (href && current === href) {
      item.classList.add('active');
    }
  });

  /* ── Hamburger button ── */
  if (hamburger) {
    hamburger.setAttribute('aria-label', 'Toggle navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.addEventListener('click', () => {
      sidebar.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
    });
  }

  /* ── Overlay backdrop ── */
  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  /* ── Close on nav-item click (mobile) ── */
  sidebar.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (isMobileBreakpoint()) closeSidebar();
    });
  });

  /* ── ESC key to close ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
      closeSidebar();
    }
  });

  /* ── Swipe-left to close sidebar (mobile touch) ── */
  let touchStartX = 0;
  let touchStartY = 0;
  sidebar.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  sidebar.addEventListener('touchend', e => {
    if (!isMobileBreakpoint()) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (dx < -60 && dy < 60) closeSidebar();
  }, { passive: true });

  /* ── Swipe-right from left edge to open sidebar (mobile) ── */
  document.addEventListener('touchstart', e => {
    if (!isMobileBreakpoint()) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!isMobileBreakpoint() || sidebar.classList.contains('mobile-open')) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (touchStartX < 24 && dx > 60 && dy < 80) openSidebar();
  }, { passive: true });

  /* ── Resize handler: cleanup state on breakpoint change ── */
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    if (lastWidth !== w) {
      if (w >= 768) {
        // reset to CSS-controlled state
        sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
      lastWidth = w;
    }
  });

  /* ── User info in sidebar ── */
  const profile  = Profile.get();
  const settings = Settings.get();
  const name     = settings.username || profile.name || 'DD';
  const nameEl   = document.getElementById('sidebar-username');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl)   nameEl.textContent   = name;
  if (avatarEl) avatarEl.textContent = name.slice(0, 2).toUpperCase();

  /* ── Reminder badge ── */
  const pending = Reminders.getAll().filter(r => !r.completed).length;
  const badge   = document.getElementById('reminders-badge');
  if (badge) {
    badge.textContent = pending;
    badge.classList.toggle('hidden', pending === 0);
  }
}

/* ── Reminder Popups (browser-style) ──────────────────────── */
function checkReminders() {
  const now = new Date();
  const reminders = Reminders.getAll().filter(r => !r.completed && r.datetime);

  reminders.forEach(r => {
    const rDate = new Date(r.datetime);
    const diff = Math.abs(now - rDate);
    if (diff < 60000 && !sessionStorage.getItem('fired_' + r.id)) {
      sessionStorage.setItem('fired_' + r.id, '1');
      showReminderPopup(r);
    }
  });
}

function showReminderPopup(reminder) {
  const popup = document.createElement('div');
  popup.className = 'toast toast-warning';
  popup.style.cssText = 'min-width:320px;cursor:pointer;';
  popup.innerHTML = `
    <span class="toast-icon">⏰</span>
    <div>
      <div style="font-weight:600;font-size:.875rem;">${escape(reminder.title)}</div>
      ${reminder.note ? `<div style="font-size:.78rem;color:var(--text-muted);margin-top:2px;">${escape(reminder.note)}</div>` : ''}
    </div>`;

  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  container.appendChild(popup);

  popup.addEventListener('click', () => {
    Reminders.toggle(reminder.id);
    popup.remove();
  });

  setTimeout(() => {
    popup.classList.add('removing');
    setTimeout(() => popup.remove(), 300);
  }, 8000);
}

/* ── Export / Import ───────────────────────────────────────── */
function exportData() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    profile: Profile.get(),
    entries: Entries.getAll(),
    reminders: Reminders.getAll(),
    dates: ImportantDates.getAll(),
    moods: MoodLogs.getAll(),
    settings: Settings.get(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `digital-diary-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!', 'success');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.entries)   Storage.set(APP_KEYS.ENTRIES,   data.entries);
      if (data.reminders) Storage.set(APP_KEYS.REMINDERS, data.reminders);
      if (data.dates)     Storage.set(APP_KEYS.DATES,     data.dates);
      if (data.moods)     Storage.set(APP_KEYS.MOODS,     data.moods);
      if (data.profile)   Storage.set(APP_KEYS.PROFILE,   data.profile);
      if (data.settings)  Storage.set(APP_KEYS.SETTINGS,  data.settings);
      showToast('Data imported successfully! Refreshing…', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch {
      showToast('Invalid backup file.', 'error');
    }
  };
  reader.readAsText(file);
}

/* ── Skeleton Loaders ──────────────────────────────────────── */
function createSkeleton(rows = 3, cls = '') {
  return Array.from({ length: rows }, () =>
    `<div class="skeleton ${cls}" style="height:80px;margin-bottom:12px;border-radius:var(--radius-md)"></div>`
  ).join('');
}

/* ── Initialize App ────────────────────────────────────────── */
function initApp() {
  initTheme();
  initSidebar();

  // Check reminders every minute
  checkReminders();
  setInterval(checkReminders, 60000);

  // Theme toggle button
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
      themeBtn.textContent = current === 'dark' ? '🌙' : '☀️';
    });
    const theme = Settings.get().theme;
    themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
