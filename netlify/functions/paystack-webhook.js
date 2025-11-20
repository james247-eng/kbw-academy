


/* FIXED - Paystack webhook with corrected timestamp handling */
/*
const crypto = require('crypto');
const admin = require('firebase-admin');

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
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method not allowed' };
    }

    // Check for Paystack secret key
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return { statusCode: 500, body: 'PAYSTACK_SECRET_KEY not configured' };
    }

    // Verify webhook signature
    const signature = (event.headers['x-paystack-signature'] || event.headers['X-Paystack-Signature']);
    if (!signature) {
      console.warn('Missing Paystack signature');
      return { statusCode: 400, body: 'Missing signature' };
    }

    const body = event.body || '';
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');

    if (hash !== signature) {
      console.warn('Invalid signature on webhook');
      return { statusCode: 400, body: 'Invalid signature' };
    }

    // Parse payload
    const payload = JSON.parse(body);
    const eventType = payload.event;
    const data = payload.data;

    console.log('Webhook received:', eventType, 'Reference:', data.reference);

    // Initialize Firebase
    initFirebase();
    const db = admin.firestore();

    // Handle successful payment
    if (eventType === 'charge.success') {
      const metadata = data.metadata || {};
      const userId = metadata.userId;
      const courseId = metadata.courseId;
      const reference = data.reference;

      if (!userId || !courseId) {
        console.error('Missing userId or courseId in metadata');
        return { statusCode: 400, body: 'Missing required metadata' };
      }

      // ⭐ FIX: Properly handle paid_at timestamp
      let paidAt;
      try {
        if (data.paid_at) {
          // If paid_at is a string, parse it
          if (typeof data.paid_at === 'string') {
            paidAt = admin.firestore.Timestamp.fromDate(new Date(data.paid_at));
          } 
          // If paid_at is a number (unix timestamp in seconds)
          else if (typeof data.paid_at === 'number') {
            paidAt = admin.firestore.Timestamp.fromMillis(data.paid_at * 1000);
          } 
          // Fallback to now
          else {
            paidAt = admin.firestore.Timestamp.now();
          }
        } else {
          // No paid_at provided, use current time
          paidAt = admin.firestore.Timestamp.now();
        }
      } catch (err) {
        console.warn('Error parsing paid_at, using current time:', err);
        paidAt = admin.firestore.Timestamp.now();
      }

      // Create purchase record
      const purchase = {
        userId: userId,
        courseId: courseId,
        amount: data.amount, // in kobo
        currency: data.currency || 'NGN',
        payment_provider: 'paystack',
        reference: reference,
        status: 'paid',
        paid_at: paidAt,
        createdAt: admin.firestore.Timestamp.now(),
        customerEmail: data.customer?.email || null
      };

      console.log('Saving purchase:', {
        reference,
        userId,
        courseId,
        paid_at: paidAt
      });

      // ⭐ Save to main purchases collection
      await db.collection('purchases').doc(reference).set(purchase, { merge: true });
      console.log('✓ Saved to purchases collection');

      // ⭐ Save to user's purchases subcollection
      const userPurchRef = db.collection('user').doc(userId).collection('purchases').doc(reference);
      await userPurchRef.set(purchase, { merge: true });
      console.log('✓ Saved to user purchases subcollection');

      // ⭐ Add courseId to user's enrolledCourses array
      await db.collection('user').doc(userId).set(
        { 
          enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId),
          updatedAt: admin.firestore.Timestamp.now()
        }, 
        { merge: true }
      );
      console.log('✓ Added to enrolledCourses array');

      // ⭐ Increment course enrolledCount
      try {
        const courseRef = db.collection('courses').doc(courseId);
        await courseRef.update({
          enrolledCount: admin.firestore.FieldValue.increment(1)
        });
        console.log('✓ Incremented course enrolledCount');
      } catch (err) {
        console.warn('Could not update enrolledCount (course may not exist):', err.message);
      }

      console.log('✅ Purchase recorded successfully:', reference);

      return { 
        statusCode: 200, 
        body: JSON.stringify({ success: true, reference }) 
      };
    }

    // Handle other events
    console.log('Unhandled event type:', eventType);
    return { statusCode: 200, body: 'ok' };

  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
};*/



/* FIXED - Paystack webhook with student name and course title storage */
const crypto = require('crypto');
const admin = require('firebase-admin');

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
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method not allowed' };
    }

    // Check for Paystack secret key
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return { statusCode: 500, body: 'PAYSTACK_SECRET_KEY not configured' };
    }

    // Verify webhook signature
    const signature = (event.headers['x-paystack-signature'] || event.headers['X-Paystack-Signature']);
    if (!signature) {
      console.warn('Missing Paystack signature');
      return { statusCode: 400, body: 'Missing signature' };
    }

    const body = event.body || '';
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');

    if (hash !== signature) {
      console.warn('Invalid signature on webhook');
      return { statusCode: 400, body: 'Invalid signature' };
    }

    // Parse payload
    const payload = JSON.parse(body);
    const eventType = payload.event;
    const data = payload.data;

    console.log('Webhook received:', eventType, 'Reference:', data.reference);

    // Initialize Firebase
    initFirebase();
    const db = admin.firestore();

    // Handle successful payment
    if (eventType === 'charge.success') {
      const metadata = data.metadata || {};
      const userId = metadata.userId;
      const courseId = metadata.courseId;
      const reference = data.reference;

      if (!userId || !courseId) {
        console.error('Missing userId or courseId in metadata');
        return { statusCode: 400, body: 'Missing required metadata' };
      }

      // ⭐ FETCH USER DATA (for student name)
      let studentName = 'Unknown Student';
      let studentEmail = data.customer?.email || 'Unknown';
      
      try {
        const userDoc = await db.collection('user').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const firstName = userData.firstName || '';
          const lastName = userData.lastName || '';
          studentName = `${firstName} ${lastName}`.trim() || userData.email || studentEmail;
          studentEmail = userData.email || studentEmail;
        }
      } catch (err) {
        console.warn('Could not fetch user data:', err.message);
      }

      // ⭐ FETCH COURSE DATA (for course title)
      let courseTitle = 'Unknown Course';
      let coursePrice = 0;
      
      try {
        const courseDoc = await db.collection('courses').doc(courseId).get();
        if (courseDoc.exists) {
          const courseData = courseDoc.data();
          courseTitle = courseData.title || 'Unknown Course';
          coursePrice = courseData.price || 0;
        }
      } catch (err) {
        console.warn('Could not fetch course data:', err.message);
      }

      // ⭐ FIX: Properly handle paid_at timestamp
      let paidAt;
      try {
        if (data.paid_at) {
          if (typeof data.paid_at === 'string') {
            paidAt = admin.firestore.Timestamp.fromDate(new Date(data.paid_at));
          } else if (typeof data.paid_at === 'number') {
            paidAt = admin.firestore.Timestamp.fromMillis(data.paid_at * 1000);
          } else {
            paidAt = admin.firestore.Timestamp.now();
          }
        } else {
          paidAt = admin.firestore.Timestamp.now();
        }
      } catch (err) {
        console.warn('Error parsing paid_at, using current time:', err);
        paidAt = admin.firestore.Timestamp.now();
      }

      // ⭐ Create purchase record WITH names/titles
      const purchase = {
        userId: userId,
        courseId: courseId,
        studentName: studentName,           // ⭐ ADDED
        studentEmail: studentEmail,         // ⭐ ADDED
        courseTitle: courseTitle,           // ⭐ ADDED
        coursePrice: coursePrice,           // ⭐ ADDED
        amount: data.amount,                // in kobo
        currency: data.currency || 'NGN',
        payment_provider: 'paystack',
        reference: reference,
        status: 'paid',
        paid_at: paidAt,
        createdAt: admin.firestore.Timestamp.now()
      };

      console.log('Saving purchase:', {
        reference,
        userId,
        courseId,
        studentName,
        courseTitle
      });

      // ⭐ Save to main purchases collection
      await db.collection('purchases').doc(reference).set(purchase, { merge: true });
      console.log('✓ Saved to purchases collection');

      // ⭐ Save to user's purchases subcollection
      const userPurchRef = db.collection('user').doc(userId).collection('purchases').doc(reference);
      await userPurchRef.set(purchase, { merge: true });
      console.log('✓ Saved to user purchases subcollection');

      // ⭐ Add courseId to user's enrolledCourses array
      await db.collection('user').doc(userId).set(
        { 
          enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId),
          updatedAt: admin.firestore.Timestamp.now()
        }, 
        { merge: true }
      );
      console.log('✓ Added to enrolledCourses array');

      // ⭐ Increment course enrolledCount
      try {
        const courseRef = db.collection('courses').doc(courseId);
        await courseRef.update({
          enrolledCount: admin.firestore.FieldValue.increment(1)
        });
        console.log('✓ Incremented course enrolledCount');
      } catch (err) {
        console.warn('Could not update enrolledCount:', err.message);
      }

      console.log('✅ Purchase recorded successfully:', reference);

      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          success: true, 
          reference,
          studentName,
          courseTitle
        }) 
      };
    }

    // Handle other events
    console.log('Unhandled event type:', eventType);
    return { statusCode: 200, body: 'ok' };

  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
};
