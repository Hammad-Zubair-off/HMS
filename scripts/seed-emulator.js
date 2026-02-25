
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, doc, writeBatch, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDY3jg8FWjpoZeq5wrlTO60S-4orEpUuJs",
  authDomain: "life-clinic-management-s-a2493.firebaseapp.com",
  projectId: "life-clinic-management-s-a2493",
  storageBucket: "life-clinic-management-s-a2493.firebasestorage.app",
  messagingSenderId: "631263753154",
  appId: "1:631263753154:web:540b8f99ebd69ffbab1c5b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

connectFirestoreEmulator(db, '127.0.0.1', 8080);
connectAuthEmulator(auth, 'http://127.0.0.1:9099');

// --- HELPERS ---
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];

async function getUserUid(email) {
  try {
    // Try exact match first
    let q = query(collection(db, 'staffData'), where('email', '==', email));
    let snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data();

    // Try lowercase
    q = query(collection(db, 'staffData'), where('email', '==', email.toLowerCase()));
    snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data();

    return null;
  } catch (e) {
    return null;
  }
}

// --- DATA CONTENT ---
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const symptomsList = ['Fever', 'Cough', 'Headache', 'Back pain', 'Stomach ache', 'Fatigue', 'Dizziness', 'Nausea', 'Sore throat', 'Joint pain', 'Skin rash', 'Anxiety', 'Insomnia', 'Chest pain', 'Allergy'];
const medicineNames = ['Amoxicillin', 'Ibuprofen', 'Paracetamol', 'Cetirizine', 'Omeprazole', 'Metformin', 'Amlodipine', 'Simvastatin', 'Losartan', 'Azithromycin', 'Gabapentin', 'Hydrochlorothiazide', 'Sertraline', 'Montelukast', 'Fluticasone'];

const generatePatients = (count) => {
    return Array.from({ length: count }, (_, i) => ({
        name: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
        phone: `03${getRandomInt(10, 99)}${getRandomInt(1000000, 9999999)}`,
        email: `patient${i + 1}@example.com`,
        age: getRandomInt(18, 85).toString(),
        gender: getRandomElement(['Male', 'Female']),
        address: `${getRandomInt(1, 999)} ${getRandomElement(['Maple', 'Oak', 'Pine', 'Cedar', 'Elm'])} St, City`
    }));
};

const generateMedicines = (count) => {
    return Array.from({ length: count }, (_, i) => ({
        name: medicineNames[i % medicineNames.length] + (i > 14 ? ` ${i}` : ''),
        category: getRandomElement(['Antibiotic', 'Painkiller', 'Antihistamine', 'Antacid', 'Supplement']),
        strength: `${getRandomInt(10, 500)}mg`,
        form: getRandomElement(['Tablet', 'Capsule', 'Syrup', 'Injection']),
        stock: getRandomInt(50, 1000),
        unitPrice: getRandomInt(5, 100)
    }));
};

const seed = async () => {
    console.log('🌱 Generating 15+ records per entity...');
    
    // 1. Get Accounts
    const doctor = await getUserUid('doctor1@gmail.com');
    const receptionist = await getUserUid('receptionist1@gmail.com');
    
    if (!doctor) console.warn('⚠️ doctor1@gmail.com not found. Using placeholder.');
    const docId = doctor ? doctor.uid : 'placeholder_doc';
    const docName = doctor ? doctor.fullName : 'Dr. Placeholder';

    const batch = writeBatch(db);
    let total = 0;

    // 2. Generate 15 Medicines
    const medicines = generateMedicines(15);
    medicines.forEach(m => {
        batch.set(doc(collection(db, 'medicines')), { ...m, createdAt: serverTimestamp() });
        total++;
    });

    // 3. Generate 15 Patients & Appointments
    const patients = generatePatients(15);
    const today = new Date();
    
    patients.forEach((p, i) => {
        // Appointments
        const aptStatus = getRandomElement(['scheduled', 'in_progress', 'completed', 'token_generated']);
        const aptDate = getRandomDate(new Date(today.getTime() - 7 * 86400000), new Date(today.getTime() + 7 * 86400000));
        
        const aptRef = doc(collection(db, 'appointments'));
        batch.set(aptRef, {
            patientName: p.name,
            patientPhone: p.phone,
            patientEmail: p.email,
            patientAge: p.age,
            patientGender: p.gender,
            doctorName: docName,
            doctorId: docId, // Correctly linking to doctor1@gmail.com
            appointmentDate: aptDate,
            appointmentTime: `${getRandomInt(8, 16)}:${getRandomElement(['00', '15', '30', '45'])}`,
            appointmentType: getRandomElement(['consultation', 'checkup', 'emergency']),
            status: aptStatus,
            tokenNumber: 100 + i,
            symptoms: getRandomElement(symptomsList),
            notes: 'Generated via seed script',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        total++;

        // 4. Generate 15 Invoices (linked to patients)
        const invRef = doc(collection(db, 'invoices'));
        const amount = getRandomInt(500, 5000);
        batch.set(invRef, {
            invoiceNumber: `INV-${Date.now()}-${i}`,
            patientId: aptRef.id, // Soft link
            patientName: p.name,
            patientPhone: p.phone,
            invoiceDate: aptDate,
            dueDate: aptDate,
            items: [
                { description: 'Consultation', quantity: 1, unitPrice: 500, amount: 500 },
                { description: 'Medicines', quantity: 1, unitPrice: amount - 500, amount: amount - 500 }
            ],
            subtotal: amount,
            taxRate: 0,
            taxAmount: 0,
            discount: 0,
            totalAmount: amount,
            status: getRandomElement(['paid', 'pending']),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        total++;

        // 5. Generate 15 Prescriptions (if status is completed or in_progress)
        if (['completed', 'in_progress'].includes(aptStatus)) {
            const presRef = doc(collection(db, 'prescriptions'));
            batch.set(presRef, {
                patientId: aptRef.id,
                patientName: p.name,
                patientAge: p.age,
                patientGender: p.gender,
                patientPhone: p.phone,
                doctorId: docId,
                doctorName: docName,
                prescriptionDate: aptDate,
                diagnosis: 'General Diagnosis',
                symptoms: getRandomElement(symptomsList),
                medicines: [
                    { name: getRandomElement(medicineNames), dosage: '1-0-1', duration: '5 days', timing: 'after_meal' }
                ],
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            total++;
        }
    });

    await batch.commit();
    console.log(`✅ Huge Seed Complete! Added ${total} documents linked to ${docName}.`);
    process.exit(0);
};

seed().catch(console.error);
