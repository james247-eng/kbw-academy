

// ====================================================================
// ADMIN DASHBOARD - COMPLETE JAVASCRIPT
// Tech Wizards Academy
// ====================================================================

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, Timestamp, getDoc } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

// ====================================================================
// FIREBASE CONFIGURATION
// ====================================================================
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
const auth = getAuth(app);
const db = getFirestore(app);

// ====================================================================
// GLOBAL VARIABLES
// ====================================================================
let allCourses = [];
let allStudents = [];
let allSales = [];
let lessonCount = 0; // NEW: Track lesson count

// ====================================================================
// AUTHENTICATION CHECK
// ====================================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/sign-in.html';
    return;
  }

  try {
    const userDocRef = doc(db, 'user', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.error('User document not found');
      showAlert('User profile not found. Please contact support.', 'error');
      await signOut(auth);
      window.location.href = '/sign-in.html';
      return;
    }

    const userData = userDocSnap.data();
    const userRole = userData.role;

    if (userRole !== 'admin') {
      console.warn('Access denied: Not an admin');
      showAlert('Access denied. Admins only.', 'error');
      window.location.href = '/student-dashboard.html';
      return;
    }

    console.log('Admin authenticated successfully');
    document.getElementById('user-avatar').textContent = user.email.charAt(0).toUpperCase();
    loadDashboardData();

  } catch (error) {
    console.error('Auth error:', error);
    showAlert('Error verifying access. Please try again.', 'error');
    await signOut(auth);
    window.location.href = '/sign-in.html';
  }
});

// ====================================================================
// LOGOUT
// ====================================================================
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = '/sign-in.html';
  } catch (error) {
    console.error('Logout error:', error);
    showAlert('Error logging out. Please try again.', 'error');
  }
});

// ====================================================================
// NAVIGATION
// ====================================================================
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const section = e.currentTarget.dataset.section;
    
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    
    const titles = {
      overview: 'Dashboard Overview',
      courses: 'Course Management',
      students: 'Student Management',
      sales: 'Sales & Transactions',
      analytics: 'Analytics'
    };
    document.getElementById('page-title').textContent = titles[section];
    
    if (section === 'courses') loadCourses();
    if (section === 'students') loadStudents();
    if (section === 'sales') loadSales();
    if (section === 'analytics') loadAnalytics();
  });
});

// ====================================================================
// MODAL CONTROLS
// ====================================================================
document.getElementById('add-course-btn').addEventListener('click', () => {
  document.getElementById('modal-title').textContent = 'Add New Course';
  document.getElementById('course-form').reset();
  document.getElementById('course-id').value = '';
  document.getElementById('lessons-container').innerHTML = '';
  lessonCount = 0;
  document.getElementById('course-modal').classList.add('active');
});

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('course-modal').classList.remove('active');
});

document.getElementById('cancel-btn').addEventListener('click', () => {
  document.getElementById('course-modal').classList.remove('active');
});

// ====================================================================
// LESSON MANAGEMENT FUNCTIONS - NEW
// ====================================================================

// Add new lesson
document.getElementById('add-lesson-btn').addEventListener('click', () => {
  lessonCount++;
  const template = document.getElementById('lesson-card-template');
  const clone = template.content.cloneNode(true);
  
  clone.querySelector('.lesson-number').textContent = lessonCount;
  
  const removeBtn = clone.querySelector('.remove-lesson-btn');
  removeBtn.addEventListener('click', function() {
    this.closest('.lesson-card').remove();
    updateLessonNumbers();
  });
  
  document.getElementById('lessons-container').appendChild(clone);
});

// Update lesson numbers after removal
function updateLessonNumbers() {
  const lessonCards = document.querySelectorAll('.lesson-card');
  lessonCount = lessonCards.length;
  
  lessonCards.forEach((card, index) => {
    card.querySelector('.lesson-number').textContent = index + 1;
  });
}

// Collect lessons data from form
function collectLessonsData() {
  const lessonCards = document.querySelectorAll('.lesson-card');
  const lessons = [];
  
  lessonCards.forEach((card, index) => {
    const title = card.querySelector('.lesson-title').value.trim();
    const videoUrl = card.querySelector('.lesson-video').value.trim();
    const duration = card.querySelector('.lesson-duration').value.trim();
    const description = card.querySelector('.lesson-description').value.trim();
    
    if (title && videoUrl) {
      lessons.push({
        lessonNumber: index + 1,
        title: title,
        videoUrl: videoUrl,
        duration: duration || 'N/A',
        description: description || '',
        isCompleted: false
      });
    }
  });
  
  return lessons;
}

// Populate lessons in edit mode
function populateLessons(lessons) {
  document.getElementById('lessons-container').innerHTML = '';
  lessonCount = 0;
  
  if (!lessons || lessons.length === 0) return;
  
  lessons.forEach(lesson => {
    lessonCount++;
    const template = document.getElementById('lesson-card-template');
    const clone = template.content.cloneNode(true);
    
    clone.querySelector('.lesson-number').textContent = lessonCount;
    clone.querySelector('.lesson-title').value = lesson.title || '';
    clone.querySelector('.lesson-video').value = lesson.videoUrl || '';
    clone.querySelector('.lesson-duration').value = lesson.duration || '';
    clone.querySelector('.lesson-description').value = lesson.description || '';
    
    const removeBtn = clone.querySelector('.remove-lesson-btn');
    removeBtn.addEventListener('click', function() {
      this.closest('.lesson-card').remove();
      updateLessonNumbers();
    });
    
    document.getElementById('lessons-container').appendChild(clone);
  });
}

// ====================================================================
// LOAD DASHBOARD DATA
// ====================================================================
async function loadDashboardData() {
  try {
    const coursesSnap = await getDocs(collection(db, 'courses'));
    const studentsSnap = await getDocs(collection(db, 'user'));
    const purchasesSnap = await getDocs(collection(db, 'purchases'));
    
    document.getElementById('active-courses').textContent = coursesSnap.size;
    document.getElementById('total-students').textContent = studentsSnap.size;
    document.getElementById('total-sales').textContent = purchasesSnap.size;
    
    let totalRevenue = 0;
    purchasesSnap.forEach(doc => {
      const data = doc.data();
      if (data.status === 'paid') {
        totalRevenue += (data.amount || 0) / 100;
      }
    });
    document.getElementById('total-revenue').textContent = `₦${totalRevenue.toLocaleString()}`;
    
    await loadRecentSales();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showAlert('Error loading dashboard data: ' + error.message, 'error');
  }
}

// ====================================================================
// LOAD RECENT SALES
// ====================================================================
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
      
      let studentName = 'Unknown';
      if (data.userId) {
        try {
          const userDoc = await getDoc(doc(db, 'user', data.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            studentName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email || 'Unknown';
          }
        } catch (e) {
          console.error('Error fetching user:', e);
        }
      }
      
      let courseName = 'Unknown';
      if (data.courseId) {
        try {
          const courseDoc = await getDoc(doc(db, 'courses', data.courseId));
          if (courseDoc.exists()) {
            courseName = courseDoc.data().title || 'Unknown';
          }
        } catch (e) {
          console.error('Error fetching course:', e);
        }
      }
      
      row.innerHTML = `
        <td><strong>${studentName}</strong></td>
        <td>${courseName}</td>
        <td style="font-weight:600; color:#059669;">₦${((data.amount || 0) / 100).toLocaleString()}</td>
        <td>${data.paid_at?.toDate().toLocaleDateString() || 'N/A'}</td>
        <td><span class="status-badge status-published">${data.status || 'paid'}</span></td>
      `;
    }
  } catch (error) {
    console.error('Error loading recent sales:', error);
  }
}

// ====================================================================
// LOAD COURSES
// ====================================================================
async function loadCourses() {
  try {
    const snapshot = await getDocs(collection(db, 'courses'));
    const tbody = document.getElementById('courses-table-body');
    tbody.innerHTML = '';
    
    allCourses = [];
    
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No courses yet. Click "Add New Course" to create one.</td></tr>';
      return;
    }
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const courseWithId = { id: docSnap.id, ...data };
      allCourses.push(courseWithId);
      
      const row = tbody.insertRow();
      
      row.innerHTML = `
        <td><img src="${data.thumbnail || ''}" class="course-thumbnail" alt="${data.title}" onerror="this.src='https://via.placeholder.com/60x40'"></td>
        <td><strong>${data.title}</strong></td>
        <td style="text-transform:capitalize;">${(data.category || 'N/A').replace('-', ' ')}</td>
        <td style="font-weight:600; color:#059669;">₦${(data.price || 0).toLocaleString()}</td>
        <td>${data.enrolledCount || 0}</td>
        <td><span class="status-badge ${data.isPublished ? 'status-published' : 'status-draft'}">${data.isPublished ? 'Published' : 'Draft'}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" onclick="editCourse('${docSnap.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCourse('${docSnap.id}')">Delete</button>
          </div>
        </td>
      `;
    });
  } catch (error) {
    console.error('Error loading courses:', error);
    showAlert('Error loading courses: ' + error.message, 'error');
  }
}

// ====================================================================
// LOAD STUDENTS
// ====================================================================
async function loadStudents() {
  try {
    const snapshot = await getDocs(collection(db, 'user'));
    const tbody = document.getElementById('students-table-body');
    tbody.innerHTML = '';
    
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No students yet</td></tr>';
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = tbody.insertRow();
      
      row.innerHTML = `
        <td><strong>${data.firstName || ''} ${data.lastName || ''}</strong></td>
        <td>${data.email || 'N/A'}</td>
        <td>${(data.enrolledCourses || []).length}</td>
        <td>${data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="viewStudent('${doc.id}')">View</button>
        </td>
      `;
    });
  } catch (error) {
    showAlert('Error loading students: ' + error.message, 'error');
  }
}

// ====================================================================
// LOAD SALES
// ====================================================================
async function loadSales() {
  try {
    const q = query(collection(db, 'purchases'), orderBy('paid_at', 'desc'));
    const snapshot = await getDocs(q);
    const tbody = document.getElementById('sales-table-body');
    tbody.innerHTML = '';
    
    allSales = [];
    
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No transactions yet</td></tr>';
      return;
    }
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      let studentEmail = 'Unknown';
      if (data.userId) {
        try {
          const userDoc = await getDoc(doc(db, 'user', data.userId));
          if (userDoc.exists()) {
            studentEmail = userDoc.data().email || 'Unknown';
          }
        } catch (e) {
          console.error('Error fetching user:', e);
        }
      }
      
      let courseTitle = 'Unknown';
      if (data.courseId) {
        try {
          const courseDoc = await getDoc(doc(db, 'courses', data.courseId));
          if (courseDoc.exists()) {
            courseTitle = courseDoc.data().title || 'Unknown';
          }
        } catch (e) {
          console.error('Error fetching course:', e);
        }
      }
      
      const saleWithDetails = {
        id: docSnap.id,
        ...data,
        studentEmail,
        courseTitle
      };
      allSales.push(saleWithDetails);
      
      const row = tbody.insertRow();
      
      row.innerHTML = `
        <td><code style="background:#f3f4f6; padding:4px 8px; border-radius:4px; font-size:11px;">${data.reference || docSnap.id}</code></td>
        <td>${studentEmail}</td>
        <td>${courseTitle}</td>
        <td style="font-weight:600; color:#059669;">₦${((data.amount || 0) / 100).toLocaleString()}</td>
        <td>${data.paid_at?.toDate().toLocaleDateString() || 'N/A'}</td>
        <td><span class="status-badge status-published">${data.status || 'paid'}</span></td>
      `;
    }
  } catch (error) {
    console.error('Error loading sales:', error);
    showAlert('Error loading sales: ' + error.message, 'error');
  }
}

// ====================================================================
// LOAD ANALYTICS
// ====================================================================
async function loadAnalytics() {
  try {
    const [coursesSnap, purchasesSnap] = await Promise.all([
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'purchases'))
    ]);

    const revenueByRev = {};
    purchasesSnap.forEach(doc => {
      const data = doc.data();
      if (data.status === 'paid' && data.courseId) {
        if (!revenueByRev[data.courseId]) {
          revenueByRev[data.courseId] = 0;
        }
        revenueByRev[data.courseId] += (data.amount || 0) / 100;
      }
    });

    const coursesMap = {};
    coursesSnap.forEach(doc => {
      coursesMap[doc.id] = doc.data();
    });

    const topByRevenue = Object.entries(revenueByRev)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const revenueDiv = document.getElementById('top-courses-chart');
    revenueDiv.innerHTML = '<h3 style="margin-bottom:20px;">Top 5 Courses by Revenue</h3>';
    
    if (topByRevenue.length === 0) {
      revenueDiv.innerHTML += '<p style="color:#999;">No sales data yet</p>';
    } else {
      topByRevenue.forEach(([courseId, revenue], index) => {
        const course = coursesMap[courseId] || {};
        revenueDiv.innerHTML += `
          <div style="margin-bottom:15px; padding:15px; background:#f9fafb; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="color:#1a1f36;">${index + 1}. ${course.title || 'Unknown Course'}</strong>
                <p style="margin:5px 0 0 0; color:#6b7280; font-size:14px;">${course.enrolledCount || 0} students</p>
              </div>
              <div style="font-size:20px; font-weight:700; color:#059669;">₦${revenue.toLocaleString()}</div>
            </div>
          </div>
        `;
      });
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    showAlert('Error loading analytics: ' + error.message, 'error');
  }
}

// ====================================================================
// SAVE COURSE - UPDATED WITH LESSONS
// ====================================================================
document.getElementById('course-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const lessons = collectLessonsData();
  
  if (lessons.length === 0) {
    showAlert('Please add at least one lesson to the course', 'error');
    return;
  }
  
  const courseData = {
    title: document.getElementById('course-title').value.trim(),
    category: document.getElementById('course-category').value,
    shortDescription: document.getElementById('course-short-desc').value.trim(),
    description: document.getElementById('course-description').value.trim(),
    price: parseFloat(document.getElementById('course-price').value),
    thumbnail: document.getElementById('course-thumbnail').value.trim(),
    instructor: document.getElementById('course-instructor').value.trim() || 'Tech Wizards Academy',
    level: document.getElementById('course-level').value,
    isPublished: document.getElementById('course-status').value === 'true',
    lessons: lessons,
    totalLessons: lessons.length,
    enrolledCount: 0,
    rating: 0,
    updatedAt: Timestamp.now()
  };
  
  try {
    const courseId = document.getElementById('course-id').value;
    
    if (courseId) {
      await updateDoc(doc(db, 'courses', courseId), courseData);
      showAlert('Course updated successfully!', 'success');
    } else {
      courseData.createdAt = Timestamp.now();
      await addDoc(collection(db, 'courses'), courseData);
      showAlert('Course created successfully!', 'success');
    }
    
    document.getElementById('course-modal').classList.remove('active');
    document.getElementById('lessons-container').innerHTML = '';
    lessonCount = 0;
    loadCourses();
    loadDashboardData();
    
  } catch (error) {
    console.error('Error saving course:', error);
    showAlert('Error saving course: ' + error.message, 'error');
  }
});

// ====================================================================
// EDIT COURSE - UPDATED WITH LESSONS
// ====================================================================
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
    document.getElementById('course-thumbnail').value = courseData.thumbnail || '';
    document.getElementById('course-instructor').value = courseData.instructor || '';
    document.getElementById('course-level').value = courseData.level || 'beginner';
    document.getElementById('course-status').value = courseData.isPublished ? 'true' : 'false';
    
    populateLessons(courseData.lessons || []);
    
    document.getElementById('course-modal').classList.add('active');
    
  } catch (error) {
    console.error('Error loading course:', error);
    showAlert('Error loading course: ' + error.message, 'error');
  }
};

// ====================================================================
// DELETE COURSE
// ====================================================================
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
    console.error('Error deleting course:', error);
    showAlert('Error deleting course: ' + error.message, 'error');
  }
};

// ====================================================================
// VIEW STUDENT
// ====================================================================
window.viewStudent = async (studentId) => {
  alert('Student details coming soon...');
};

// ====================================================================
// SHOW ALERT
// ====================================================================
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

console.log('Admin Dashboard loaded successfully');









