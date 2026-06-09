/* ============================================================
   Digital Diary — Calendar Module (calendar.js)
   ============================================================ */

'use strict';

let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-based
let selectedDay = null;

/* ── Render Calendar ───────────────────────────────────────── */
function renderCalendar() {
  renderCalendarGrid();
  renderDayPanel(selectedDay || todayStr());
}

function renderCalendarGrid() {
  const titleEl = document.getElementById('cal-month-title');
  const gridEl  = document.getElementById('cal-grid-body');
  if (!gridEl) return;

  const monthName = new Date(calYear, calMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  if (titleEl) titleEl.textContent = monthName;

  const entries   = Entries.getAll();
  const dates     = ImportantDates.getAll();
  const reminders = Reminders.getAll();

  // Build lookup maps (by "YYYY-MM-DD")
  const entryDates = new Set(entries.map(e => (e.date || e.createdAt || '').slice(0, 10)));
  const importantDates = new Set();
  dates.forEach(d => {
    if (!d.date) return;
    const [, m, day] = d.date.split('-');
    const key = `${calYear}-${m}-${day}`;
    importantDates.add(key);
  });
  const reminderDates = new Set(reminders.map(r => (r.datetime || '').slice(0, 10)));

  // First day of month and number of days
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev  = new Date(calYear, calMonth, 0).getDate();
  const today       = todayStr();

  let cells = '';

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrev - i;
    const m   = calMonth === 0 ? 12 : calMonth;
    const y   = calMonth === 0 ? calYear - 1 : calYear;
    const ds  = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    cells += renderCell(day, ds, 'other-month', entryDates, importantDates, reminderDates, today);
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells += renderCell(d, ds, '', entryDates, importantDates, reminderDates, today);
  }

  // Next month days (fill grid to 42)
  const remaining = 42 - (firstDay + daysInMonth);
  for (let d = 1; d <= remaining; d++) {
    const m = calMonth === 11 ? 1 : calMonth + 2;
    const y = calMonth === 11 ? calYear + 1 : calYear;
    const ds = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells += renderCell(d, ds, 'other-month', entryDates, importantDates, reminderDates, today);
  }

  gridEl.innerHTML = cells;

  // Attach click handlers
  gridEl.querySelectorAll('.calendar-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const ds = cell.dataset.date;
      selectedDay = ds;
      gridEl.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      renderDayPanel(ds);
    });
  });

  // Mark selected
  if (selectedDay) {
    const sel = gridEl.querySelector(`[data-date="${selectedDay}"]`);
    if (sel) sel.classList.add('selected');
  }
}

function renderCell(day, dateStr, extra, entryDates, importantDates, reminderDates, today) {
  const isToday     = dateStr === today;
  const hasEntry    = entryDates.has(dateStr);
  const hasImport   = importantDates.has(dateStr);
  const hasReminder = reminderDates.has(dateStr);

  const classes = [
    'calendar-cell',
    extra,
    isToday     ? 'today'          : '',
    hasEntry    ? 'has-entry'      : '',
    hasImport   ? 'has-important'  : '',
  ].filter(Boolean).join(' ');

  const dots = [
    hasEntry    ? '<span class="cal-dot cal-dot-entry"></span>'     : '',
    hasImport   ? '<span class="cal-dot cal-dot-important"></span>' : '',
    hasReminder ? '<span class="cal-dot cal-dot-reminder"></span>'  : '',
  ].join('');

  return `
    <div class="${classes}" data-date="${dateStr}" role="button" aria-label="${dateStr}" tabindex="0">
      <span class="cal-date">${day}</span>
      <div class="cal-dots">${dots}</div>
    </div>`;
}

/* ── Day Panel ─────────────────────────────────────────────── */
function renderDayPanel(dateStr) {
  const panelEl = document.getElementById('day-panel-content');
  if (!panelEl) return;

  const entries   = Entries.getByDate(dateStr);
  const reminders = Reminders.getAll().filter(r => (r.datetime || '').startsWith(dateStr));
  const dates     = ImportantDates.getAll().filter(d => {
    if (!d.date) return false;
    const [, m, day] = d.date.split('-');
    const ds = `${new Date(dateStr).getFullYear()}-${m}-${day}`;
    return ds === dateStr;
  });

  const dateLabel = formatDate(dateStr, { weekday: 'long', month: 'long', day: 'numeric' });
  const titleEl   = document.getElementById('day-panel-title');
  if (titleEl) titleEl.textContent = dateLabel;

  let html = '';

  if (entries.length > 0) {
    html += `<div class="day-panel-section">
      <div class="day-panel-label">📖 Diary Entries</div>
      ${entries.map(e => `
        <div class="day-entry-item" onclick="navigateToEntry('${e.id}')">
          <div class="day-entry-item-title">${escape(e.title)}</div>
          <div class="day-entry-item-time">${e.time || ''}</div>
        </div>`).join('')}
    </div>`;
  }

  if (dates.length > 0) {
    html += `<div class="day-panel-section">
      <div class="day-panel-label">🎂 Important Dates</div>
      ${dates.map(d => {
        const cat = getCategoryMeta(d.category);
        return `<div class="day-entry-item">
          <div class="day-entry-item-title">${cat.icon} ${escape(d.name)}</div>
          <div class="day-entry-item-time">${cat.label}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  if (reminders.length > 0) {
    html += `<div class="day-panel-section">
      <div class="day-panel-label">⏰ Reminders</div>
      ${reminders.map(r => `
        <div class="day-entry-item ${r.completed ? 'opacity-50' : ''}">
          <div class="day-entry-item-title">${r.completed ? '✅ ' : ''}${escape(r.title)}</div>
          <div class="day-entry-item-time">${formatTime(r.datetime)}</div>
        </div>`).join('')}
    </div>`;
  }

  if (!html) {
    html = `<div class="empty-state" style="padding:var(--space-8) var(--space-4)">
      <div class="empty-state-icon" style="font-size:2rem">🌿</div>
      <div class="empty-state-title" style="font-size:0.95rem">A quiet day</div>
      <div class="empty-state-desc" style="font-size:0.78rem">No entries for this date.</div>
      <button class="btn btn-primary btn-sm" onclick="window.location.href='diary.html'">Write Entry</button>
    </div>`;
  }

  panelEl.innerHTML = html;
}

function navigateToEntry(id) {
  sessionStorage.setItem('open_entry', id);
  window.location.href = 'diary.html';
}

/* ── Month Navigation ──────────────────────────────────────── */
function prevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function nextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

function goToday() {
  calYear  = new Date().getFullYear();
  calMonth = new Date().getMonth();
  selectedDay = todayStr();
  renderCalendar();
}

/* ── Mini Calendar (for dashboard) ────────────────────────── */
function renderMiniCalendar(containerId, year, month) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const entryDates = new Set(Entries.getAll().map(e => (e.date || e.createdAt || '').slice(0, 10)));
  const importantDs = new Set();
  ImportantDates.getAll().forEach(d => {
    if (!d.date) return;
    const [, m, day] = d.date.split('-');
    importantDs.add(`${year}-${m}-${day}`);
  });

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const today       = todayStr();

  const days = ['S','M','T','W','T','F','S'];
  let gridHTML = days.map(d => `<div class="mini-cal-day-name">${d}</div>`).join('');

  for (let i = firstDay - 1; i >= 0; i--) {
    gridHTML += `<div class="mini-cal-cell other-month">${daysInPrev - i}</div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cls = [
      'mini-cal-cell',
      ds === today     ? 'today'      : '',
      entryDates.has(ds) ? 'has-entry' : '',
      importantDs.has(ds) ? 'important' : '',
    ].filter(Boolean).join(' ');
    gridHTML += `<div class="${cls}" title="${ds}">${d}</div>`;
  }

  const remaining = 42 - (firstDay + daysInMonth);
  for (let d = 1; d <= remaining; d++) {
    gridHTML += `<div class="mini-cal-cell other-month">${d}</div>`;
  }

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month:'short', year:'numeric' });

  el.innerHTML = `
    <div class="mini-cal-header">
      <button class="mini-cal-nav" onclick="miniCalPrev('${containerId}')">‹</button>
      <span class="mini-cal-title">${monthLabel}</span>
      <button class="mini-cal-nav" onclick="miniCalNext('${containerId}')">›</button>
    </div>
    <div class="mini-cal-grid">${gridHTML}</div>`;
}

let miniCalYear  = new Date().getFullYear();
let miniCalMonth = new Date().getMonth();

function miniCalPrev(id) {
  miniCalMonth--;
  if (miniCalMonth < 0) { miniCalMonth = 11; miniCalYear--; }
  renderMiniCalendar(id, miniCalYear, miniCalMonth);
}

function miniCalNext(id) {
  miniCalMonth++;
  if (miniCalMonth > 11) { miniCalMonth = 0; miniCalYear++; }
  renderMiniCalendar(id, miniCalYear, miniCalMonth);
}

/* ── Init Calendar Page ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('cal-grid-body')) return;

  renderCalendar();
  selectedDay = todayStr();

  document.getElementById('cal-prev')?.addEventListener('click', prevMonth);
  document.getElementById('cal-next')?.addEventListener('click', nextMonth);
  document.getElementById('cal-today')?.addEventListener('click', goToday);

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  prevMonth();
    if (e.key === 'ArrowRight') nextMonth();
  });
});
