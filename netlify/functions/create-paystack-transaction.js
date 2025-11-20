/* FIXED - Paystack transaction creation with callback URL */
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Initialize Firebase Admin once
function initFirebase() {
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
    const cred = JSON.parse(serviceAccount);
    admin.initializeApp({ credential: admin.credential.cert(cred) });
  }
}

exports.handler = async function (event) {
  try {
    initFirebase();
    const db = admin.firestore();

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method not allowed' };
    }

    // Get authorization token
    const authHeader = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
    const idToken = authHeader.replace('Bearer ', '');
    
    if (!idToken) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: 'Missing authorization token' }) 
      };
    }

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    
    // Get request body
    const body = JSON.parse(event.body || '{}');
    const { courseId } = body;
    
    if (!courseId) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing courseId' }) 
      };
    }

    // Get course from Firestore
    const courseRef = db.collection('courses').doc(courseId);
    const courseSnap = await courseRef.get();
    
    if (!courseSnap.exists) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: 'Course not found in Firestore' }) 
      };
    }

    const course = courseSnap.data();
    
    // Validate price
    if (typeof course.price !== 'number') {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Course price must be a number in Firestore' }) 
      };
    }

    // Convert price to kobo (Paystack uses kobo)
    const amountKobo = Math.round(course.price * 100);

    // Get Paystack secret key
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'PAYSTACK_SECRET_KEY not configured' }) 
      };
    }

    // ⭐ FIX: Add callback_url to redirect users after payment
    const callbackUrl = `${event.headers.origin || 'https://tech-wizzards-academy.netlify.app'}/payment-success.html`;

    // Initialize Paystack transaction
    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: decoded.email,
        amount: amountKobo,
        callback_url: callbackUrl, // ⭐ THIS WAS MISSING!
        metadata: { 
          userId: uid, 
          courseId: courseId,
          courseName: course.title || 'Course' // Extra info for reference
        }
      })
    });

    const initJson = await initRes.json();
    
    if (!initJson.status) {
      console.error('Paystack init failed:', initJson);
      return { 
        statusCode: 502, 
        body: JSON.stringify({ 
          error: 'Paystack initialization failed', 
          details: initJson 
        }) 
      };
    }

    console.log('Payment initialized:', {
      reference: initJson.data.reference,
      userId: uid,
      courseId: courseId
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        authorization_url: initJson.data.authorization_url, 
        reference: initJson.data.reference 
      })
    };

  } catch (err) {
    console.error('Transaction creation error:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
};
