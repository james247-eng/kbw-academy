// ====================================================================
// ADMIN-BLOG.JS - Blog Management System
// ====================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, Timestamp, getDoc } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBBA8KVzbxoomwAm83erzk_JPxq37H27j0",
  authDomain: "key-board-wizards.firebaseapp.com",
  projectId: "key-board-wizards",
  storageBucket: "key-board-wizards.firebasestorage.app",
  messagingSenderId: "570989716323",
  appId: "1:570989716323:web:adb3d3ae753a91458f2956",
  measurementId: "G-E13DTS3XDB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let tags = [];

// ====================================================================
// AUTH CHECK
// ====================================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/sign-in.html';
    return;
  }

  // Check if user is admin
  try {
    const userDoc = await getDoc(doc(db, 'user', user.uid));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      alert('Access denied. Admins only.');
      window.location.href = '/students/dashboard.html';
      return;
    }
    
    loadBlogPosts();
  } catch (error) {
    console.error('Auth error:', error);
  }
});

// ====================================================================
// LOAD ALL BLOG POSTS
// ====================================================================
async function loadBlogPosts() {
  try {
    const q = query(collection(db, 'blog-posts'), orderBy('publishedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const grid = document.getElementById('posts-grid');
    
    if (snapshot.empty) {
      grid.innerHTML = `
        <div class="loading">
          <h3>No blog posts yet</h3>
          <p>Click "New Blog Post" to create your first article</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    
    snapshot.forEach(doc => {
      const post = doc.data();
      const card = createPostCard(doc.id, post);
      grid.appendChild(card);
    });

  } catch (error) {
    console.error('Error loading posts:', error);
    showAlert('Error loading blog posts: ' + error.message, 'error');
  }
}

// ====================================================================
// CREATE POST CARD
// ====================================================================
function createPostCard(id, post) {
  const card = document.createElement('div');
  card.className = 'post-card';
  
  const date = post.publishedAt ? formatDate(post.publishedAt) : 'Draft';
  const status = post.status || 'published';
  
  card.innerHTML = `
    <img src="${post.image || 'https://via.placeholder.com/400x300'}" 
         alt="${post.title}"
         class="post-image"
         onerror="this.src='https://via.placeholder.com/400x300?text=Blog+Post'">
    <div class="post-content">
      ${post.featured ? '<span style="background: #fbbf24; color: #78350f; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; margin-bottom: 8px;">⭐ FEATURED</span>' : ''}
      <h3 class="post-title">${post.title}</h3>
      <div class="post-meta">
        <span>📂 ${formatCategory(post.category)}</span>
        <span>📅 ${date}</span>
        <span style="color: ${status === 'published' ? '#10b981' : '#f59e0b'};">● ${status.toUpperCase()}</span>
      </div>
      <p class="post-excerpt">${post.excerpt || post.content.substring(0, 100) + '...'}</p>
      <div class="post-actions">
        <button class="btn btn-secondary btn-sm" onclick="editPost('${id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deletePost('${id}', '${post.title}')">🗑️ Delete</button>
        <button class="btn btn-primary btn-sm" onclick="viewPost('${id}')">👁️ View</button>
      </div>
    </div>
  `;
  
  return card;
}

// ====================================================================
// MODAL CONTROLS
// ====================================================================
document.getElementById('add-post-btn').addEventListener('click', () => {
  document.getElementById('modal-title').textContent = 'Create New Blog Post';
  document.getElementById('post-form').reset();
  document.getElementById('post-id').value = '';
  tags = [];
  updateTagsDisplay();
  document.getElementById('post-modal').classList.add('active');
});

document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('cancel-btn').addEventListener('click', closeModal);

function closeModal() {
  document.getElementById('post-modal').classList.remove('active');
}

// ====================================================================
// TAGS INPUT FUNCTIONALITY
// ====================================================================
const tagInput = document.getElementById('tag-input');

tagInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const tag = tagInput.value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      tags.push(tag);
      updateTagsDisplay();
      tagInput.value = '';
    }
  }
});

function updateTagsDisplay() {
  const container = document.getElementById('tags-container');
  const tagChips = tags.map(tag => `
    <span class="tag-chip">
      ${tag}
      <span class="tag-remove" onclick="removeTag('${tag}')">×</span>
    </span>
  `).join('');
  
  container.innerHTML = tagChips + '<input type="text" class="tag-input" id="tag-input" placeholder="Add tags...">';
  
  // Re-attach event listener
  const newInput = document.getElementById('tag-input');
  newInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = newInput.value.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
        updateTagsDisplay();
      }
    }
  });
}

window.removeTag = function(tag) {
  tags = tags.filter(t => t !== tag);
  updateTagsDisplay();
};

// ====================================================================
// SAVE BLOG POST
// ====================================================================
document.getElementById('post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const postData = {
    title: document.getElementById('post-title').value.trim(),
    category: document.getElementById('post-category').value,
    author: document.getElementById('post-author').value.trim() || 'Tech Wizards Team',
    image: document.getElementById('post-image').value.trim(),
    excerpt: document.getElementById('post-excerpt').value.trim(),
    content: document.getElementById('post-content').value.trim(),
    readTime: parseInt(document.getElementById('post-read-time').value) || calculateReadTime(document.getElementById('post-content').value),
    status: document.getElementById('post-status').value,
    featured: document.getElementById('post-featured').checked,
    tags: tags,
    views: 0,
    updatedAt: Timestamp.now()
  };

  try {
    const postId = document.getElementById('post-id').value;
    
    if (postId) {
      // Update existing post
      await updateDoc(doc(db, 'blog-posts', postId), postData);
      showAlert('Blog post updated successfully!', 'success');
    } else {
      // Create new post
      postData.publishedAt = Timestamp.now();
      postData.createdAt = Timestamp.now();
      await addDoc(collection(db, 'blog-posts'), postData);
      showAlert('Blog post created successfully!', 'success');
    }
    
    closeModal();
    loadBlogPosts();
    
  } catch (error) {
    console.error('Error saving post:', error);
    showAlert('Error saving blog post: ' + error.message, 'error');
  }
});

// ====================================================================
// EDIT POST
// ====================================================================
window.editPost = async function(postId) {
  try {
    const postDoc = await getDoc(doc(db, 'blog-posts', postId));
    
    if (!postDoc.exists()) {
      showAlert('Post not found', 'error');
      return;
    }
    
    const post = postDoc.data();
    
    document.getElementById('modal-title').textContent = 'Edit Blog Post';
    document.getElementById('post-id').value = postId;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-category').value = post.category;
    document.getElementById('post-author').value = post.author || '';
    document.getElementById('post-image').value = post.image;
    document.getElementById('post-excerpt').value = post.excerpt;
    document.getElementById('post-content').value = post.content;
    document.getElementById('post-read-time').value = post.readTime || '';
    document.getElementById('post-status').value = post.status || 'published';
    document.getElementById('post-featured').checked = post.featured || false;
    
    tags = post.tags || [];
    updateTagsDisplay();
    
    document.getElementById('post-modal').classList.add('active');
    
  } catch (error) {
    console.error('Error loading post:', error);
    showAlert('Error loading post: ' + error.message, 'error');
  }
};

// ====================================================================
// DELETE POST
// ====================================================================
window.deletePost = async function(postId, title) {
  if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, 'blog-posts', postId));
    showAlert('Blog post deleted successfully!', 'success');
    loadBlogPosts();
  } catch (error) {
    console.error('Error deleting post:', error);
    showAlert('Error deleting post: ' + error.message, 'error');
  }
};

// ====================================================================
// VIEW POST
// ====================================================================
window.viewPost = function(postId) {
  window.open(`/blog-post.html?id=${postId}`, '_blank');
};

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================
function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const words = content.split(' ').length;
  return Math.ceil(words / wordsPerMinute);
}

function formatDate(timestamp) {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatCategory(category) {
  if (!category) return 'General';
  return category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function showAlert(message, type) {
  const container = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

console.log('✅ Admin blog management initialized');










// ====================================================================
// FALLBACK VERSION STERTS FROM HERE
// ====================================================================
/*
// ====================================================================
// ADMIN-BLOG.JS - Blog Management System
// ====================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, Timestamp, getDoc } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBBA8KVzbxoomwAm83erzk_JPxq37H27j0",
  authDomain: "key-board-wizards.firebaseapp.com",
  projectId: "key-board-wizards",
  storageBucket: "key-board-wizards.firebasestorage.app",
  messagingSenderId: "570989716323",
  appId: "1:570989716323:web:adb3d3ae753a91458f2956",
  measurementId: "G-E13DTS3XDB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let tags = [];

// ====================================================================
// AUTH CHECK
// ====================================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.log('No user logged in, redirecting...');
    window.location.href = '/sign-in.html';
    return;
  }

  console.log('User logged in:', user.email);

  // Check if user is admin
  try {
    const userDoc = await getDoc(doc(db, 'user', user.uid));
    
    if (!userDoc.exists()) {
      console.error('User document not found');
      alert('User profile not found. Please contact support.');
      window.location.href = '/sign-in.html';
      return;
    }
    
    const userData = userDoc.data();
    console.log('User role:', userData.role);
    
    if (userData.role !== 'admin') {
      console.warn('User is not admin');
      alert('Access denied. Admins only.');
      window.location.href = '/student-dashboard.html';
      return;
    }
    
    console.log('Admin access granted, loading posts...');
    loadBlogPosts();
    
  } catch (error) {
    console.error('Auth error:', error);
    alert('Error checking permissions: ' + error.message);
    // Still try to load posts even if auth check fails (for debugging)
    loadBlogPosts();
  }
});

// ====================================================================
// LOAD ALL BLOG POSTS
// ====================================================================
async function loadBlogPosts() {
  try {
    const q = query(collection(db, 'blog-posts'), orderBy('publishedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const grid = document.getElementById('posts-grid');
    
    if (snapshot.empty) {
      grid.innerHTML = `
        <div class="loading">
          <h3>No blog posts yet</h3>
          <p>Click "New Blog Post" to create your first article</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    
    snapshot.forEach(doc => {
      const post = doc.data();
      const card = createPostCard(doc.id, post);
      grid.appendChild(card);
    });

  } catch (error) {
    console.error('Error loading posts:', error);
    showAlert('Error loading blog posts: ' + error.message, 'error');
  }
}

// ====================================================================
// CREATE POST CARD
// ====================================================================
function createPostCard(id, post) {
  const card = document.createElement('div');
  card.className = 'post-card';
  
  const date = post.publishedAt ? formatDate(post.publishedAt) : 'Draft';
  const status = post.status || 'published';
  
  card.innerHTML = `
    <img src="${post.image || 'https://via.placeholder.com/400x300'}" 
         alt="${post.title}"
         class="post-image"
         onerror="this.src='https://via.placeholder.com/400x300?text=Blog+Post'">
    <div class="post-content">
      ${post.featured ? '<span style="background: #fbbf24; color: #78350f; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; margin-bottom: 8px;">⭐ FEATURED</span>' : ''}
      <h3 class="post-title">${post.title}</h3>
      <div class="post-meta">
        <span>📂 ${formatCategory(post.category)}</span>
        <span>📅 ${date}</span>
        <span style="color: ${status === 'published' ? '#10b981' : '#f59e0b'};">● ${status.toUpperCase()}</span>
      </div>
      <p class="post-excerpt">${post.excerpt || post.content.substring(0, 100) + '...'}</p>
      <div class="post-actions">
        <button class="btn btn-secondary btn-sm" onclick="editPost('${id}')">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deletePost('${id}', '${post.title}')">🗑️ Delete</button>
        <button class="btn btn-primary btn-sm" onclick="viewPost('${id}')">👁️ View</button>
      </div>
    </div>
  `;
  
  return card;
}

// ====================================================================
// MODAL CONTROLS
// ====================================================================
document.getElementById('add-post-btn').addEventListener('click', () => {
  document.getElementById('modal-title').textContent = 'Create New Blog Post';
  document.getElementById('post-form').reset();
  document.getElementById('post-id').value = '';
  tags = [];
  updateTagsDisplay();
  document.getElementById('post-modal').classList.add('active');
});

document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('cancel-btn').addEventListener('click', closeModal);

function closeModal() {
  document.getElementById('post-modal').classList.remove('active');
}

// ====================================================================
// TAGS INPUT FUNCTIONALITY
// ====================================================================
const tagInput = document.getElementById('tag-input');

tagInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const tag = tagInput.value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      tags.push(tag);
      updateTagsDisplay();
      tagInput.value = '';
    }
  }
});

function updateTagsDisplay() {
  const container = document.getElementById('tags-container');
  const tagChips = tags.map(tag => `
    <span class="tag-chip">
      ${tag}
      <span class="tag-remove" onclick="removeTag('${tag}')">×</span>
    </span>
  `).join('');
  
  container.innerHTML = tagChips + '<input type="text" class="tag-input" id="tag-input" placeholder="Add tags...">';
  
  // Re-attach event listener
  const newInput = document.getElementById('tag-input');
  newInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = newInput.value.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
        updateTagsDisplay();
      }
    }
  });
}

window.removeTag = function(tag) {
  tags = tags.filter(t => t !== tag);
  updateTagsDisplay();
};

// ====================================================================
// SAVE BLOG POST
// ====================================================================
document.getElementById('post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const postData = {
    title: document.getElementById('post-title').value.trim(),
    category: document.getElementById('post-category').value,
    author: document.getElementById('post-author').value.trim() || 'Tech Wizards Team',
    image: document.getElementById('post-image').value.trim(),
    excerpt: document.getElementById('post-excerpt').value.trim(),
    content: document.getElementById('post-content').value.trim(),
    readTime: parseInt(document.getElementById('post-read-time').value) || calculateReadTime(document.getElementById('post-content').value),
    status: document.getElementById('post-status').value,
    featured: document.getElementById('post-featured').checked,
    tags: tags,
    views: 0,
    updatedAt: Timestamp.now()
  };

  try {
    const postId = document.getElementById('post-id').value;
    
    if (postId) {
      // Update existing post
      await updateDoc(doc(db, 'blog-posts', postId), postData);
      showAlert('Blog post updated successfully!', 'success');
    } else {
      // Create new post
      postData.publishedAt = Timestamp.now();
      postData.createdAt = Timestamp.now();
      await addDoc(collection(db, 'blog-posts'), postData);
      showAlert('Blog post created successfully!', 'success');
    }
    
    closeModal();
    loadBlogPosts();
    
  } catch (error) {
    console.error('Error saving post:', error);
    showAlert('Error saving blog post: ' + error.message, 'error');
  }
});

// ====================================================================
// EDIT POST
// ====================================================================
window.editPost = async function(postId) {
  try {
    const postDoc = await getDoc(doc(db, 'blog-posts', postId));
    
    if (!postDoc.exists()) {
      showAlert('Post not found', 'error');
      return;
    }
    
    const post = postDoc.data();
    
    document.getElementById('modal-title').textContent = 'Edit Blog Post';
    document.getElementById('post-id').value = postId;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-category').value = post.category;
    document.getElementById('post-author').value = post.author || '';
    document.getElementById('post-image').value = post.image;
    document.getElementById('post-excerpt').value = post.excerpt;
    document.getElementById('post-content').value = post.content;
    document.getElementById('post-read-time').value = post.readTime || '';
    document.getElementById('post-status').value = post.status || 'published';
    document.getElementById('post-featured').checked = post.featured || false;
    
    tags = post.tags || [];
    updateTagsDisplay();
    
    document.getElementById('post-modal').classList.add('active');
    
  } catch (error) {
    console.error('Error loading post:', error);
    showAlert('Error loading post: ' + error.message, 'error');
  }
};

// ====================================================================
// DELETE POST
// ====================================================================
window.deletePost = async function(postId, title) {
  if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, 'blog-posts', postId));
    showAlert('Blog post deleted successfully!', 'success');
    loadBlogPosts();
  } catch (error) {
    console.error('Error deleting post:', error);
    showAlert('Error deleting post: ' + error.message, 'error');
  }
};

// ====================================================================
// VIEW POST
// ====================================================================
window.viewPost = function(postId) {
  window.open(`/blog-post.html?id=${postId}`, '_blank');
};

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================
function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const words = content.split(' ').length;
  return Math.ceil(words / wordsPerMinute);
}

function formatDate(timestamp) {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatCategory(category) {
  if (!category) return 'General';
  return category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function showAlert(message, type) {
  const container = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

console.log('✅ Admin blog management initialized');
*/ 