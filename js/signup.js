/* ============================================================
   Digital Diary — Signup JavaScript Logic (signup.js)
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const usernameInput = document.getElementById('signup-username');
  const nameInput = document.getElementById('signup-name');
  const passwordInput = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('signup-confirm-password');
  const questionSelect = document.getElementById('signup-question');
  const answerInput = document.getElementById('signup-answer');
  const submitBtn = document.getElementById('signup-submit-btn');

  if (!form) return;

  // Real-time Validation Triggers
  if (usernameInput) usernameInput.addEventListener('input', validateUsername);
  if (nameInput) nameInput.addEventListener('input', validateName);
  if (passwordInput) passwordInput.addEventListener('input', validatePassword);
  if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', validateConfirmPassword);
  if (questionSelect) questionSelect.addEventListener('change', validateQuestion);
  if (answerInput) answerInput.addEventListener('input', validateAnswer);

  /* ── Validation Rules ── */

  function validateUsername() {
    if (!usernameInput) return true;
    const value = usernameInput.value.trim();
    if (!value) {
      return validateField(usernameInput, false, 'Username is required.');
    }
    if (value.length < 3) {
      return validateField(usernameInput, false, 'Username must be at least 3 characters.');
    }
    if (value.length > 30) {
      return validateField(usernameInput, false, 'Username cannot exceed 30 characters.');
    }
    const validFormat = /^[a-zA-Z0-9_.]+$/.test(value);
    if (!validFormat) {
      return validateField(usernameInput, false, 'Only letters, numbers, dots, and underscores allowed.');
    }
    return validateField(usernameInput, true, '');
  }

  function validateName() {
    if (!nameInput) return true;
    const value = nameInput.value.trim();
    if (!value) {
      return validateField(nameInput, false, 'Full name is required.');
    }
    return validateField(nameInput, value.length >= 2, 'Full name must be at least 2 characters long.');
  }

  function validatePassword() {
    if (!passwordInput) return true;
    const value = passwordInput.value;
    if (!value) {
      return validateField(passwordInput, false, 'Password is required.');
    }
    return validateField(passwordInput, value.length >= 6, 'Password must be at least 6 characters long.');
  }

  function validateConfirmPassword() {
    if (!confirmPasswordInput || !passwordInput) return true;
    const value = confirmPasswordInput.value;
    const password = passwordInput.value;
    if (!value) {
      return validateField(confirmPasswordInput, false, 'Confirm password is required.');
    }
    return validateField(confirmPasswordInput, value === password, 'Passwords do not match.');
  }

  function validateQuestion() {
    if (!questionSelect) return true;
    const value = questionSelect.value;
    return validateField(questionSelect, value !== '', 'Please select a security question.');
  }

  function validateAnswer() {
    if (!answerInput) return true;
    const value = answerInput.value.trim();
    if (!value) {
      return validateField(answerInput, false, 'Security answer is required.');
    }
    return validateField(answerInput, value.length >= 2, 'Security answer must be at least 2 characters long.');
  }

  // Handle Signup Form Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Trigger validation for all fields
    const isUsernameValid = validateUsername();
    const isNameValid = validateName();
    const isPasswordValid = validatePassword();
    const isConfirmValid = validateConfirmPassword();
    const isQuestionValid = validateQuestion();
    const isAnswerValid = validateAnswer();

    // Prevent submission if any field is invalid
    if (!isUsernameValid || !isNameValid || !isPasswordValid || !isConfirmValid || !isQuestionValid || !isAnswerValid) {
      showToast('Please fill all required fields correctly.', 'error');
      
      // Focus on the first invalid field
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Set submit button to loading state
    setButtonLoading(submitBtn, true);

    // Prepare registration data
    const registrationData = {
      username: usernameInput.value.trim(),
      name: nameInput.value.trim(),
      password: passwordInput.value,
      securityQuestion: questionSelect.value,
      securityAnswer: answerInput.value.trim()
    };

    // Simulate standard network latency for premium UI transition
    setTimeout(() => {
      const result = AuthStorage.registerUser(registrationData);

      if (result.success) {
        showToast(result.message, 'success');
        // Redirect to Login page (index.html) after a brief delay
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        setButtonLoading(submitBtn, false);
        // Show validation/duplicate error
        showToast(result.message, 'error');
        if (result.message.toLowerCase().includes('username')) {
          showFieldError(usernameInput, result.message);
          usernameInput.focus();
        }
      }
    }, 800);
  });
});
