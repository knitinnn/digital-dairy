/* ============================================================
   Digital Diary — Forgot Password Logic (forgot-password.js)
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Wizard elements
  const wizardDesc = document.getElementById('forgot-wizard-desc');
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const step3 = document.getElementById('step-3');

  // Form Step 1
  const formStep1 = document.getElementById('form-step-1');
  const mobileInput = document.getElementById('reset-mobile');
  const btnStep1 = document.getElementById('btn-step-1');

  // Form Step 2
  const formStep2 = document.getElementById('form-step-2');
  const questionDisplay = document.getElementById('question-display');
  const answerInput = document.getElementById('reset-answer');
  const btnStep2 = document.getElementById('btn-step-2');

  // Form Step 3
  const formStep3 = document.getElementById('form-step-3');
  const passwordInput = document.getElementById('reset-password');
  const confirmPasswordInput = document.getElementById('reset-confirm-password');
  const btnStep3 = document.getElementById('btn-step-3');

  // State variables
  let verifiedMobile = '';
  let matchedUser = null;

  // Real-time validators for step inputs
  mobileInput.addEventListener('input', validateMobileField);
  answerInput.addEventListener('input', validateAnswerField);
  passwordInput.addEventListener('input', validateNewPasswordField);
  confirmPasswordInput.addEventListener('input', validateConfirmNewPasswordField);

  // Prevent non-numeric entries in mobile field
  mobileInput.addEventListener('keydown', (e) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
    if (allowedKeys.includes(e.key)) return;
    if (isNaN(Number(e.key)) || e.key === ' ') {
      e.preventDefault();
    }
  });

  /* ── Validation Checks ── */

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

  function validateAnswerField() {
    const value = answerInput.value.trim();
    if (!value) {
      return validateField(answerInput, false, 'Security answer is required.');
    }
    return validateField(answerInput, value.length >= 2, 'Security answer must be at least 2 characters long.');
  }

  function validateNewPasswordField() {
    const value = passwordInput.value;
    if (!value) {
      return validateField(passwordInput, false, 'New password is required.');
    }
    return validateField(passwordInput, value.length >= 6, 'Password must be at least 6 characters long.');
  }

  function validateConfirmNewPasswordField() {
    const value = confirmPasswordInput.value;
    const newPassword = passwordInput.value;
    if (!value) {
      return validateField(confirmPasswordInput, false, 'Confirm password is required.');
    }
    return validateField(confirmPasswordInput, value === newPassword, 'Passwords do not match.');
  }

  // Helper function to handle step transitions smoothly
  function transitionToStep(fromStepEl, toStepEl, descText) {
    // Fade out
    fromStepEl.style.opacity = '0';
    setTimeout(() => {
      fromStepEl.classList.remove('active');
      toStepEl.classList.add('active');
      toStepEl.style.opacity = '0';
      
      // Update header description
      if (wizardDesc) wizardDesc.textContent = descText;
      
      // Fade in next step
      setTimeout(() => {
        toStepEl.style.opacity = '1';
        // Auto-focus first input in the new step
        const input = toStepEl.querySelector('input, select');
        if (input) input.focus();
      }, 50);
    }, 250);
  }

  /* ── STEP 1: Find Account ── */
  formStep1.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateMobileField()) {
      mobileInput.focus();
      return;
    }

    setButtonLoading(btnStep1, true);
    const mobileValue = mobileInput.value.trim();

    setTimeout(() => {
      const user = AuthStorage.findUserByMobile(mobileValue);
      setButtonLoading(btnStep1, false);

      if (user) {
        // Save mobile and user in current session state
        verifiedMobile = mobileValue;
        matchedUser = user;

        // Populate question and navigate to Step 2
        questionDisplay.textContent = user.securityQuestion;
        clearFormErrors(step2);
        
        transitionToStep(
          step1, 
          step2, 
          'Answer the security question to verify your identity.'
        );
      } else {
        showFieldError(mobileInput, 'Mobile number not registered.');
        showToast('Mobile number not registered.', 'error');
        mobileInput.focus();
      }
    }, 600);
  });

  /* ── STEP 2: Verify Answer ── */
  formStep2.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateAnswerField()) {
      answerInput.focus();
      return;
    }

    setButtonLoading(btnStep2, true);
    const answerValue = answerInput.value.trim().toLowerCase();
    const correctAnswer = matchedUser.securityAnswer.trim().toLowerCase();

    setTimeout(() => {
      setButtonLoading(btnStep2, false);

      if (answerValue === correctAnswer) {
        clearFormErrors(step3);
        transitionToStep(
          step2,
          step3,
          'Create a new password for your account.'
        );
      } else {
        showFieldError(answerInput, 'Incorrect security answer.');
        showToast('Incorrect security answer.', 'error');
        answerInput.focus();
      }
    }, 600);
  });

  /* ── STEP 3: Reset Password ── */
  formStep3.addEventListener('submit', (e) => {
    e.preventDefault();

    const isPasswordValid = validateNewPasswordField();
    const isConfirmValid = validateConfirmNewPasswordField();

    if (!isPasswordValid || !isConfirmValid) {
      const firstInvalid = formStep3.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    setButtonLoading(btnStep3, true);
    const newPassword = passwordInput.value;

    setTimeout(() => {
      const result = AuthStorage.resetPassword(verifiedMobile, newPassword);
      setButtonLoading(btnStep3, false);

      if (result.success) {
        showToast(result.message, 'success');
        // Redirect back to Login page
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        showToast(result.message, 'error');
      }
    }, 800);
  });
});
