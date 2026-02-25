
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps.length) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    admin.initializeApp({ projectId: 'demo-project' });
  } else {
    admin.initializeApp({ projectId: 'demo-project' });
  }
}

const db = getFirestore();

async function verify() {
  console.log('Verifying Seed Data...');
  
  const collections = ['users', 'patients', 'medicines', 'appointments', 'prescriptions', 'invoices'];
  
  for (const col of collections) {
    const snapshot = await db.collection(col).count().get();
    console.log(`${col}: ${snapshot.data().count} records`);
  }
}

verify();
