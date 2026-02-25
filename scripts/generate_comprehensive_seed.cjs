
const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
// const serviceAccount = require('../../service-account-key.json'); // Adjust path if needed

// Initialize Firebase Admin
if (!admin.apps.length) {
  // If running against emulator, we don't need credentials
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    admin.initializeApp({ projectId: 'life-clinic-management-s-a2493' });
  } else {
    // Fallback or real project config if needed
    try {
        const serviceAccount = require('../../service-account-key.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.warn("No service account found, initializing with default credentials (likely for emulator/default env)");
        admin.initializeApp({ projectId: 'demo-project' });
    }
  }
}

const db = getFirestore();

// --- Configuration ---
const DOCTORS = [
  { email: 'doctor1@gmail.com', name: 'Doctor 1' },
  { email: 'doctor2@gmail.com', name: 'Doctor 2' }
];

const RECEPTIONISTS = [
  { email: 'receptionist1@gmail.com', name: 'Receptionist 1' },
  { email: 'receptionist2@gmail.com', name: 'Receptionist 2' }
];

const RECORDS_PER_USER = 20;

// Shared Data Pools
let sharedPatients = [];
let sharedMedicines = [];

// --- Helper Functions ---

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Helper to get today's date at specific hours
const getTodayAt = (hour) => {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d;
};

// --- Generators ---

async function fetchInternalUsers() {
  console.log('Fetching Existing Users from staffData...');
  // Based on user screenshot, users are in 'staffData' collection
  const usersRef = db.collection('staffData'); 

  // Process Doctors
  for (const doc of DOCTORS) {
    // Note: Database field is likely 'email' based on screenshot
    const userSnapshot = await usersRef.where('email', '==', doc.email.toLowerCase()).get();
    
    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      doc.uid = userDoc.id;
      console.log(`Found Doctor: ${doc.name} (ID: ${doc.uid})`);
    } else {
        // Fallback: Try fetching by case-insensitive matching if needed, or check 'users' collection as backup
        // For now, assuming exact match or simple lowercase
         const userSnapshotBackup = await usersRef.where('email', '==', doc.email).get();
         if (!userSnapshotBackup.empty) {
            const userDoc = userSnapshotBackup.docs[0];
            doc.uid = userDoc.id;
            console.log(`Found Doctor (exact case): ${doc.name} (ID: ${doc.uid})`);
         } else {
             console.warn(`⚠️ Doctor not found: ${doc.email}. Data generation for this user will be skipped.`);
         }
    }
  }

  // Process Receptionists
  for (const rec of RECEPTIONISTS) {
    const userSnapshot = await usersRef.where('email', '==', rec.email.toLowerCase()).get();

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      rec.uid = userDoc.id;
      console.log(`Found Receptionist: ${rec.name} (ID: ${rec.uid})`);
    } else {
         const userSnapshotBackup = await usersRef.where('email', '==', rec.email).get();
         if (!userSnapshotBackup.empty) {
            const userDoc = userSnapshotBackup.docs[0];
            rec.uid = userDoc.id;
            console.log(`Found Receptionist (exact case): ${rec.name} (ID: ${rec.uid})`);
         } else {
            console.warn(`⚠️ Receptionist not found: ${rec.email}. Data generation for this user will be skipped.`);
         }
    }
  }
}

async function createPatients() {
  console.log('Generating Patients...');
  const patientsRef = db.collection('patients');
  const patientNames = [
    'John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Charlie Davis', 'Diana Evans', 'Frank Green', 
    'Grace Hill', 'Henry Irwin', 'Ivy Jones', 'Jack King', 'Liam Lewis', 'Mia Martin', 'Noah Nelson', 
    'Olivia Owens', 'Peter Parker', 'Quinn Roberts', 'Rachel Scott', 'Sam Taylor', 'Tina Turner',
    'Ursula Underwood', 'Victor Vance', 'Wendy White', 'Xander Xavier', 'Yara Young', 'Zachary Zane',
    'Abigail Adams', 'Benjamin Baker', 'Chloe Clark', 'Daniel Day' 
  ]; // Add more if needed

  sharedPatients = [];

  for (let i = 0; i < 45; i++) { // Generate 45 patients
    const name = getRandomItem(patientNames) + ` ${i}`;
    const patientData = {
      fullName: name,
      age: getRandomInt(18, 90),
      gender: getRandomItem(['Male', 'Female']),
      bloodGroup: getRandomItem(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
      contactNumber: `555-01${getRandomInt(10, 99)}`,
      email: `patient${i}@example.com`,
      address: `${getRandomInt(1, 999)} Main St`,
      createdAt: Timestamp.now(),
      status: 'Active'
    };
    
    const docRef = await patientsRef.add(patientData);
    sharedPatients.push({ id: docRef.id, ...patientData });
  }
  console.log(`Created ${sharedPatients.length} patients.`);
}

async function createMedicines() {
  console.log('Generating Medicines...');
  const medicinesRef = db.collection('medicines');
  const medNames = ['Amoxicillin', 'Ibuprofen', 'Paracetamol', 'Metformin', 'Amlodipine', 'Omeprazole', 'Simvastatin', 'Lisinopril', 'Levothyroxine', 'Azithromycin'];
  
  sharedMedicines = [];

  for (let i = 0; i < 20; i++) {
    const name = getRandomItem(medNames) + ` ${String.fromCharCode(65 + i)}`; // Unique-ish names
    const medData = {
      name: name,
      genericName: name.split(' ')[0],
      category: getRandomItem(['Antibiotic', 'Painkiller', 'Cardiovascular', 'Antidiabetic']),
      strength: `${getRandomInt(10, 500)}mg`,
      type: getRandomItem(['Tablet', 'Capsule', 'Syrup']),
      manufacturer: 'Generic Pharma Inc.',
      price: getRandomInt(5, 50),
      stockQuantity: getRandomInt(50, 500),
      expiryDate: Timestamp.fromDate(getRandomDate(new Date(), new Date('2028-01-01'))),
      createdAt: Timestamp.now()
    };

    const docRef = await medicinesRef.add(medData);
    sharedMedicines.push({ id: docRef.id, ...medData });
  }
  console.log(`Created ${sharedMedicines.length} medicines.`);
}

async function createAppointments() {
  console.log('Generating Appointments...');
  const apptRef = db.collection('appointments');

  for (const doctor of DOCTORS) {
    if (!doctor.uid) continue;

    const appointmentsToday = 10; // Ensure 10 for today
    const appointmentsOther = 10; // 10 for past/future

    // 1. Generate TODAY'S Appointments
    for (let i = 0; i < appointmentsToday; i++) {
        const patient = getRandomItem(sharedPatients);
        const date = getTodayAt(9 + i); // 9 AM to 6 PM
        const status = getRandomItem(['Scheduled', 'Confirmed', 'Completed', 'In Progress']);
         
        const apptData = {
            doctorId: doctor.uid,
            doctorName: doctor.name,
            patientId: patient.id,
            patientName: patient.fullName,
            date: Timestamp.fromDate(date),
            timeSlot: `${9 + i}:00`,
            status: status,
            type: getRandomItem(['Consultation', 'Checkup']),
            reason: 'Today visit',
            notes: 'Generated for today',
            createdAt: Timestamp.now(),
            tokenNumber: i + 1,
            tokenStatus: status === 'In Progress' ? 'Active' : (status === 'Completed' ? 'Completed' : 'Pending')
        };
        await apptRef.add(apptData);
    }

    // 2. Generate Past/Future Appointments
    for (let i = 0; i < appointmentsOther; i++) {
      const patient = getRandomItem(sharedPatients);
      const isPast = Math.random() > 0.5;
      const date = isPast 
        ? getRandomDate(new Date('2025-01-01'), new Date()) 
        : getRandomDate(new Date(), new Date('2026-12-31')); 
      
      const status = isPast ? 'Completed' : 'Scheduled';

      const apptData = {
        doctorId: doctor.uid,
        doctorName: doctor.name,
        patientId: patient.id,
        patientName: patient.fullName,
        date: Timestamp.fromDate(date),
        timeSlot: `${getRandomInt(9, 16)}:00`,
        status: status,
        type: getRandomItem(['Consultation', 'Follow-up']),
        reason: isPast ? 'Routine Checkup' : 'Future Visit',
        notes: 'Generated by seed script',
        createdAt: Timestamp.now()
      };
      await apptRef.add(apptData);
    }
    console.log(`Created ${appointmentsToday + appointmentsOther} appointments for ${doctor.name}`);
  }
}

async function createPrescriptions() {
  console.log('Generating Prescriptions...');
  const presRef = db.collection('prescriptions');

  for (const doctor of DOCTORS) {
    if (!doctor.uid) continue;

    // Generate prescriptions mostly for "Today" to show in "Today's Prescriptions" if that's the view
    // But logically prescriptions are for COMPLETED appointments. 
    // We'll generate 20 prescriptions, 10 for today.
    
    const prescriptionsToday = 10;
    const prescriptionsOther = 10;

    for (let i = 0; i < prescriptionsToday + prescriptionsOther; i++) {
       const patient = getRandomItem(sharedPatients);
       const med1 = getRandomItem(sharedMedicines);
       const isToday = i < prescriptionsToday; 
       
       const date = isToday ? new Date() : getRandomDate(new Date('2025-01-01'), new Date());

       const presData = {
         doctorId: doctor.uid,
         doctorName: doctor.name,
         patientId: patient.id,
         patientName: patient.fullName,
         date: Timestamp.fromDate(date),
         diagnosis: isToday ? 'Acute Condition' : 'Chronic Condition',
         vitals: {
           bloodPressure: '120/80',
           temperature: '98.6',
           pulse: '72',
           weight: '70'
         },
         medicines: [
           { 
             medicineId: med1.id, 
             name: med1.name, 
             dosage: '1-0-1', 
             duration: '5 days', 
             instructions: 'After food' 
           }
         ],
         advice: 'Rest well.',
         createdAt: Timestamp.now()
       };

       await presRef.add(presData);
    }
    console.log(`Created ${prescriptionsToday + prescriptionsOther} prescriptions for ${doctor.name}`);
  }
}

async function createInvoices() {
   console.log('Generating Invoices...');
   const invRef = db.collection('invoices');

   for (const rec of RECEPTIONISTS) {
     if (!rec.uid) continue;

     for (let i = 0; i < RECORDS_PER_USER; i++) {
        const patient = getRandomItem(sharedPatients);
        const doctor = getRandomItem(DOCTORS);
        const isPaid = Math.random() > 0.2;
        const total = getRandomInt(50, 200);

        const invData = {
          receptionistId: rec.uid,
          generatedByName: rec.name,
          patientId: patient.id,
          patientName: patient.fullName,
          doctorId: doctor.uid, // Linking to a random doctor for context
          doctorName: doctor.name,
          date: Timestamp.fromDate(getRandomDate(new Date('2025-01-01'), new Date())),
          dueDate: Timestamp.fromDate(getRandomDate(new Date(), new Date('2025-12-31'))),
          status: isPaid ? 'Paid' : 'Pending',
          totalAmount: total,
          items: [
            { description: 'Consultation Fee', quantity: 1, unitPrice: total, total: total }
          ],
          createdAt: Timestamp.now()
        };

        if (isPaid) {
          invData.paymentDate = Timestamp.now();
          invData.paymentMethod = getRandomItem(['Cash', 'Card', 'Online']);
        }

        await invRef.add(invData);
     }
     console.log(`Created ${RECORDS_PER_USER} invoices for ${rec.name}`);
   }
}

async function main() {
  try {
    console.log('Starting Seed Process...');
    await fetchInternalUsers();
    await createPatients();
    await createMedicines();
    await createAppointments();
    await createPrescriptions();
    await createInvoices();
    console.log('Seed Process Completed Successfully!');
  } catch (error) {
    console.error('Seed Process Failed:', error);
  }
}

// Helper to get server timestamp
function serverTimestamp() {
    return Timestamp.now();
}

main();
