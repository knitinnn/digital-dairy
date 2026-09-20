/* ============================================================
   Digital Diary — Login JavaScript Logic (login.js)
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit-btn');

  if (!form) return;

  // Real-time validation
  if (usernameInput) usernameInput.addEventListener('input', validateUsernameField);
  if (passwordInput) passwordInput.addEventListener('input', validatePasswordField);

  /* ── Field Validators ── */

  function validateUsernameField() {
    if (!usernameInput) return true;
    const value = usernameInput.value.trim();
    if (!value) {
      return validateField(usernameInput, false, 'Username is required.');
    }
    return validateField(usernameInput, true, '');
  }

  function validatePasswordField() {
    if (!passwordInput) return true;
    const value = passwordInput.value;
    return validateField(passwordInput, value !== '', 'Password is required.');
  }

  /* ── Handle Login Form Submit ── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Trigger validations
    const isUsernameValid = validateUsernameField();
    const isPasswordValid = validatePasswordField();

    if (!isUsernameValid || !isPasswordValid) {
      showToast('Please fill all required fields.', 'error');
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    setButtonLoading(submitBtn, true);

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Simulate network delay for premium loader experience
    setTimeout(() => {
      const user = AuthStorage.findUserByUsername(username);

      if (!user) {
        setButtonLoading(submitBtn, false);
        showFieldError(usernameInput, 'Username not registered.');
        showToast('Username not registered.', 'error');
        usernameInput.focus();
        return;
      }

      if (user.password !== password) {
        setButtonLoading(submitBtn, false);
        showFieldError(passwordInput, 'Incorrect password.');
        showToast('Incorrect password.', 'error');
        passwordInput.focus();
        return;
      }

      // Successful Login
      AuthStorage.setCurrentUser(user);
      showToast(`Welcome back, ${user.name}! 🌸`, 'success');

      // Redirect to dashboard after success message
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    }, 800);
  });
});
