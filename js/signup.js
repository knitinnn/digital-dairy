/* ============================================================
   Digital Diary — Signup JavaScript Logic (signup.js)
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const nameInput = document.getElementById('signup-name');
  const mobileInput = document.getElementById('signup-mobile');
  const passwordInput = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('signup-confirm-password');
  const questionSelect = document.getElementById('signup-question');
  const answerInput = document.getElementById('signup-answer');
  const submitBtn = document.getElementById('signup-submit-btn');

  if (!form) return;

  // Real-time Validation Triggers
  nameInput.addEventListener('input', validateName);
  mobileInput.addEventListener('input', validateMobileInput);
  passwordInput.addEventListener('input', validatePassword);
  confirmPasswordInput.addEventListener('input', validateConfirmPassword);
  questionSelect.addEventListener('change', validateQuestion);
  answerInput.addEventListener('input', validateAnswer);

  // Allow only digits in mobile number field
  mobileInput.addEventListener('keydown', (e) => {
    // Allow special keys (Backspace, Delete, Arrow keys, Tab, Enter)
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
    if (allowedKeys.includes(e.key)) return;
    
    // Prevent non-numeric key presses
    if (isNaN(Number(e.key)) || e.key === ' ') {
      e.preventDefault();
    }
  });

  /* ── Validation Rules ── */

  function validateName() {
    const value = nameInput.value.trim();
    if (!value) {
      return validateField(nameInput, false, 'Full name is required.');
    }
    return validateField(nameInput, value.length >= 3, 'Full name must be at least 3 characters long.');
  }

  function validateMobileInput() {
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

  function validatePassword() {
    const value = passwordInput.value;
    if (!value) {
      return validateField(passwordInput, false, 'Password is required.');
    }
    return validateField(passwordInput, value.length >= 6, 'Password must be at least 6 characters long.');
  }

  function validateConfirmPassword() {
    const value = confirmPasswordInput.value;
    const password = passwordInput.value;
    if (!value) {
      return validateField(confirmPasswordInput, false, 'Confirm password is required.');
    }
    return validateField(confirmPasswordInput, value === password, 'Passwords do not match.');
  }

  function validateQuestion() {
    const value = questionSelect.value;
    return validateField(questionSelect, value !== '', 'Please select a security question.');
  }

  function validateAnswer() {
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
    const isNameValid = validateName();
    const isMobileValid = validateMobileInput();
    const isPasswordValid = validatePassword();
    const isConfirmValid = validateConfirmPassword();
    const isQuestionValid = validateQuestion();
    const isAnswerValid = validateAnswer();

    // Prevent submission if any field is invalid
    if (!isNameValid || !isMobileValid || !isPasswordValid || !isConfirmValid || !isQuestionValid || !isAnswerValid) {
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
      name: nameInput.value.trim(),
      mobile: mobileInput.value.trim(),
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
        if (result.message.includes('registered')) {
          showFieldError(mobileInput, 'Mobile number is already registered.');
          mobileInput.focus();
        }
      }
    }, 800);
  });
});
