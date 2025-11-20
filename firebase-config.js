// ====================================================================
// SHARED FIREBASE CONFIGURATION
// Tech Wizards Academy - Central Firebase Instance
// ====================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBBA8KVzbxoomwAm83erzk_JPxq37H27j0",
  authDomain: "key-board-wizards.firebaseapp.com",
  projectId: "key-board-wizards",
  storageBucket: "key-board-wizards.firebasestorage.app",
  messagingSenderId: "570989716323",
  appId: "1:570989716323:web:adb3d3ae753a91458f2956",
  measurementId: "G-E13DTS3XDB"
};

// Initialize Firebase (only once)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other files
export { app, auth, db };