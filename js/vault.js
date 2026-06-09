/* ============================================================
   Digital Diary — Private Vault Module (vault.js)
   ============================================================ */

'use strict';

let vaultUnlocked    = false;
let currentNoteId    = null;

/* ── PIN Setup & Verification ──────────────────────────────── */
function initVaultPage() {
  const lockScreen   = document.getElementById('vault-lock-screen');
  const unlockedView = document.getElementById('vault-unlocked');
  const setupView    = document.getElementById('vault-setup');

  if (!lockScreen) return;

  if (!Vault.hasPin()) {
    // First-time setup
    lockScreen.classList.add('hidden');
    if (setupView) setupView.classList.remove('hidden');
    if (unlockedView) unlockedView.classList.add('hidden');
  } else if (!vaultUnlocked) {
    lockScreen.classList.remove('hidden');
    if (setupView) setupView?.classList.add('hidden');
    if (unlockedView) unlockedView.classList.add('hidden');
  } else {
    showVaultUnlocked();
  }
}

function setupPinDigitInputs(containerSelector, onComplete) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const digits = container.querySelectorAll('.pin-digit');
  digits.forEach((digit, i) => {
    digit.addEventListener('input', e => {
      // Allow only digits
      digit.value = digit.value.replace(/\D/g, '').slice(-1);
      if (digit.value && i < digits.length - 1) digits[i + 1].focus();
      if (i === digits.length - 1 && digit.value) {
        const pin = Array.from(digits).map(d => d.value).join('');
        if (pin.length === 4) onComplete(pin);
      }
    });

    digit.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !digit.value && i > 0) {
        digits[i - 1].focus();
        digits[i - 1].value = '';
      }
    });

    digit.addEventListener('paste', e => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'').slice(0,4);
      text.split('').forEach((ch, j) => { if (digits[j]) digits[j].value = ch; });
      if (text.length === 4) onComplete(text);
    });
  });
}

/* ── Unlock Vault ──────────────────────────────────────────── */
function unlockVault(pin) {
  const errorEl = document.getElementById('pin-error');

  if (Vault.verify(pin)) {
    vaultUnlocked = true;
    if (errorEl) errorEl.classList.add('hidden');

    // Animate lock screen out
    const lockScreen = document.getElementById('vault-lock-screen');
    if (lockScreen) {
      lockScreen.style.opacity = '0';
      lockScreen.style.transform = 'scale(0.95)';
      lockScreen.style.transition = 'all 0.3s ease';
      setTimeout(() => showVaultUnlocked(), 300);
    }
  } else {
    // Wrong PIN
    if (errorEl) errorEl.classList.remove('hidden');
    // Shake animation
    const card = document.querySelector('.vault-lock-card');
    if (card) {
      card.style.animation = 'none';
      card.style.transform = 'translateX(-8px)';
      setTimeout(() => { card.style.transform = 'translateX(8px)'; }, 80);
      setTimeout(() => { card.style.transform = 'translateX(-5px)'; }, 160);
      setTimeout(() => { card.style.transform = 'translateX(0)'; }, 240);
    }

    // Clear inputs
    document.querySelectorAll('#lock-pin-inputs .pin-digit').forEach(d => d.value = '');
    document.querySelector('#lock-pin-inputs .pin-digit')?.focus();
  }
}

/* ── Setup New PIN ─────────────────────────────────────────── */
let setupPin1 = '';

function setupNewPin(pin) {
  const step1 = document.getElementById('setup-step1');
  const step2 = document.getElementById('setup-step2');

  if (!setupPin1) {
    setupPin1 = pin;
    if (step1) step1.classList.add('hidden');
    if (step2) {
      step2.classList.remove('hidden');
      step2.querySelector('.pin-digit')?.focus();
    }
  } else {
    if (pin === setupPin1) {
      Vault.setPin(pin);
      vaultUnlocked = true;
      document.getElementById('vault-setup')?.classList.add('hidden');
      showVaultUnlocked();
      showToast('Vault PIN created! 🔒', 'success');
    } else {
      showToast('PINs do not match. Try again.', 'error');
      setupPin1 = '';
      if (step1) step1.classList.remove('hidden');
      if (step2) step2.classList.add('hidden');
      document.querySelectorAll('.pin-digit').forEach(d => d.value = '');
      step1?.querySelector('.pin-digit')?.focus();
    }
  }
}

/* ── Show Unlocked Vault ───────────────────────────────────── */
function showVaultUnlocked() {
  const lockScreen   = document.getElementById('vault-lock-screen');
  const unlockedView = document.getElementById('vault-unlocked');
  const setupView    = document.getElementById('vault-setup');

  if (lockScreen)   lockScreen.classList.add('hidden');
  if (setupView)    setupView.classList.add('hidden');
  if (unlockedView) {
    unlockedView.classList.remove('hidden');
    unlockedView.classList.add('vault-unlocked');
  }

  renderVaultNotes();
}

/* ── Lock Vault ────────────────────────────────────────────── */
function lockVault() {
  vaultUnlocked = false;
  const lockScreen   = document.getElementById('vault-lock-screen');
  const unlockedView = document.getElementById('vault-unlocked');

  if (unlockedView) unlockedView.classList.add('hidden');
  if (lockScreen)   {
    lockScreen.classList.remove('hidden');
    lockScreen.style.opacity = '';
    lockScreen.style.transform = '';
  }

  // Clear PIN inputs
  document.querySelectorAll('#lock-pin-inputs .pin-digit').forEach(d => d.value = '');
  document.querySelector('#lock-pin-inputs .pin-digit')?.focus();
}

/* ── Render Vault Notes ────────────────────────────────────── */
function renderVaultNotes() {
  const container = document.getElementById('vault-notes-grid');
  if (!container) return;

  const notes = Vault.getNotes();

  if (notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🔐</div>
        <div class="empty-state-title">Your vault is empty</div>
        <div class="empty-state-desc">Store your most private thoughts here — completely hidden behind your PIN.</div>
        <button class="btn btn-primary" onclick="openVaultNoteModal()">＋ Add Private Note</button>
      </div>`;
    return;
  }

  container.innerHTML = notes.map((n, i) => `
    <div class="vault-note-card animate-fade-in" style="animation-delay:${i*60}ms"
         onclick="viewVaultNote('${n.id}')">
      <div class="vault-note-title">${escape(n.title)}</div>
      <div class="vault-note-preview">${escape(truncate(n.content || '', 180))}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:var(--space-3)">
        <span class="vault-note-date">📅 ${formatDate(n.createdAt, { month:'short', day:'numeric', year:'numeric' })}</span>
        <div style="display:flex;gap:6px" onclick="event.stopPropagation()">
          <button class="card-action-btn" onclick="openVaultNoteModal('${n.id}')">✏️</button>
          <button class="card-action-btn danger" onclick="deleteVaultNote('${n.id}')">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

/* ── Vault Note Modal ──────────────────────────────────────── */
function openVaultNoteModal(id = null) {
  currentNoteId = id;
  const titleEl = document.getElementById('vault-modal-title');

  if (id) {
    const note = Vault.getNote(id);
    if (!note) return;
    if (titleEl) titleEl.textContent = 'Edit Private Note';
    document.getElementById('vn-title').value   = note.title || '';
    document.getElementById('vn-content').value = note.content || '';
  } else {
    if (titleEl) titleEl.textContent = 'New Private Note';
    document.getElementById('vn-title').value   = '';
    document.getElementById('vn-content').value = '';
  }

  openModal('vault-note-modal');
}

function saveVaultNote() {
  const title   = (document.getElementById('vn-title')?.value || '').trim();
  const content = (document.getElementById('vn-content')?.value || '').trim();

  if (!title) { showToast('Please enter a note title.', 'error'); return; }

  const now  = new Date().toISOString();
  const note = currentNoteId
    ? { ...Vault.getNote(currentNoteId) }
    : { id: uid(), createdAt: now };

  note.title     = title;
  note.content   = content;
  note.updatedAt = now;

  Vault.saveNote(note);
  closeModal('vault-note-modal');
  renderVaultNotes();
  showToast('Note saved securely!', 'success');
  currentNoteId = null;
}

function viewVaultNote(id) {
  const note = Vault.getNote(id);
  if (!note) return;

  const headerEl = document.getElementById('vault-view-header');
  const bodyEl   = document.getElementById('vault-view-body');

  if (headerEl) {
    headerEl.innerHTML = `
      <div class="entry-view-date">🔐 Private Note · ${formatDate(note.createdAt, { month:'long', day:'numeric', year:'numeric' })}</div>
      <div class="entry-view-title">${escape(note.title)}</div>`;
  }

  if (bodyEl) bodyEl.textContent = note.content || '';

  document.getElementById('vault-view-edit-btn')?.addEventListener('click', () => {
    closeModal('vault-view-modal');
    openVaultNoteModal(id);
  });

  openModal('vault-view-modal');
}

function deleteVaultNote(id) {
  const note = Vault.getNote(id);
  if (!note) return;

  const nameEl = document.getElementById('confirm-delete-name');
  if (nameEl) nameEl.textContent = note.title;

  const confirmBtn = document.getElementById('confirm-delete-btn');
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      Vault.deleteNote(id);
      closeModal('confirm-delete-modal');
      renderVaultNotes();
      showToast('Note deleted.', 'info');
    };
  }

  openModal('confirm-delete-modal');
}

/* ── Change PIN ────────────────────────────────────────────── */
function openChangePinModal() {
  document.querySelectorAll('#change-pin-modal .pin-digit').forEach(d => d.value = '');
  openModal('change-pin-modal');
}

let changePinStep = 0;
let changePinOld  = '';
let changePinNew  = '';

function handleChangePinStep(pin) {
  if (changePinStep === 0) {
    if (!Vault.verify(pin)) {
      showToast('Incorrect current PIN.', 'error');
      document.querySelectorAll('#change-old-pin .pin-digit').forEach(d => d.value = '');
      return;
    }
    changePinOld = pin;
    changePinStep = 1;
    document.getElementById('change-pin-step1')?.classList.add('hidden');
    document.getElementById('change-pin-step2')?.classList.remove('hidden');
  } else if (changePinStep === 1) {
    changePinNew = pin;
    changePinStep = 2;
    document.getElementById('change-pin-step2')?.classList.add('hidden');
    document.getElementById('change-pin-step3')?.classList.remove('hidden');
  } else {
    if (pin === changePinNew) {
      Vault.setPin(pin);
      closeModal('change-pin-modal');
      showToast('PIN changed successfully!', 'success');
      changePinStep = 0;
    } else {
      showToast('PINs do not match.', 'error');
      changePinStep = 1;
      document.getElementById('change-pin-step3')?.classList.add('hidden');
      document.getElementById('change-pin-step2')?.classList.remove('hidden');
    }
  }
}

/* ── Init Vault Page ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('vault-lock-screen') && !document.getElementById('vault-setup')) return;

  initVaultPage();

  // Unlock PIN inputs
  setupPinDigitInputs('#lock-pin-inputs', unlockVault);

  // Setup PIN (new vault)
  setupPinDigitInputs('#setup-pin-step1 .pin-digits', (pin) => setupNewPin(pin));
  setupPinDigitInputs('#setup-pin-step2 .pin-digits', (pin) => setupNewPin(pin));

  // Lock button
  document.getElementById('lock-vault-btn')?.addEventListener('click', lockVault);

  // Note modal
  document.getElementById('new-note-btn')?.addEventListener('click', () => openVaultNoteModal());
  document.getElementById('save-vault-note-btn')?.addEventListener('click', saveVaultNote);

  setupModalClose('vault-note-modal');
  setupModalClose('vault-view-modal');
  setupModalClose('confirm-delete-modal');

  // Change PIN modal
  document.getElementById('change-pin-btn')?.addEventListener('click', () => {
    changePinStep = 0;
    document.getElementById('change-pin-step1')?.classList.remove('hidden');
    document.getElementById('change-pin-step2')?.classList.add('hidden');
    document.getElementById('change-pin-step3')?.classList.add('hidden');
    openChangePinModal();
  });

  setupPinDigitInputs('#change-old-pin', (pin) => handleChangePinStep(pin));
  setupPinDigitInputs('#change-new-pin', (pin) => handleChangePinStep(pin));
  setupPinDigitInputs('#change-confirm-pin', (pin) => handleChangePinStep(pin));
  setupModalClose('change-pin-modal');
});
