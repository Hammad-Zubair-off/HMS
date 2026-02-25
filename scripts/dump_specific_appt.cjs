
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
  const docId = '2QEm67lxXR5M2J7q8G1w';
  const docRef = db.collection('appointments').doc(docId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    console.log(`Document ${docId} does not exist.`);
    return;
  }
  
  console.log('--- Document ID:', doc.id, '---');
  console.log(JSON.stringify(doc.data(), null, 2));
}

dump();
