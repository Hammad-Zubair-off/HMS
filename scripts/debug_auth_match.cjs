
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps.length) {
  // Use 'demo-project' or the specific one. The previous check used the specific one.
  const projectId = 'life-clinic-management-s-a2493'; 
  admin.initializeApp({ projectId });
}

const db = getFirestore();
const auth = admin.auth();

async function check() {
  const email = 'doctor1@gmail.com'; // Use exact case from seed
  console.log(`Checking match for: ${email}`);

  // 1. Get Auth UID
  let authUid = null;
  try {
    const userRecord = await auth.getUserByEmail(email);
    authUid = userRecord.uid;
    console.log(`✅ Auth User Found: UID = ${authUid}`);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
        console.log(`❌ Auth User NOT found for email: ${email}`);
        // Try lowercase
        try {
             const userRecord = await auth.getUserByEmail(email.toLowerCase());
             authUid = userRecord.uid;
             console.log(`✅ Auth User Found (lowercase): UID = ${authUid}`);
        } catch (e2) {
             console.log(`❌ Auth User NOT found for lowercase email either.`);
        }
    } else {
        console.error('Error fetching auth user:', e);
    }
  }

  // 2. Get StaffData ID
  // Note: Using the method that worked in debug_judd_trump.cjs
  let staffUid = null;
  let staffSnapshot = await db.collection('staffData').where('email', '==', email).get();
  if (staffSnapshot.empty) {
      staffSnapshot = await db.collection('staffData').where('email', '==', email.toLowerCase()).get();
  }
  
  if (!staffSnapshot.empty) {
      const doc = staffSnapshot.docs[0];
      staffUid = doc.id;
      console.log(`✅ StaffData Doc Found: ID = ${staffUid}`);
  } else {
      console.log(`❌ StaffData Doc NOT found.`);
  }

  // 3. Compare
  if (authUid && staffUid) {
      if (authUid === staffUid) {
          console.log('MATCH: ✅ Auth UID matches StaffData ID.');
      } else {
          console.log('MISMATCH: ❌ Auth UID does NOT match StaffData ID.');
          console.log(`   Auth:  ${authUid}`);
          console.log(`   Staff: ${staffUid}`);
      }
  }
}

check();
