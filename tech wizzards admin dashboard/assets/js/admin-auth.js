

// Firebase configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, Timestamp, getDoc } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

// Initialize Firebase with your actual config
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

// Auth check with admin role verification
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/sign-in.html';
    return;
  }

  try {
    // Fetch the logged-in user's document from Firestore
    const userDocRef = doc(db, 'user', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.error('User document not found in Firestore');
      alert('User profile not found. Please contact support.');
      await signOut(auth);
      window.location.href = '/sign-in.html';
      return;
    }

    const userData = userDocSnap.data();
    const userRole = userData.role;

    // Check if user is admin
    if (userRole !== 'admin') {
      console.warn('Access denied: User is not an admin');
      alert('Access denied. This page is for administrators only.');
      window.location.href = '/student-dashboard.html';
      return;
    }

    // User is authenticated and is an admin - proceed
    document.getElementById('user-avatar').textContent = user.email.charAt(0).toUpperCase();
    loadDashboardData();
  } catch (error) {
    console.error('Error checking user role:', error);
    alert('Error verifying access permissions. Please try again.');
    await signOut(auth);
    window.location.href = '/sign-in.html';
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = '/sign-in.html';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Error logging out. Please try again.');
  }
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const section = e.currentTarget.dataset.section;
    
    // Update active states
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Update page title
    const titles = {
      overview: 'Dashboard Overview',
      courses: 'Course Management',
      students: 'Student Management',
      sales: 'Sales & Transactions',
      analytics: 'Analytics'
    };
    document.getElementById('page-title').textContent = titles[section];
    
    // Load section-specific data
    if (section === 'courses') loadCourses();
    if (section === 'students') loadStudents();
    if (section === 'sales') loadSales();
  });
});

// Modal controls
document.getElementById('add-course-btn').addEventListener('click', () => {
  document.getElementById('modal-title').textContent = 'Add New Course';
  document.getElementById('course-form').reset();
  document.getElementById('course-id').value = '';
  document.getElementById('course-modal').classList.add('active');
});

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('course-modal').classList.remove('active');
});

document.getElementById('cancel-btn').addEventListener('click', () => {
  document.getElementById('course-modal').classList.remove('active');
});

// Load dashboard data
async function loadDashboardData() {
  try {
    // Load stats
    const coursesSnap = await getDocs(collection(db, 'courses'));
    const studentsSnap = await getDocs(collection(db, 'user'));
    const purchasesSnap = await getDocs(collection(db, 'purchases'));
    
    document.getElementById('active-courses').textContent = coursesSnap.size;
    document.getElementById('total-students').textContent = studentsSnap.size;
    document.getElementById('total-sales').textContent = purchasesSnap.size;
    
    // Calculate revenue
    let totalRevenue = 0;
    purchasesSnap.forEach(doc => {
      const data = doc.data();
      totalRevenue += (data.amount || 0) / 100; // Convert from kobo
    });
    document.getElementById('total-revenue').textContent = `₦${totalRevenue.toLocaleString()}`;
    
    // Load recent sales
    loadRecentSales();
  } catch (error) {
    showAlert('Error loading dashboard data: ' + error.message, 'error');
  }
}

// Load recent sales
async function loadRecentSales() {
  try {
    const q = query(collection(db, 'purchases'), orderBy('paid_at', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    
    const tbody = document.getElementById('recent-sales-body');
    tbody.innerHTML = '';
    
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No sales yet</td></tr>';
      return;
    }
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const row = tbody.insertRow();
      
      // Get user and course names
      const userName = data.userId || 'Unknown';
      const courseName = data.courseId || 'Unknown';
      
      row.innerHTML = `
        <td>${userName}</td>
        <td>${courseName}</td>
        <td>₦${((data.amount || 0) / 100).toLocaleString()}</td>
        <td>${data.paid_at?.toDate().toLocaleDateString() || 'N/A'}</td>
        <td><span class="status-badge status-published">${data.status || 'paid'}</span></td>
      `;
    }
  } catch (error) {
    console.error('Error loading recent sales:', error);
  }
}

// Load courses
async function loadCourses() {
  try {
    const snapshot = await getDocs(collection(db, 'courses'));
    const tbody = document.getElementById('courses-table-body');
    tbody.innerHTML = '';
    
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No courses yet. Click "Add New Course" to create one.</td></tr>';
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = tbody.insertRow();
      
      row.innerHTML = `
        <td><img src="${data.thumbnail || ''}" class="course-thumbnail" alt="${data.title}"></td>
        <td><strong>${data.title}</strong></td>
        <td>${data.category || 'N/A'}</td>
        <td>₦${(data.price || 0).toLocaleString()}</td>
        <td>${data.enrolledCount || 0}</td>
        <td><span class="status-badge ${data.isPublished ? 'status-published' : 'status-draft'}">${data.isPublished ? 'Published' : 'Draft'}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" onclick="editCourse('${doc.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCourse('${doc.id}')">Delete</button>
          </div>
        </td>
      `;
    });
  } catch (error) {
    showAlert('Error loading courses: ' + error.message, 'error');
  }
}

 

// Load sales
async function loadSales() {
  try {
    const q = query(collection(db, 'purchases'), orderBy('paid_at', 'desc'));
    const snapshot = await getDocs(q);
    const tbody = document.getElementById('sales-table-body');
    tbody.innerHTML = '';
    
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No transactions yet</td></tr>';
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = tbody.insertRow();
      
      row.innerHTML = `
        <td>${data.reference || doc.id}</td>
        <td>${data.userId || 'Unknown'}</td>
        <td>${data.courseId || 'Unknown'}</td>
        <td>₦${((data.amount || 0) / 100).toLocaleString()}</td>
        <td>${data.paid_at?.toDate().toLocaleDateString() || 'N/A'}</td>
        <td><span class="status-badge status-published">${data.status || 'paid'}</span></td>
      `;
    });
  } catch (error) {
    showAlert('Error loading sales: ' + error.message, 'error');
  }
}

// Save course
document.getElementById('course-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const courseData = {
    title: document.getElementById('course-title').value,
    category: document.getElementById('course-category').value,
    shortDescription: document.getElementById('course-short-desc').value,
    description: document.getElementById('course-description').value,
    price: parseFloat(document.getElementById('course-price').value),
    duration: document.getElementById('course-duration').value,
    thumbnail: document.getElementById('course-thumbnail').value,
    videoUrl: document.getElementById('course-video').value,
    instructor: document.getElementById('course-instructor').value,
    level: document.getElementById('course-level').value,
    isPublished: document.getElementById('course-status').value === 'true',
    enrolledCount: 0,
    rating: 0,
    updatedAt: Timestamp.now()
  };
  
  try {
    const courseId = document.getElementById('course-id').value;
    
    if (courseId) {
      // Update existing course
      await updateDoc(doc(db, 'courses', courseId), courseData);
      showAlert('Course updated successfully!', 'success');
    } else {
      // Add new course
      courseData.createdAt = Timestamp.now();
      await addDoc(collection(db, 'courses'), courseData);
      showAlert('Course created successfully!', 'success');
    }
    
    document.getElementById('course-modal').classList.remove('active');
    loadCourses();
    loadDashboardData();
  } catch (error) {
    showAlert('Error saving course: ' + error.message, 'error');
  }
});

// Edit course
window.editCourse = async (courseId) => {
  try {
    const courseDocRef = doc(db, 'courses', courseId);
    const courseDocSnap = await getDoc(courseDocRef);
    
    if (!courseDocSnap.exists()) {
      showAlert('Course not found', 'error');
      return;
    }
    
    const courseData = courseDocSnap.data();
    
    document.getElementById('modal-title').textContent = 'Edit Course';
    document.getElementById('course-id').value = courseId;
    document.getElementById('course-title').value = courseData.title || '';
    document.getElementById('course-category').value = courseData.category || '';
    document.getElementById('course-short-desc').value = courseData.shortDescription || '';
    document.getElementById('course-description').value = courseData.description || '';
    document.getElementById('course-price').value = courseData.price || '';
    document.getElementById('course-duration').value = courseData.duration || '';
    document.getElementById('course-thumbnail').value = courseData.thumbnail || '';
    document.getElementById('course-video').value = courseData.videoUrl || '';
    document.getElementById('course-instructor').value = courseData.instructor || '';
    document.getElementById('course-level').value = courseData.level || 'beginner';
    document.getElementById('course-status').value = courseData.isPublished ? 'true' : 'false';
    
    document.getElementById('course-modal').classList.add('active');
  } catch (error) {
    showAlert('Error loading course: ' + error.message, 'error');
  }
};

// Delete course
window.deleteCourse = async (courseId) => {
  if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, 'courses', courseId));
    showAlert('Course deleted successfully!', 'success');
    loadCourses();
    loadDashboardData();
  } catch (error) {
    showAlert('Error deleting course: ' + error.message, 'error');
  }
};

// View student
window.viewStudent = (studentId) => {
  // Implement student detail view
  alert('Student details coming soon...');
};

// Show alert
function showAlert(message, type) {
  const alertContainer = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alertContainer.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Add button size class
const style = document.createElement('style');
style.textContent = `
  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }
`;
document.head.appendChild(style);

