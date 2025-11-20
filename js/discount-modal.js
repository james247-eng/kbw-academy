// Discount Modal JavaScript
// File: discount-modal.js

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    DELAY_MINUTES: 3, // Show modal after 3 minutes
    COUNTDOWN_HOURS: 9, // 9-hour countdown
    STORAGE_KEYS: {
      PAGE_LOAD_TIME: 'modalPageLoadTime',
      COUNTDOWN_START: 'modalCountdownStart',
      MODAL_CLOSED: 'modalClosedThisSession'
    }
  };

  // Convert minutes/hours to milliseconds
  const DELAY_MS = CONFIG.DELAY_MINUTES * 60 * 1000;
  const COUNTDOWN_DURATION_MS = CONFIG.COUNTDOWN_HOURS * 60 * 60 * 1000;

  // DOM Elements
  let modal, closeBtn, claimBtn;

  // Initialize modal
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  }

  function setup() {
    // Get DOM elements
    modal = document.getElementById('discountModal');
    closeBtn = document.getElementById('closeModal');
    claimBtn = document.getElementById('claimOffer');

    if (!modal) {
      console.warn('Discount modal element not found');
      return;
    }

    // Set page load time if not set
    if (!sessionStorage.getItem(CONFIG.STORAGE_KEYS.PAGE_LOAD_TIME)) {
      sessionStorage.setItem(CONFIG.STORAGE_KEYS.PAGE_LOAD_TIME, Date.now().toString());
    }

    // Initialize countdown start time if not set
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.COUNTDOWN_START)) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.COUNTDOWN_START, Date.now().toString());
    }

    // Check if modal should be shown
    scheduleModalDisplay();

    // Event listeners
    closeBtn?.addEventListener('click', closeModal);
    claimBtn?.addEventListener('click', handleClaim);
    
    // Close on overlay click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  function scheduleModalDisplay() {
    const pageLoadTime = parseInt(sessionStorage.getItem(CONFIG.STORAGE_KEYS.PAGE_LOAD_TIME));
    const modalClosed = sessionStorage.getItem(CONFIG.STORAGE_KEYS.MODAL_CLOSED);
    const currentTime = Date.now();
    const timeElapsed = currentTime - pageLoadTime;

    // Don't show if already closed this session
    if (modalClosed === 'true') {
      return;
    }

    // Calculate remaining delay
    const remainingDelay = DELAY_MS - timeElapsed;

    if (remainingDelay <= 0) {
      // Show immediately if delay has passed
      showModal();
    } else {
      // Schedule modal to show after remaining delay
      setTimeout(showModal, remainingDelay);
    }
  }

  function showModal() {
    // Don't show if already closed this session
    if (sessionStorage.getItem(CONFIG.STORAGE_KEYS.MODAL_CLOSED) === 'true') {
      return;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    startCountdown();
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    sessionStorage.setItem(CONFIG.STORAGE_KEYS.MODAL_CLOSED, 'true');
  }

  function handleClaim() {
    // Track conversion (you can add analytics here)
    console.log('User claimed the offer');
    closeModal();
  }

  function startCountdown() {
    updateCountdown(); // Update immediately
    
    // Update every second
    const countdownInterval = setInterval(function() {
      if (!modal.classList.contains('active')) {
        clearInterval(countdownInterval);
        return;
      }
      updateCountdown();
    }, 1000);
  }

  function updateCountdown() {
    const countdownStart = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.COUNTDOWN_START));
    const currentTime = Date.now();
    const elapsed = currentTime - countdownStart;

    // Check if countdown should reset (9 hours passed)
    if (elapsed >= COUNTDOWN_DURATION_MS) {
      // Reset countdown
      localStorage.setItem(CONFIG.STORAGE_KEYS.COUNTDOWN_START, currentTime.toString());
      // Allow modal to show again
      sessionStorage.removeItem(CONFIG.STORAGE_KEYS.MODAL_CLOSED);
      updateCountdown();
      return;
    }

    // Calculate remaining time
    const remaining = COUNTDOWN_DURATION_MS - elapsed;
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    // Update DOM
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (hoursEl) hoursEl.textContent = padZero(hours);
    if (minutesEl) minutesEl.textContent = padZero(minutes);
    if (secondsEl) secondsEl.textContent = padZero(seconds);
  }

  function padZero(num) {
    return num.toString().padStart(2, '0');
  }

  // Auto-initialize
  init();

})();