
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps.length) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    admin.initializeApp({ projectId: 'life-clinic-management-s-a2493' });
  } else {
    admin.initializeApp({ projectId: 'demo-project' });
  }
}

const db = getFirestore();

async function check() {
  // 1. Find Judd Trump in staffData
  const email = 'doctor1@gmail.com';
  console.log(`Searching for doctor with email: ${email}`);
  
  // Try case-sensitive first (as in seed script)
  let userSnapshot = await db.collection('staffData').where('email', '==', email).get();
  if (userSnapshot.empty) {
      console.log('  Not found (exact case). Trying lowercase...');
      userSnapshot = await db.collection('staffData').where('email', '==', email.toLowerCase()).get();
  }

  if (userSnapshot.empty) {
      console.log('  ❌ Doctor NOT found in staffData!');
      return;
  }

  const userDoc = userSnapshot.docs[0];
  const uid = userDoc.id;
  const userData = userDoc.data();
  console.log(`  ✅ Found Doctor: ${userData.fullName} (UID: ${uid})`);

  // 2. Count appointments for this UID
  const apptSnapshot = await db.collection('appointments').where('doctorId', '==', uid).get();
  console.log(`  Found ${apptSnapshot.size} total appointments for this doctor.`);

  // 3. Check for Today's Appointments
  // Today is 2026-02-06
  const today = new Date('2026-02-06T00:00:00');
  const tomorrow = new Date('2026-02-07T00:00:00');
  
  let todayCount = 0;
  apptSnapshot.forEach(doc => {
      const data = doc.data();
      const date = data.date.toDate();
      if (date >= today && date < tomorrow) {
          todayCount++;
      }
  });
  
  console.log(`  Found ${todayCount} appointments for TODAY (2026-02-06).`);
}

check();
