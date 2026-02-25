import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

// 1. Static Medicines Data
export const medicinesData = [
  { name: 'Amoxicillin', category: 'Antibiotic', strength: '500mg', form: 'Capsule', stock: 100, unitPrice: 15 },
  { name: 'Paracetamol', category: 'Analgesic', strength: '650mg', form: 'Tablet', stock: 500, unitPrice: 5 },
  { name: 'Ibuprofen', category: 'Painkiller', strength: '400mg', form: 'Tablet', stock: 200, unitPrice: 8 },
  { name: 'Cetirizine', category: 'Antihistamine', strength: '10mg', form: 'Tablet', stock: 300, unitPrice: 10 },
  { name: 'Omeprazole', category: 'Antacid', strength: '20mg', form: 'Capsule', stock: 150, unitPrice: 12 },
  { name: 'Metformin', category: 'Antidiabetic', strength: '500mg', form: 'Tablet', stock: 250, unitPrice: 7 },
  { name: 'Amlodipine', category: 'Antihypertensive', strength: '5mg', form: 'Tablet', stock: 200, unitPrice: 6 },
  { name: 'Azithromycin', category: 'Antibiotic', strength: '500mg', form: 'Tablet', stock: 100, unitPrice: 25 },
  { name: 'Pantoprazole', category: 'Antacid', strength: '40mg', form: 'Tablet', stock: 200, unitPrice: 9 },
  { name: 'Vitamin D3', category: 'Supplement', strength: '60k IU', form: 'Sachet', stock: 100, unitPrice: 40 }
]

// 2. Static Appointments Data (Past & Future)
// Note: We use ISO strings for dates to ensure compatibility
const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

export const appointmentsData = [
  {
    patientName: 'Rahul Sharma',
    patientPhone: '9876543210',
    patientEmail: 'rahul@example.com',
    patientAge: '32',
    patientGender: 'Male',
    doctorName: 'Dr. Sarah Wilson', // Replace with dynamic doctor if needed
    appointmentDate: today,
    appointmentTime: '10:00',
    appointmentType: 'consultation',
    status: 'scheduled',
    tokenNumber: 101,
    symptoms: 'Fever, cough, and headache for 2 days',
    notes: 'Patient prefers morning, allergic to penicillin'
  },
  {
    patientName: 'Priya Patel',
    patientPhone: '9876543211',
    patientEmail: 'priya@example.com',
    patientAge: '28',
    patientGender: 'Female',
    doctorName: 'Dr. Sarah Wilson',
    appointmentDate: today,
    appointmentTime: '10:30',
    appointmentType: 'checkup',
    status: 'in_progress',
    tokenNumber: 102,
    symptoms: 'Routine checkup, blood pressure monitoring',
    notes: 'Follow up from last month'
  },
  {
    patientName: 'Amit Kumar',
    patientPhone: '9876543212',
    patientEmail: 'amit@example.com',
    patientAge: '45',
    patientGender: 'Male',
    doctorName: 'Dr. Sarah Wilson',
    appointmentDate: today,
    appointmentTime: '11:00',
    appointmentType: 'consultation',
    status: 'completed',
    tokenNumber: 103,
    symptoms: 'Back pain and stiffness',
    notes: 'Recommended X-ray'
  },
  {
    patientName: 'Sneha Gupta',
    patientPhone: '9876543213',
    patientEmail: 'sneha@example.com',
    patientAge: '24',
    patientGender: 'Female',
    doctorName: 'Dr. Sarah Wilson',
    appointmentDate: tomorrow,
    appointmentTime: '09:00',
    appointmentType: 'consultation',
    status: 'scheduled',
    tokenNumber: 201,
    symptoms: 'Migraine and nausea',
    notes: 'First visit'
  },
  {
    patientName: 'Vikram Singh',
    patientPhone: '9876543214',
    patientEmail: 'vikram@example.com',
    patientAge: '55',
    patientGender: 'Male',
    doctorName: 'Dr. Sarah Wilson',
    appointmentDate: yesterday,
    appointmentTime: '14:00',
    appointmentType: 'followup',
    status: 'completed',
    tokenNumber: 55,
    symptoms: 'Diabetes management',
    notes: 'Sugar levels stable'
  }
]

// 3. Static Invoices Data
export const invoicesData = [
  {
    invoiceNumber: `INV-${Date.now()}-001`,
    patientName: 'Amit Kumar',
    patientPhone: '9876543212',
    patientEmail: 'amit@example.com',
    patientAddress: '12 Health Ave, MediCity',
    invoiceDate: today,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    items: [
      { description: 'Consultation Fee', quantity: 1, unitPrice: 500, amount: 500 },
      { description: 'X-Ray (Lumbar Spine)', quantity: 1, unitPrice: 800, amount: 800 }
    ],
    subtotal: 1300,
    taxRate: 18,
    taxAmount: 234,
    discount: 0,
    totalAmount: 1534,
    status: 'paid',
    paymentMethod: 'card',
    notes: 'Paid in full at reception'
  },
  {
    invoiceNumber: `INV-${Date.now()}-002`,
    patientName: 'Priya Patel',
    patientPhone: '9876543211',
    patientEmail: 'priya@example.com',
    patientAddress: '42 Wellness Rd, MediCity',
    invoiceDate: today,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    items: [
      { description: 'General Checkup', quantity: 1, unitPrice: 300, amount: 300 },
      { description: 'Blood Pressure Monitor', quantity: 1, unitPrice: 0, amount: 0 }
    ],
    subtotal: 300,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    totalAmount: 300,
    status: 'pending',
    paymentMethod: null,
    notes: 'Payment pending'
  }
]

// Function to seed the database
export const seedDatabase = async () => {
  const batch = writeBatch(db)
  let operationCount = 0

  console.log('🌱 Starting database seed...')

  // 1. Seed Medicines
  medicinesData.forEach(medicine => {
    const docRef = doc(collection(db, 'medicines'))
    batch.set(docRef, { ...medicine, createdAt: serverTimestamp() })
    operationCount++
  })

  // 2. Seed Appointments
  appointmentsData.forEach(appointment => {
    const docRef = doc(collection(db, 'appointments'))
    batch.set(docRef, { ...appointment, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    operationCount++
  })

  // 3. Seed Invoices
  invoicesData.forEach(invoice => {
    const docRef = doc(collection(db, 'invoices'))
    batch.set(docRef, { ...invoice, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    operationCount++
  })

  // Note: We are skipping Prescriptions because they usually require linking to specific Appointment/Patient IDs generated above.
  // In a real seed, we'd capture the IDs first. For simplicity, we just seed the independent collections.

  try {
    await batch.commit()
    console.log(`✅ Database seeded successfully with ${operationCount} documents!`)
    return { success: true, count: operationCount }
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    return { success: false, error }
  }
}
