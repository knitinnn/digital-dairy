/* ============================================================
   Digital Diary — Login JavaScript Logic (login.js)
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const mobileInput = document.getElementById('login-mobile');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit-btn');

  if (!form) return;

  // Real-time validation
  mobileInput.addEventListener('input', validateMobileField);
  passwordInput.addEventListener('input', validatePasswordField);

  // Restrict mobile number key inputs to digits only
  mobileInput.addEventListener('keydown', (e) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
    if (allowedKeys.includes(e.key)) return;
    if (isNaN(Number(e.key)) || e.key === ' ') {
      e.preventDefault();
    }
  });

  /* ── Field Validators ── */

  function validateMobileField() {
    const value = mobileInput.value.trim();
    if (!value) {
      return validateField(mobileInput, false, 'Mobile number is required.');
    }
    const numbersOnly = /^\d+$/.test(value);
    if (!numbersOnly) {
      return validateField(mobileInput, false, 'Mobile number must contain numbers only.');
    }
    return validateField(mobileInput, value.length === 10, 'Mobile number must be exactly 10 digits.');
  }

  function validatePasswordField() {
    const value = passwordInput.value;
    return validateField(passwordInput, value !== '', 'Password is required.');
  }

  /* ── Handle Login Form Submit ── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Trigger validations
    const isMobileValid = validateMobileField();
    const isPasswordValid = validatePasswordField();

    if (!isMobileValid || !isPasswordValid) {
      showToast('Please fill all required fields.', 'error');
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    setButtonLoading(submitBtn, true);

    const mobile = mobileInput.value.trim();
    const password = passwordInput.value;

    // Simulate network delay for premium loader experience
    setTimeout(() => {
      const user = AuthStorage.findUserByMobile(mobile);

      if (!user) {
        setButtonLoading(submitBtn, false);
        showFieldError(mobileInput, 'Mobile number not registered.');
        showToast('Mobile number not registered.', 'error');
        mobileInput.focus();
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
