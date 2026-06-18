/* ============================================================
   Digital Diary — Core Authentication Logic (auth.js)
   ============================================================ */

'use strict';

const AuthStorage = {
  // Get all registered users from local storage
  getUsers() {
    try {
      const users = localStorage.getItem('users');
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  },

  // Save the complete users database to local storage
  saveUsers(users) {
    try {
      localStorage.setItem('users', JSON.stringify(users));
      return true;
    } catch {
      return false;
    }
  },

  // Get currently logged-in user session
  getCurrentUser() {
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // Set currently logged-in user session
  setCurrentUser(user) {
    try {
      // Store standard session details: name, mobile, and session start time
      const sessionData = {
        name: user.name,
        mobile: user.mobile,
        joinedAt: user.joinedAt || new Date().toISOString()
      };
      localStorage.setItem('currentUser', JSON.stringify(sessionData));
      return true;
    } catch {
      return false;
    }
  },

  // Clear logged-in user session
  clearCurrentUser() {
    localStorage.removeItem('currentUser');
  },

  // Find a registered user by mobile number
  findUserByMobile(mobile) {
    const users = this.getUsers();
    return users.find(u => u.mobile === mobile) || null;
  },

  // Save new user registration
  registerUser(user) {
    const users = this.getUsers();
    // Double check duplicate mobile number
    if (users.some(u => u.mobile === user.mobile)) {
      return { success: false, message: 'Mobile number already registered.' };
    }
    users.push({
      name: user.name,
      mobile: user.mobile,
      password: user.password,
      securityQuestion: user.securityQuestion,
      securityAnswer: user.securityAnswer,
      joinedAt: new Date().toISOString()
    });
    const saved = this.saveUsers(users);
    if (saved) {
      return { success: true, message: 'Account created successfully. Please login.' };
    } else {
      return { success: false, message: 'Error saving account data. Local storage might be full.' };
    }
  },

  // Update password for a registered user (by mobile)
  resetPassword(mobile, newPassword) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.mobile === mobile);
    if (index === -1) {
      return { success: false, message: 'Mobile number not found.' };
    }
    users[index].password = newPassword;
    const saved = this.saveUsers(users);
    if (saved) {
      return { success: true, message: 'Password reset successfully. Please login.' };
    } else {
      return { success: false, message: 'Error resetting password.' };
    }
  }
};

/* ── UI Field Validation Helpers ────────────────────────────── */

function showFieldError(inputEl, errorMsg) {
  if (!inputEl) return;
  
  // Mark input field as invalid
  inputEl.classList.add('invalid');
  
  // Check if error message element already exists
  let errorEl = inputEl.parentElement.querySelector('.form-error-msg');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'form-error-msg';
    inputEl.parentElement.appendChild(errorEl);
  }
  errorEl.innerHTML = `⚠️ ${errorMsg}`;
}

function clearFieldError(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove('invalid');
  const errorEl = inputEl.parentElement.querySelector('.form-error-msg');
  if (errorEl) {
    errorEl.remove();
  }
}

// Validates a field based on custom condition; shows error if condition fails. Returns validity boolean.
function validateField(inputEl, condition, errorMsg) {
  if (!inputEl) return false;
  if (!condition) {
    showFieldError(inputEl, errorMsg);
    return false;
  } else {
    clearFieldError(inputEl);
    return true;
  }
}

// Clear all validation errors from a container/form
function clearFormErrors(containerEl) {
  if (!containerEl) return;
  containerEl.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  containerEl.querySelectorAll('.form-error-msg').forEach(el => el.remove());
}

/* ── Button State Helper ────────────────────────────────────── */

function setButtonLoading(btnEl, isLoading) {
  if (!btnEl) return;
  if (isLoading) {
    btnEl.classList.add('btn-loading');
    btnEl.disabled = true;
  } else {
    btnEl.classList.remove('btn-loading');
    btnEl.disabled = false;
  }
}

/* ── Password Toggle Button Handler ─────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Bind password show/hide visibility toggles dynamically
  document.body.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.password-toggle-btn');
    if (!toggleBtn) return;
    
    // Find adjacent password input
    const inputEl = toggleBtn.parentElement.querySelector('input');
    if (!inputEl) return;
    
    if (inputEl.type === 'password') {
      inputEl.type = 'text';
      toggleBtn.textContent = '👁️';
      toggleBtn.setAttribute('title', 'Hide password');
      toggleBtn.setAttribute('aria-label', 'Hide password');
    } else {
      inputEl.type = 'password';
      toggleBtn.textContent = '👁️‍🗨️';
      toggleBtn.setAttribute('title', 'Show password');
      toggleBtn.setAttribute('aria-label', 'Show password');
    }
  });
});
