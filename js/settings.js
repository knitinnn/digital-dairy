/* ============================================================
   Digital Diary — Settings Module (settings.js)
   ============================================================ */

'use strict';

let activeSection = 'profile';

/* ── Render Settings Page ──────────────────────────────────── */
function renderSettingsPage() {
  loadProfileSettings();
  loadAppearanceSettings();
  renderSettingsNav();
}

function loadProfileSettings() {
  const settings = Settings.get();
  const profile  = Profile.get();
  const nameEl   = document.getElementById('settings-username');
  if (nameEl) nameEl.value = settings.username || profile.name || '';
}

function loadAppearanceSettings() {
  const settings = Settings.get();
  const themeSelect = document.getElementById('settings-theme');
  if (themeSelect) {
    themeSelect.value = settings.theme || 'light';
    themeSelect.addEventListener('change', () => {
      applyTheme(themeSelect.value);
      showToast('Theme updated!', 'success');
    });
  }
}

/* ── Settings Navigation ───────────────────────────────────── */
function renderSettingsNav() {
  document.querySelectorAll('.settings-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === activeSection);
    item.addEventListener('click', () => {
      activeSection = item.dataset.section;
      document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.settings-section').forEach(s => s.classList.add('hidden'));
      const target = document.getElementById(`section-${item.dataset.section}`);
      if (target) target.classList.remove('hidden');
    });
  });

  // Show initial section
  document.querySelectorAll('.settings-section').forEach(s => s.classList.add('hidden'));
  const initial = document.getElementById(`section-${activeSection}`);
  if (initial) initial.classList.remove('hidden');
}

/* ── Save Username ─────────────────────────────────────────── */
function saveUsername() {
  const val = (document.getElementById('settings-username')?.value || '').trim();
  if (!val) { showToast('Please enter a name.', 'error'); return; }
  Settings.update('username', val);
  Profile.set({ ...Profile.get(), name: val });

  // Update sidebar
  const nameEl   = document.getElementById('sidebar-username');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl)   nameEl.textContent   = val;
  if (avatarEl) avatarEl.textContent = val.slice(0,2).toUpperCase();

  showToast('Name updated!', 'success');
}

/* ── Export / Import (Settings page) ──────────────────────── */
function handleExport() { exportData(); }

function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importData(file);
  });
  input.click();
}

/* ── Reset All Data ────────────────────────────────────────── */
function resetAllData() {
  const confirmed = document.getElementById('reset-confirm-text')?.value?.trim() === 'DELETE';
  if (!confirmed) {
    showToast('Please type DELETE to confirm.', 'error');
    return;
  }

  Object.values(APP_KEYS).forEach(k => Storage.remove(k));
  showToast('All data reset. Reloading…', 'info');
  setTimeout(() => location.reload(), 1500);
}

/* ── Vault PIN Section ─────────────────────────────────────── */
function renderVaultStatus() {
  const statusEl = document.getElementById('vault-pin-status');
  if (!statusEl) return;
  statusEl.textContent = Vault.hasPin() ? 'PIN is set ✓' : 'No PIN set';
  statusEl.style.color = Vault.hasPin() ? 'var(--sage-dark)' : 'var(--text-muted)';
}

/* ── Data Overview Stats ───────────────────────────────────── */
function renderDataStats() {
  const stats = [
    { id: 'stat-entries',   val: Entries.getAll().length,       label: 'diary entries' },
    { id: 'stat-reminders', val: Reminders.getAll().length,     label: 'reminders' },
    { id: 'stat-dates',     val: ImportantDates.getAll().length, label: 'important dates' },
    { id: 'stat-moods',     val: MoodLogs.getAll().length,      label: 'mood logs' },
  ];

  stats.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) el.textContent = s.val;
  });
}

/* ── Init Settings Page ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('settings-username') && !document.querySelector('.settings-nav')) return;

  renderSettingsPage();
  renderVaultStatus();
  renderDataStats();

  document.getElementById('save-username-btn')?.addEventListener('click', saveUsername);
  document.getElementById('export-btn')?.addEventListener('click', handleExport);
  document.getElementById('import-btn')?.addEventListener('click', handleImport);
  document.getElementById('reset-btn')?.addEventListener('click', resetAllData);

  // Change vault PIN from settings
  document.getElementById('settings-change-pin')?.addEventListener('click', () => {
    window.location.href = 'vault.html';
  });

  // Confirm delete modal
  setupModalClose('confirm-reset-modal');
  document.getElementById('open-reset-modal')?.addEventListener('click', () => {
    const el = document.getElementById('reset-confirm-text');
    if (el) el.value = '';
    openModal('confirm-reset-modal');
  });

  document.getElementById('confirm-reset-btn')?.addEventListener('click', resetAllData);
});
