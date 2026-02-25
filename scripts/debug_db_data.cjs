
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (Emulator)
if (!admin.apps.length) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    admin.initializeApp({ projectId: 'life-clinic-management-s-a2493' });
  } else {
    admin.initializeApp({ projectId: 'demo-project' });
  }
}

const db = getFirestore();

async function debugData() {
  console.log('--- DEBUGGING DATA STATE ---');

  // 1. Check Staff Data (Users)
  console.log('\n1. Staff Data (Users):');
  const staffSnapshot = await db.collection('staffData').get();
  if (staffSnapshot.empty) {
    console.log('   No staff data found.');
  } else {
    staffSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - UID: ${doc.id}`);
      console.log(`     Name: ${data.fullName || data.name}`);
      console.log(`     Email: ${data.email}`);
      console.log(`     Role: ${data.role}`);
    });
  }

  // 2. Check Appointments Summary
  console.log('\n2. Appointments Summary:');
  const apptSnapshot = await db.collection('appointments').get();
  console.log(`   Total Appointments: ${apptSnapshot.size}`);

  const doctorCounts = {};
  let missingDoctorId = 0;
  let sampleDoc = null;

  apptSnapshot.forEach(doc => {
    const data = doc.data();
    if (!sampleDoc) sampleDoc = { id: doc.id, ...data }; // Inspect first doc

    if (data.doctorId) {
      doctorCounts[data.doctorId] = (doctorCounts[data.doctorId] || 0) + 1;
    } else {
      missingDoctorId++;
    }
  });

  console.log('   Appointments per DoctorID:');
  for (const [uid, count] of Object.entries(doctorCounts)) {
    console.log(`     - DoctorID ${uid}: ${count} records`);
  }
  
  if (missingDoctorId > 0) {
    console.log(`     - Records with MISSING doctorId: ${missingDoctorId}`);
  }

  if (sampleDoc) {
      console.log('\n3. Sample Appointment Document:');
      console.log(JSON.stringify(sampleDoc, null, 2));
  }
}

debugData();
