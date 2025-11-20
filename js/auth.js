
  /*
  
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
  import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

  import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { showToast, showLoading } from './toast-notification.js';


  // TODO: Add SDKs for Firebase products that you want to use

  // https://firebase.google.com/docs/web/setup#available-libraries


  // Your web app's Firebase configuration

  // For Firebase JS SDK v7.20.0 and later, measurementId is optional

  const firebaseConfig = {

    apiKey: "AIzaSyBBA8KVzbxoomwAm83erzk_JPxq37H27j0",

    authDomain: "key-board-wizards.firebaseapp.com",

    projectId: "key-board-wizards",

    storageBucket: "key-board-wizards.firebasestorage.app",

    messagingSenderId: "570989716323",

    appId: "1:570989716323:web:adb3d3ae753a91458f2956",

    measurementId: "G-E13DTS3XDB"

  };


  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);



// Signup handler (signup.html uses form id 'signup-form')
/*======================================================*/
/*
const signupForm = document.getElementById('signup-form');
const signupBtn = document.getElementById('signup-btn');

if (signupForm && signupBtn) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const course = document.getElementById('course-selection').value || '';
    const alert_container = document.getElementById('signup-result');
    
    // validate form values
    if (!firstName || !lastName || !email || !password || !phone) {
      alert_container.textContent = 'Please fill in all required fields.';
      return;
    }

    //  ============================= MY EDITS =============================  
    // Show loading
    const originalText = signupBtn.textContent;
    signupBtn.disabled = true;
    signupBtn.textContent = 'Creating account...';
    const dismissLoading = showLoading('Creating your account...');
    //  ============================= MY EDITS =============================  

    // create user account
    //  ============================= MY EDITS =============================  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        firstName,
        lastName,
        email,
        phone,
        preferredCourse: course,
        enrolledCourses: [],
        role: 'student',
        createdAt: new Date().toISOString()
      };


      try {
        const writeResult = await setDoc(doc(db, 'user', user.uid), userData);
        console.log('User profile written for', user.uid, writeResult);
      } catch (fireErr) {
        console.error('Failed to write user doc after auth created:', fireErr);
        // Try to clean up created auth user to avoid orphaned accounts
        try {
          await user.delete();
        } catch (delErr) {
          console.error('Failed to delete auth user after Firestore failure:', delErr);
        }
        const msg = 'Signup failed: could not write user data. Check Firestore rules/permissions.';
        if (alert_container) alert_container.textContent = msg; else alert(msg);
        return;
      }

//  ============================= MY EDITS =============================
// Dismiss loading
      dismissLoading();

      // Show success
      showToast('Account created successfully! Redirecting...', 'success');
//  ============================= MY EDITS =============================


      // Save user ID in localStorage for session persistence
  localStorage.setItem('user', JSON.stringify(user.uid));
  // redirect to next if present
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  const redirectUrl = next ? '/all-courses.html?autoBuy=' + encodeURIComponent(next) : '/students/dashboard.html';
  // ensure user sees success message briefly
  // const successMsg = 'Signup successful. Redirecting...'
  // if (alert_container) alert_container.textContent = successMsg; else return;
  setTimeout(() => { window.location.href = redirectUrl; }, 700);

    } catch (error) {

      //  ============================= MY EDITS =============================
       // Dismiss loading
      dismissLoading();

      // Reset button
      signupBtn.disabled = false;
      signupBtn.textContent = originalText; 
      // ================== MY EDITS =============================
      console.error('Signup error', error);
      // Better messaging for common cases
      if (error.code === 'auth/email-already-in-use') {
        if (alert_container) alert_container.textContent = 'That email address is already in use. Please log in.';
      } else if (error.code === 'auth/invalid-email') {
        if (alert_container) alert_container.textContent = 'Invalid email address.';
      } else {
        if (alert_container) alert_container.textContent = 'Signup failed: ' + (error.message || error);
      }
    }
  });
}
 
// Login handler (login.html uses form id 'login-form')

const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
  
if (loginForm && loginBtn) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const log_in_email = document.getElementById('log-in-email').value.trim();
    const log_in_password = document.getElementById('log-in-password').value.trim();
    const alert_container = document.getElementById('login-result');

    if (!log_in_email || !log_in_password) {
      if (alert_container) alert_container.textContent = 'Please fill in your credentials.';
      return;
    }
//  ============================= MY EDITS =============================
    // Show loading
    const originalText = loginBtn.textContent;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    const dismissLoading = showLoading('Logging you in...');
//  ============================= MY EDITS =============================
    try {
      const userCredential = await signInWithEmailAndPassword(auth, log_in_email, log_in_password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDocRef = doc(db, 'user', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        console.error('User document not found in Firestore');
        if (alert_container) alert_container.textContent = 'User profile not found. Please contact support.';
         //============================= MY EDITS ============================= 
        // Dismiss loading
      dismissLoading();
      //============================= MY EDITS =============================

      // Reset button
      loginBtn.disabled = false;
      loginBtn.textContent = originalText;
      //============================= MY EDITS =============================

      return;
      }

      const userData = userDocSnap.data();
      const userRole = userData.role;

      // Check for next parameter
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');

      // Role-based redirect
      if (next) {
        window.location.href = '/all-courses.html?autoBuy=' + encodeURIComponent(next);
      } else {
        if (userRole === 'admin') {
          window.location.href = '/tech wizzards admin dashboard/dashboard.html';
        } else if (userRole === 'student') {
          window.location.href = '/students/dashboard.html';
        } else {
          // Fallback for unknown roles
          console.warn('Unknown user role:', userRole);
          window.location.href = '/students/dashboard.html';
        }
      }
    } catch (error) {
      // Dismiss loading
      dismissLoading();

      // Reset button
      loginBtn.disabled = false;
      loginBtn.textContent = originalText;


       console.error('Login error', error);
      // if (alert_container) alert_container.textContent = 'Login failed: ' + error.message;
      showToast(error.message, 'error');
    }
  });
}
// ====================================================================
// TOAST NOTIFICATION SYSTEM (toast-notification.js)
// ====================================================================*/

/*

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { showToast, showLoading } from './toast-notification.js';
import { showEnrollmentSuccessModal } from './enrollment-success-modal.js'; // ⭐ NEW IMPORT

const firebaseConfig = {
  apiKey: "AIzaSyBBA8KVzbxoomwAm83erzk_JPxq37H27j0",
  authDomain: "key-board-wizards.firebaseapp.com",
  projectId: "key-board-wizards",
  storageBucket: "key-board-wizards.firebasestorage.app",
  messagingSenderId: "570989716323",
  appId: "1:570989716323:web:adb3d3ae753a91458f2956",
  measurementId: "G-E13DTS3XDB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// ====================================================================
// SIGNUP HANDLER
// ====================================================================
const signupForm = document.getElementById('signup-form');
const signupBtn = document.getElementById('signup-btn');

if (signupForm && signupBtn) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const course = document.getElementById('course-selection').value || '';
    const alert_container = document.getElementById('signup-result');
    
    // Validate form values
    if (!firstName || !lastName || !email || !password || !phone) {
      alert_container.textContent = 'Please fill in all required fields.';
      return;
    }

    // Show loading
    const originalText = signupBtn.textContent;
    signupBtn.disabled = true;
    signupBtn.textContent = 'Creating account...';
    const dismissLoading = showLoading('Creating your account...');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        firstName,
        lastName,
        email,
        phone,
        preferredCourse: course,
        enrolledCourses: [],
        role: 'student',
        createdAt: new Date().toISOString()
      };

      try {
        const writeResult = await setDoc(doc(db, 'user', user.uid), userData);
        console.log('✅ User profile written for', user.uid);
      } catch (fireErr) {
        console.error('❌ Failed to write user doc after auth created:', fireErr);
        // Try to clean up created auth user to avoid orphaned accounts
        try {
          await user.delete();
        } catch (delErr) {
          console.error('Failed to delete auth user after Firestore failure:', delErr);
        }
        dismissLoading();
        signupBtn.disabled = false;
        signupBtn.textContent = originalText;
        const msg = 'Signup failed: could not write user data. Check Firestore rules/permissions.';
        if (alert_container) alert_container.textContent = msg; else alert(msg);
        return;
      }

      // Dismiss loading
      dismissLoading();

      // ⭐ CHECK IF THIS IS AN ENROLLMENT FLOW
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');

      if (next) {
        // 🎉 Show enrollment success modal, then redirect to checkout
        console.log('🚀 Enrollment flow detected, showing modal...');
        showEnrollmentSuccessModal(() => {
          window.location.href = '/all-courses.html?autoBuy=' + encodeURIComponent(next);
        }, 'signup');
      } else {
        // Normal signup flow - go to dashboard
        console.log('📚 Normal signup, redirecting to dashboard...');
        showToast('Account created successfully! Redirecting...', 'success');
        setTimeout(() => { 
          window.location.href = '/students/dashboard.html'; 
        }, 700);
      }

    } catch (error) {
      // Dismiss loading
      dismissLoading();

      // Reset button
      signupBtn.disabled = false;
      signupBtn.textContent = originalText;

      console.error('Signup error', error);
      
      // Better messaging for common cases
      if (error.code === 'auth/email-already-in-use') {
        if (alert_container) alert_container.textContent = 'That email address is already in use. Please log in.';
        showToast('Email already in use. Please login instead.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        if (alert_container) alert_container.textContent = 'Invalid email address.';
        showToast('Invalid email address', 'error');
      } else if (error.code === 'auth/weak-password') {
        if (alert_container) alert_container.textContent = 'Password should be at least 6 characters.';
        showToast('Password too weak', 'error');
      } else {
        if (alert_container) alert_container.textContent = 'Signup failed: ' + (error.message || error);
        showToast('Signup failed: ' + error.message, 'error');
      }
    }
  });
}

// ====================================================================
// LOGIN HANDLER
// ====================================================================
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
  
if (loginForm && loginBtn) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const log_in_email = document.getElementById('log-in-email').value.trim();
    const log_in_password = document.getElementById('log-in-password').value.trim();
    const alert_container = document.getElementById('login-result');

    if (!log_in_email || !log_in_password) {
      if (alert_container) alert_container.textContent = 'Please fill in your credentials.';
      return;
    }

    // Show loading
    const originalText = loginBtn.textContent;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    const dismissLoading = showLoading('Logging you in...');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, log_in_email, log_in_password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDocRef = doc(db, 'user', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        console.error('User document not found in Firestore');
        if (alert_container) alert_container.textContent = 'User profile not found. Please contact support.';
        
        // Dismiss loading
        dismissLoading();
        
        // Reset button
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
        return;
      }

      const userData = userDocSnap.data();
      const userRole = userData.role;

      // Dismiss loading
      dismissLoading();

      // ⭐ CHECK IF THIS IS AN ENROLLMENT FLOW
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');

      if (next) {
        // 🎉 Show enrollment success modal, then redirect to checkout
        console.log('🚀 Enrollment flow detected for returning user...');
        showEnrollmentSuccessModal(() => {
          window.location.href = '/all-courses.html?autoBuy=' + encodeURIComponent(next);
        }, 'login');
      } else {
        // Normal login - role-based redirect
        showToast('Login successful!', 'success');
        
        setTimeout(() => {
          if (userRole === 'admin') {
            window.location.href = '/tech wizzards admin dashboard/dashboard.html';
          } else if (userRole === 'student') {
            window.location.href = '/students/dashboard.html';
          } else {
            console.warn('Unknown user role:', userRole);
            window.location.href = '/students/dashboard.html';
          }
        }, 500);
      }

    } catch (error) {
      // Dismiss loading
      dismissLoading();

      // Reset button
      loginBtn.disabled = false;
      loginBtn.textContent = originalText;

      console.error('Login error', error);
      
      // Better error messages
      if (error.code === 'auth/wrong-password') {
        showToast('Incorrect password. Please try again.', 'error');
      } else if (error.code === 'auth/user-not-found') {
        showToast('No account found with this email.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        showToast('Invalid email address.', 'error');
      } else if (error.code === 'auth/too-many-requests') {
        showToast('Too many failed attempts. Please try again later.', 'error');
      } else {
        showToast(error.message, 'error');
      }
    }
  });
}

console.log('✅ Auth system loaded with enrollment flow support');
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { showToast, showLoading } from './toast-notification.js';

const firebaseConfig = {
  apiKey: "AIzaSyBBA8KVzbxoomwAm83erzk_JPxq37H27j0",
  authDomain: "key-board-wizards.firebaseapp.com",
  projectId: "key-board-wizards",
  storageBucket: "key-board-wizards.firebasestorage.app",
  messagingSenderId: "570989716323",
  appId: "1:570989716323:web:adb3d3ae753a91458f2956",
  measurementId: "G-E13DTS3XDB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// ====================================================================
// SIGNUP HANDLER
// ====================================================================
const signupForm = document.getElementById('signup-form');
const signupBtn = document.getElementById('signup-btn');

if (signupForm && signupBtn) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const course = document.getElementById('course-selection').value || '';
    const alert_container = document.getElementById('signup-result');
    
    // Validate form values
    if (!firstName || !lastName || !email || !password || !phone) {
      if (alert_container) alert_container.textContent = 'Please fill in all required fields.';
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Show loading
    const originalText = signupBtn.textContent;
    signupBtn.disabled = true;
    signupBtn.textContent = 'Creating account...';
    const dismissLoading = showLoading('Creating your account...');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        firstName,
        lastName,
        email,
        phone,
        preferredCourse: course,
        enrolledCourses: [],
        role: 'student',
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'user', user.uid), userData);
        console.log('✅ User profile created:', user.uid);
      } catch (fireErr) {
        console.error('❌ Failed to write user doc:', fireErr);
        
        // Try to clean up auth user
        try {
          await user.delete();
        } catch (delErr) {
          console.error('Failed to delete auth user:', delErr);
        }
        
        dismissLoading();
        signupBtn.disabled = false;
        signupBtn.textContent = originalText;
        
        const msg = 'Signup failed: Could not create user profile.';
        if (alert_container) alert_container.textContent = msg;
        showToast(msg, 'error');
        return;
      }

      // Dismiss loading
      dismissLoading();

      // ⭐ SIMPLE: ALWAYS GO TO DASHBOARD
      // The dashboard will check localStorage for pending enrollment
      console.log('✅ Account created successfully, redirecting to dashboard...');
      showToast('Account created successfully! Redirecting...', 'success');
      
      setTimeout(() => { 
        window.location.href = '/students/dashboard.html'; 
      }, 1000);

    } catch (error) {
      // Dismiss loading
      dismissLoading();

      // Reset button
      signupBtn.disabled = false;
      signupBtn.textContent = originalText;

      console.error('Signup error:', error);
      
      // Better error messages
      let errorMsg = 'Signup failed: ' + error.message;
      
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'That email is already in use. Please login instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'Password should be at least 6 characters.';
      }
      
      if (alert_container) alert_container.textContent = errorMsg;
      showToast(errorMsg, 'error');
    }
  });
}

// ====================================================================
// LOGIN HANDLER
// ====================================================================
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
  
if (loginForm && loginBtn) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const log_in_email = document.getElementById('log-in-email').value.trim();
    const log_in_password = document.getElementById('log-in-password').value.trim();
    const alert_container = document.getElementById('login-result');

    if (!log_in_email || !log_in_password) {
      if (alert_container) alert_container.textContent = 'Please fill in your credentials.';
      showToast('Please enter email and password', 'error');
      return;
    }

    // Show loading
    const originalText = loginBtn.textContent;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    const dismissLoading = showLoading('Logging you in...');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, log_in_email, log_in_password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDocRef = doc(db, 'user', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        console.error('User document not found');
        if (alert_container) alert_container.textContent = 'User profile not found. Please contact support.';
        showToast('User profile not found', 'error');
        
        dismissLoading();
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
        return;
      }

      const userData = userDocSnap.data();
      const userRole = userData.role;

      // Dismiss loading
      dismissLoading();

      console.log('✅ Login successful');
      showToast('Login successful!', 'success');
      
      // ⭐ SIMPLE: ROLE-BASED REDIRECT ONLY
      // Dashboard will handle pending enrollment
      setTimeout(() => {
        if (userRole === 'admin') {
          window.location.href = '/tech wizzards admin dashboard/dashboard.html';
        } else {
          window.location.href = '/students/dashboard.html';
        }
      }, 500);

    } catch (error) {
      // Dismiss loading
      dismissLoading();

      // Reset button
      loginBtn.disabled = false;
      loginBtn.textContent = originalText;

      console.error('Login error:', error);
      
      // Better error messages
      let errorMsg = error.message;
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = 'Incorrect email or password.';
      } else if (error.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed attempts. Please try again later.';
      }
      
      if (alert_container) alert_container.textContent = errorMsg;
      showToast(errorMsg, 'error');
    }
  });
}

console.log('✅ Auth system loaded (simplified version)');

