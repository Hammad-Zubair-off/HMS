
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

async function dump() {
  const snapshot = await db.collection('appointments').limit(1).get();
  if (snapshot.empty) {
    console.log('No appointments found.');
    return;
  }
  const doc = snapshot.docs[0];
  console.log('--- Document ID:', doc.id, '---');
  console.log(JSON.stringify(doc.data(), null, 2));
}

dump();
