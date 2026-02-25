
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps.length) {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
        admin.initializeApp({ projectId: 'demo-project' });
    }
}

const db = getFirestore();

async function inspectUsers() {
    console.log('Inspecting staffData collection...');
    const snapshot = await db.collection('staffData').get();
    
    if (snapshot.empty) {
        console.log('staffData collection is EMPTY.');
        return;
    }

    console.log(`Found ${snapshot.size} documents in staffData:`);
    snapshot.forEach(doc => {
        console.log(`ID: ${doc.id}, Data:`, doc.data());
    });
}

inspectUsers();
