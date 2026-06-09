/* ============================================================
   Digital Diary — Reminders Module (reminders.js)
   ============================================================ */

'use strict';

let reminderFilter = 'all'; // 'all' | 'upcoming' | 'completed'

/* ── Render Reminders Page ─────────────────────────────────── */
function renderRemindersPage() {
  const container = document.getElementById('reminders-list');
  if (!container) return;

  let all = Reminders.getAll();

  if (reminderFilter === 'upcoming') {
    all = all.filter(r => !r.completed);
  } else if (reminderFilter === 'completed') {
    all = all.filter(r => r.completed);
  }

  // Sort: incomplete first, then by datetime
  all.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.datetime && !b.datetime) return 0;
    if (!a.datetime) return 1;
    if (!b.datetime) return -1;
    return new Date(a.datetime) - new Date(b.datetime);
  });

  if (all.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⏰</div>
        <div class="empty-state-title">No reminders yet</div>
        <div class="empty-state-desc">Stay on top of your day by setting reminders for important tasks and events.</div>
        <button class="btn btn-primary" onclick="openReminderModal()">＋ Add Reminder</button>
      </div>`;
    return;
  }

  container.innerHTML = all.map((r, i) => renderReminderItem(r, i)).join('');
  renderUpcomingReminders();
  updateReminderCounts();
}

function renderReminderItem(r, i) {
  const priority = r.priority || 'medium';
  const isOverdue = !r.completed && r.datetime && new Date(r.datetime) < new Date();
  const timeLabel = r.datetime
    ? (isOverdue ? `Overdue · ${formatDateTime(r.datetime)}` : formatDateTime(r.datetime))
    : 'No time set';

  return `
    <div class="reminder-item ${r.completed ? 'completed' : ''} animate-fade-in"
         style="animation-delay:${i*40}ms"
         data-id="${r.id}">
      <div class="reminder-check" onclick="toggleReminder('${r.id}')" role="checkbox" aria-checked="${r.completed}" tabindex="0">
        ${r.completed ? '✓' : ''}
      </div>
      <div class="reminder-body">
        <div class="reminder-title">${escape(r.title)}</div>
        <div class="reminder-meta">
          <span class="reminder-time ${isOverdue ? 'overdue' : ''}">⏰ ${timeLabel}</span>
          <span class="tag ${priorityClass(priority)}">${capitalizeFirst(priority)}</span>
        </div>
        ${r.note ? `<div class="reminder-note">${escape(r.note)}</div>` : ''}
      </div>
      <div class="reminder-actions">
        <button class="card-action-btn" title="Edit" onclick="openReminderModal('${r.id}')">✏️</button>
        <button class="card-action-btn danger" title="Delete" onclick="deleteReminderConfirm('${r.id}')">🗑️</button>
      </div>
    </div>`;
}

function renderUpcomingReminders() {
  const container = document.getElementById('upcoming-reminders-list');
  if (!container) return;

  const upcoming = Reminders.getUpcoming();

  if (upcoming.length === 0) {
    container.innerHTML = `<div class="text-muted text-small" style="padding:var(--space-3)">No upcoming reminders</div>`;
    return;
  }

  container.innerHTML = upcoming.map(r => `
    <div class="upcoming-reminder-item priority-${r.priority || 'medium'}">
      <div class="upcoming-r-title">${escape(r.title)}</div>
      <div class="upcoming-r-time">⏰ ${formatDateTime(r.datetime)}</div>
    </div>`).join('');
}

function updateReminderCounts() {
  const all       = Reminders.getAll();
  const pending   = all.filter(r => !r.completed).length;
  const completed = all.filter(r => r.completed).length;

  const pendingEl   = document.getElementById('pending-count');
  const completedEl = document.getElementById('completed-count');
  if (pendingEl)   pendingEl.textContent   = pending;
  if (completedEl) completedEl.textContent = completed;
}

/* ── Toggle Reminder ───────────────────────────────────────── */
function toggleReminder(id) {
  Reminders.toggle(id);
  renderRemindersPage();
  showToast(Reminders.getById(id)?.completed ? 'Marked complete! 🎉' : 'Marked incomplete.', 'success');
}

/* ── Reminder Modal ────────────────────────────────────────── */
let currentReminderId = null;

function openReminderModal(id = null) {
  currentReminderId = id;
  const modalTitle = document.getElementById('reminder-modal-title');

  if (id) {
    const r = Reminders.getById(id);
    if (!r) return;
    if (modalTitle) modalTitle.textContent = 'Edit Reminder';
    document.getElementById('r-title').value    = r.title || '';
    document.getElementById('r-datetime').value = r.datetime ? r.datetime.slice(0,16) : '';
    document.getElementById('r-note').value     = r.note || '';
    document.getElementById('r-priority').value = r.priority || 'medium';
  } else {
    if (modalTitle) modalTitle.textContent = 'New Reminder';
    document.getElementById('r-title').value    = '';
    document.getElementById('r-datetime').value = '';
    document.getElementById('r-note').value     = '';
    document.getElementById('r-priority').value = 'medium';
  }

  openModal('reminder-modal');
}

function saveReminder() {
  const title    = (document.getElementById('r-title')?.value || '').trim();
  const datetime = document.getElementById('r-datetime')?.value || '';
  const note     = (document.getElementById('r-note')?.value || '').trim();
  const priority = document.getElementById('r-priority')?.value || 'medium';

  if (!title) { showToast('Please enter a reminder title.', 'error'); return; }

  const reminder = currentReminderId
    ? { ...Reminders.getById(currentReminderId) }
    : { id: uid(), completed: false, createdAt: new Date().toISOString() };

  reminder.title    = title;
  reminder.datetime = datetime ? new Date(datetime).toISOString() : '';
  reminder.note     = note;
  reminder.priority = priority;

  Reminders.save(reminder);
  closeModal('reminder-modal');
  renderRemindersPage();
  showToast(currentReminderId ? 'Reminder updated!' : 'Reminder created!', 'success');
  currentReminderId = null;
}

function deleteReminderConfirm(id) {
  const r = Reminders.getById(id);
  if (!r) return;
  const nameEl = document.getElementById('confirm-delete-name');
  if (nameEl) nameEl.textContent = r.title;
  const confirmBtn = document.getElementById('confirm-delete-btn');
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      Reminders.delete(id);
      closeModal('confirm-delete-modal');
      renderRemindersPage();
      showToast('Reminder deleted.', 'info');
    };
  }
  openModal('confirm-delete-modal');
}

/* ── Helpers ───────────────────────────────────────────────── */
function priorityClass(p) {
  const map = { high: 'tag priority-high', medium: 'tag priority-medium', low: 'tag priority-low' };
  return map[p] || 'tag priority-medium';
}

function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/* ── Init Reminders Page ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('reminders-list')) return;

  renderRemindersPage();

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      reminderFilter = chip.dataset.filter || 'all';
      renderRemindersPage();
    });
  });

  // New reminder button
  document.getElementById('new-reminder-btn')?.addEventListener('click', () => openReminderModal());
  document.getElementById('save-reminder-btn')?.addEventListener('click', saveReminder);

  setupModalClose('reminder-modal');
  setupModalClose('confirm-delete-modal');
});
