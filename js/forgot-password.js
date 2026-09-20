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
  const usernameInput = document.getElementById('reset-username');
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
  let verifiedIdentifier = '';
  let matchedUser = null;

  // Real-time validators for step inputs
  if (usernameInput) usernameInput.addEventListener('input', validateUsernameField);
  if (answerInput) answerInput.addEventListener('input', validateAnswerField);
  if (passwordInput) passwordInput.addEventListener('input', validateNewPasswordField);
  if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', validateConfirmNewPasswordField);

  /* ── Validation Checks ── */

  function validateUsernameField() {
    if (!usernameInput) return true;
    const value = usernameInput.value.trim();
    if (!value) {
      return validateField(usernameInput, false, 'Username is required.');
    }
    return validateField(usernameInput, true, '');
  }

  function validateAnswerField() {
    if (!answerInput) return true;
    const value = answerInput.value.trim();
    if (!value) {
      return validateField(answerInput, false, 'Security answer is required.');
    }
    return validateField(answerInput, value.length >= 2, 'Security answer must be at least 2 characters long.');
  }

  function validateNewPasswordField() {
    if (!passwordInput) return true;
    const value = passwordInput.value;
    if (!value) {
      return validateField(passwordInput, false, 'New password is required.');
    }
    return validateField(passwordInput, value.length >= 6, 'Password must be at least 6 characters long.');
  }

  function validateConfirmNewPasswordField() {
    if (!confirmPasswordInput || !passwordInput) return true;
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
  if (formStep1) {
    formStep1.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateUsernameField()) {
        usernameInput.focus();
        return;
      }

      setButtonLoading(btnStep1, true);
      const usernameVal = usernameInput.value.trim();

      setTimeout(() => {
        const user = AuthStorage.findUserByUsername(usernameVal);
        setButtonLoading(btnStep1, false);

        if (user) {
          // Save identifier and user in current session state
          verifiedIdentifier = user.username || usernameVal;
          matchedUser = user;

          // Populate question and navigate to Step 2
          questionDisplay.textContent = user.securityQuestion || "What is your secret key?";
          clearFormErrors(step2);
          
          transitionToStep(
            step1, 
            step2, 
            'Answer the security question to verify your identity.'
          );
        } else {
          showFieldError(usernameInput, 'Username not registered.');
          showToast('Username not registered.', 'error');
          usernameInput.focus();
        }
      }, 600);
    });
  }

  /* ── STEP 2: Verify Answer ── */
  if (formStep2) {
    formStep2.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateAnswerField()) {
        answerInput.focus();
        return;
      }

      setButtonLoading(btnStep2, true);
      const answerValue = answerInput.value.trim().toLowerCase();
      const correctAnswer = (matchedUser.securityAnswer || '').trim().toLowerCase();

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
  }

  /* ── STEP 3: Reset Password ── */
  if (formStep3) {
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
        const result = AuthStorage.resetPassword(verifiedIdentifier, newPassword);
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
  }
});
