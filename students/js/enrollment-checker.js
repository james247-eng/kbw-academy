// ====================================================================
// ENROLLMENT CHECKER - Checks for pending enrollments on dashboard
// Add this script to student dashboard page
// ====================================================================

/**
 * Check for pending enrollment when dashboard loads
 */
export async function checkPendingEnrollment() {
  console.log('🔍 Checking for pending enrollments...');

  // Get pending enrollment from localStorage
  const pendingData = localStorage.getItem('pendingEnrollment');

  if (!pendingData) {
    console.log('✅ No pending enrollments');
    return;
  }

  try {
    const enrollment = JSON.parse(pendingData);
    console.log('📋 Found pending enrollment:', enrollment);

    // Validate enrollment data
    if (!enrollment.courseId) {
      console.error('❌ Invalid enrollment data');
      localStorage.removeItem('pendingEnrollment');
      return;
    }

    // Check if enrollment is too old (older than 1 hour)
    const hourInMs = 60 * 60 * 1000;
    const isExpired = (Date.now() - enrollment.timestamp) > hourInMs;

    if (isExpired) {
      console.warn('⚠️ Enrollment expired (older than 1 hour)');
      localStorage.removeItem('pendingEnrollment');
      showExpiredEnrollmentModal(enrollment);
      return;
    }

    // Show completion modal and trigger payment
    showEnrollmentCompletionModal(enrollment);

  } catch (error) {
    console.error('❌ Error processing pending enrollment:', error);
    localStorage.removeItem('pendingEnrollment');
  }
}

/**
 * Show modal and complete enrollment
 */
function showEnrollmentCompletionModal(enrollment) {
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'enrollment-completion-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    animation: fadeIn 0.3s ease;
  `;

  modal.innerHTML = `
    <div style="background:white; padding:40px; border-radius:20px; max-width:450px; width:90%; text-align:center; animation:slideUp 0.4s ease;">
      <div style="width:80px; height:80px; margin:0 auto 20px; background:linear-gradient(135deg, #14b8a6, #0f766e); border-radius:50%; display:flex; align-items:center; justify-content:center;">
        <ion-icon name="school" style="font-size:3rem; color:white;"></ion-icon>
      </div>
      
      <h2 style="color:#1a1f36; margin-bottom:15px; font-size:1.8rem;">
        Completing Your Enrollment
      </h2>
      
      <p style="color:#6b7280; margin-bottom:10px; font-size:1.1rem;">
        ${enrollment.courseTitle}
      </p>
      
      <p style="color:#9ca3af; margin-bottom:30px; font-size:0.9rem;">
        Redirecting you to payment...
      </p>
      
      <div style="display:flex; justify-content:center; gap:8px;">
        <span class="dot" style="width:8px; height:8px; background:#14b8a6; border-radius:50%; animation:bounce 1.4s infinite ease-in-out;"></span>
        <span class="dot" style="width:8px; height:8px; background:#14b8a6; border-radius:50%; animation:bounce 1.4s infinite ease-in-out 0.16s;"></span>
        <span class="dot" style="width:8px; height:8px; background:#14b8a6; border-radius:50%; animation:bounce 1.4s infinite ease-in-out 0.32s;"></span>
      </div>
    </div>
  `;

  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Add modal to page
  document.body.appendChild(modal);

  // Wait 2 seconds, then trigger payment
  setTimeout(() => {
    completeEnrollment(enrollment.courseId);
  }, 2000);
}

/**
 * Trigger payment and clear localStorage
 */
function completeEnrollment(courseId) {
  console.log('💳 Triggering payment for:', courseId);

  // Clear pending enrollment
  localStorage.removeItem('pendingEnrollment');
  console.log('✅ Cleared pending enrollment from localStorage');

  // Trigger payment
  if (typeof window.startPurchase === 'function') {
    window.startPurchase(courseId);
  } else {
    console.error('❌ startPurchase function not found');
    // Fallback: redirect to course page
    window.location.href = `/all-courses.html?autoBuy=${courseId}`;
  }
}

/**
 * Show expired enrollment modal
 */
function showExpiredEnrollmentModal(enrollment) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  `;

  modal.innerHTML = `
    <div style="background:white; padding:40px; border-radius:20px; max-width:450px; width:90%; text-align:center;">
      <ion-icon name="time-outline" style="font-size:4rem; color:#f59e0b; margin-bottom:20px;"></ion-icon>
      
      <h2 style="color:#1a1f36; margin-bottom:15px;">
        Enrollment Session Expired
      </h2>
      
      <p style="color:#6b7280; margin-bottom:30px;">
        Your enrollment for "${enrollment.courseTitle}" has expired. Would you like to continue?
      </p>
      
      <button onclick="window.location.href='${enrollment.returnUrl || '/all-courses.html'}'" style="padding:14px 30px; background:#14b8a6; color:white; border:none; border-radius:8px; font-size:1rem; font-weight:600; cursor:pointer; margin-right:10px;">
        Yes, Continue
      </button>
      
      <button onclick="this.closest('div').parentElement.remove()" style="padding:14px 30px; background:#e5e7eb; color:#374151; border:none; border-radius:8px; font-size:1rem; font-weight:600; cursor:pointer;">
        Cancel
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

/**
 * Manual function to clear pending enrollment (for testing)
 */
window.clearPendingEnrollment = function() {
  localStorage.removeItem('pendingEnrollment');
  console.log('🧹 Manually cleared pending enrollment');
};

/**
 * Auto-check on page load
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkPendingEnrollment);
} else {
  checkPendingEnrollment();
}

console.log('✅ Enrollment checker loaded');