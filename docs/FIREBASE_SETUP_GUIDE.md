# Doctoury Clinic Management System - Firebase Setup Guide

Complete guide to create and configure the Firebase backend for this project from scratch.

---

## Table of Contents

1. [Create Firebase Project](#1-create-firebase-project)
2. [Enable Authentication](#2-enable-authentication)
3. [Create Firestore Database](#3-create-firestore-database)
4. [Get Firebase Config Keys](#4-get-firebase-config-keys)
5. [Configure the Project](#5-configure-the-project)
6. [Database Schema Reference](#6-database-schema-reference)
7. [Firestore Security Rules](#7-firestore-security-rules)
8. [Seed Initial Data](#8-seed-initial-data)
9. [Local Emulator Setup (Optional)](#9-local-emulator-setup-optional)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or "Add project")
3. Enter your project name (e.g. `clinic-management-system`)
4. Disable Google Analytics (not needed) or enable it if you want
5. Click **"Create project"** and wait for it to finish
6. Click **"Continue"** to enter the project dashboard

### Register a Web App

1. On the project dashboard, click the **Web icon** (`</>`)
2. Enter an app nickname (e.g. `clinic-web-app`)
3. Skip Firebase Hosting for now
4. Click **"Register app"**
5. You will see a `firebaseConfig` object - **copy it and save it**, you will need it in [Step 4](#4-get-firebase-config-keys)

---

## 2. Enable Authentication

1. In the Firebase Console sidebar, go to **Build > Authentication**
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable **Email/Password** provider:
   - Click "Email/Password"
   - Toggle the first switch **ON** (Email/Password)
   - Leave "Email link" OFF
   - Click **Save**

### Create Staff Accounts

You need to manually create the initial user accounts:

1. Go to **Authentication > Users** tab
2. Click **"Add user"**
3. Create these accounts (or your own):

| Email | Password | Role (for Firestore) |
|-------|----------|----------------------|
| `doctor1@gmail.com` | `your-password` | doctor |
| `doctor2@gmail.com` | `your-password` | doctor |
| `receptionist1@gmail.com` | `your-password` | receptionist |
| `receptionist2@gmail.com` | `your-password` | receptionist |

4. After creating each user, **copy their UID** from the Users table - you will need it for the `staffData` collection

---

## 3. Create Firestore Database

1. In the Firebase Console sidebar, go to **Build > Firestore Database**
2. Click **"Create database"**
3. Choose a Firestore location closest to your users (e.g. `asia-south1` for India)
4. Select **"Start in test mode"** (we will add proper rules later)
5. Click **"Create"**

### Create Collections Manually

You need to create **7 collections**. In the Firestore console, click **"Start collection"** for each one:

#### Collection: `staffData`

This is the most critical collection. Each document ID **must match** the Firebase Auth UID of that user.

Click **"Start collection"** > Collection ID: `staffData`

For each user you created in Authentication, add a document:

- **Document ID**: Paste the user's UID from Authentication (e.g. `fPu3Bg831WfbnSqJKyhH0PtSfUr8`)
- Fields:

| Field | Type | Value |
|-------|------|-------|
| `uid` | string | Same as document ID (the Auth UID) |
| `email` | string | `doctor1@gmail.com` |
| `fullName` | string | `Dr. Ahmed Khan` |
| `role` | string | `doctor` or `receptionist` |
| `emailVerified` | boolean | `true` |
| `createdAt` | string | `2026-01-01T00:00:00.000Z` |

Repeat for every staff user. The `role` field **must** be exactly `doctor` or `receptionist` (lowercase).

#### Remaining Collections

For the other 6 collections, you only need to create the collection name. Documents will be added by the app at runtime.

Click **"Start collection"** for each and add one dummy document (Firestore requires at least one document to create a collection). You can delete the dummy document after.

| Collection ID | Purpose |
|---------------|---------|
| `patients` | Patient records |
| `appointments` | Appointment scheduling and tokens |
| `prescriptions` | Doctor prescriptions |
| `medicines` | Medicine inventory |
| `invoices` | Billing invoices |
| `payments` | Payment transaction records |

---

## 4. Get Firebase Config Keys

If you did not save the config from Step 1, go to:

1. Firebase Console > **Project Settings** (gear icon at top-left)
2. Scroll down to **"Your apps"** section
3. Under the Web app, find the `firebaseConfig` object

It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## 5. Configure the Project

### Option A: Direct Config (Quick Setup)

Edit `src/firebase/config.js` and replace the `firebaseConfig` object with your own values:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect emulators when running locally (optional)
if (location.hostname === "localhost") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export default app;
```

### Option B: Environment Variables (Recommended for production)

1. Create a `.env` file in the project root (copy from `env.example.txt`):

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

2. Update `src/firebase/config.js` to use env vars:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

> **Note**: Never commit `.env` to Git. It is already in `.gitignore`.

---

## 6. Database Schema Reference

### Collection: `staffData`

Document ID = Firebase Auth UID

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uid` | string | Yes | Firebase Auth UID (same as document ID) |
| `email` | string | Yes | User email address |
| `fullName` | string | Yes | Display name (e.g. "Dr. Ahmed Khan") |
| `role` | string | Yes | `"doctor"` or `"receptionist"` |
| `emailVerified` | boolean | Yes | Whether email is verified |
| `createdAt` | string | Yes | ISO timestamp of account creation |
| `lastLogin` | string | No | ISO timestamp of last login |
| `specialization` | string | No | Doctor's specialization (e.g. "Cardiology") |

---

### Collection: `patients`

Document ID = Auto-generated

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | Yes | Patient full name |
| `phone` | string | Yes | Phone number |
| `email` | string | No | Email address |
| `dateOfBirth` | string | No | Date of birth (YYYY-MM-DD) |
| `gender` | string | No | "Male", "Female", or "Other" |
| `address` | string | No | Street address |
| `city` | string | No | City |
| `state` | string | No | State/Province |
| `zipCode` | string | No | ZIP/Postal code |
| `bloodGroup` | string | No | Blood group (e.g. "A+", "O-") |
| `allergies` | string | No | Known allergies |
| `medicalHistory` | string | No | Medical history notes |
| `medications` | string | No | Current medications |
| `emergencyContactName` | string | No | Emergency contact name |
| `emergencyContactPhone` | string | No | Emergency contact phone |
| `emergencyContactRelation` | string | No | Relationship to patient |
| `insuranceProvider` | string | No | Insurance company name |
| `insurancePolicyNumber` | string | No | Policy number |
| `notes` | string | No | Additional notes |
| `status` | string | No | "active" or "inactive" (default: "active") |
| `patientId` | string | No | Auto-generated display ID (e.g. "PAT-A1B2C3") |
| `createdAt` | string | Yes | ISO timestamp |
| `updatedAt` | string | No | ISO timestamp of last update |
| `createdBy` | string | No | UID of the user who created the record |

---

### Collection: `appointments`

Document ID = Auto-generated

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string | No | Reference to patients document ID |
| `patientName` | string | Yes | Patient name |
| `patientPhone` | string | Yes | Patient phone |
| `patientEmail` | string | Yes | Patient email |
| `patientAge` | string | No | Patient age |
| `patientGender` | string | No | Patient gender |
| `doctorId` | string | Yes | Firebase Auth UID of the assigned doctor |
| `doctorName` | string | Yes | Doctor display name |
| `appointmentDate` | string | Yes | Date string (YYYY-MM-DD) |
| `appointmentTime` | string | Yes | Time string (e.g. "11:00") |
| `appointmentType` | string | No | "consultation", "checkup", "emergency", "followup" |
| `status` | string | Yes | See status values below |
| `symptoms` | string | No | Patient symptoms description |
| `notes` | string | No | Additional notes |
| `medicalHistory` | string | No | Relevant medical history |
| `medications` | string | No | Current medications |
| `vitalSigns` | map | No | Nested object (see below) |
| `vitalSigns.bloodPressure` | string | No | e.g. "120/80" |
| `vitalSigns.heartRate` | string | No | e.g. "72 bpm" |
| `vitalSigns.temperature` | string | No | e.g. "98.6F" |
| `vitalSigns.weight` | string | No | e.g. "180 lbs" |
| `tokenNumber` | number | No | Assigned when token is generated |
| `tokenGeneratedAt` | string | No | ISO timestamp of token generation |
| `createdAt` | string | Yes | ISO timestamp |
| `updatedAt` | string | No | ISO timestamp of last update |
| `createdBy` | string | No | UID of the receptionist who created it |

**Appointment Status Values:**

| Status | Description |
|--------|-------------|
| `scheduled` | Newly created appointment |
| `token_generated` | Token assigned, patient is in queue |
| `in_progress` | Doctor is currently seeing this patient |
| `completed` | Appointment finished |
| `cancelled` | Appointment cancelled |
| `rescheduled` | Appointment rescheduled |

---

### Collection: `prescriptions`

Document ID = Auto-generated

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string | No | Reference to patients document ID |
| `patientName` | string | Yes | Patient name |
| `patientAge` | string | No | Patient age |
| `patientGender` | string | No | Patient gender |
| `patientPhone` | string | Yes | Patient phone |
| `patientEmail` | string | No | Patient email |
| `doctorId` | string | Yes | Firebase Auth UID of the doctor |
| `doctorName` | string | Yes | Doctor display name |
| `prescriptionDate` | string | Yes | Date string (YYYY-MM-DD) |
| `diagnosis` | string | Yes | Diagnosis description |
| `symptoms` | string | No | Symptoms description |
| `medicines` | array | Yes | Array of medicine objects (see below) |
| `instructions` | string | No | General instructions for the patient |
| `followUpDate` | string | No | Follow-up date (YYYY-MM-DD) |
| `status` | string | No | "active" or "inactive" (default: "active") |
| `notes` | string | No | Additional notes |
| `createdAt` | string | Yes | ISO timestamp |
| `updatedAt` | string | No | ISO timestamp of last update |

**Medicine Object (inside `medicines` array):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Reference to medicines document ID |
| `name` | string | Yes | Medicine name |
| `category` | string | Yes | Medicine category |
| `dosage` | string | Yes | Dosage amount (e.g. "500mg") |
| `frequency` | string | Yes | e.g. "3 times a day" |
| `duration` | string | Yes | e.g. "7 days" |
| `timing` | string | No | e.g. "After meals" |
| `specialInstructions` | string | No | Special instructions |

---

### Collection: `medicines`

Document ID = Auto-generated

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Medicine name |
| `category` | string | Yes | e.g. "Antibiotic", "Painkiller", "Cardiovascular" |
| `strength` | string | Yes | e.g. "500mg", "250mg" |
| `form` | string | Yes | "Tablet", "Capsule", "Syrup", "Injection" |
| `manufacturer` | string | Yes | Manufacturer name |
| `description` | string | No | Medicine description |
| `sideEffects` | string | No | Known side effects |
| `contraindications` | string | No | Contraindications |
| `dosageInstructions` | string | No | Default dosage instructions |
| `storageInstructions` | string | No | Storage requirements |
| `price` | number | No | Unit price |
| `stockQuantity` | number | No | Current stock count |
| `reorderLevel` | number | No | Minimum stock before reorder |
| `isActive` | boolean | No | Whether medicine is active (default: true) |
| `createdAt` | string | Yes | ISO timestamp |
| `updatedAt` | string | No | ISO timestamp of last update |
| `createdBy` | string | No | UID of the user who added it |

---

### Collection: `invoices`

Document ID = Auto-generated

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `invoiceNumber` | string | Yes | Auto-generated (e.g. "INV-1740000000000") |
| `patientId` | string | No | Reference to patients document ID |
| `patientName` | string | Yes | Patient name |
| `patientPhone` | string | Yes | Patient phone |
| `patientEmail` | string | Yes | Patient email |
| `patientAddress` | string | No | Patient address |
| `invoiceDate` | string | Yes | Date string (YYYY-MM-DD) |
| `dueDate` | string | Yes | Due date (YYYY-MM-DD) |
| `items` | array | Yes | Array of line items (see below) |
| `subtotal` | number | Yes | Sum of all item amounts |
| `taxRate` | number | No | Tax percentage (default: 18) |
| `taxAmount` | number | Yes | Calculated tax amount |
| `discount` | number | No | Discount amount (default: 0) |
| `totalAmount` | number | Yes | Final total (subtotal + tax - discount) |
| `notes` | string | No | Invoice notes |
| `terms` | string | No | Terms and conditions |
| `status` | string | Yes | "pending", "paid", or "overdue" |
| `paymentMethod` | string | No | Set when paid: "cash", "card", "online" |
| `paymentDate` | timestamp | No | When payment was processed |
| `paymentReference` | string | No | Transaction reference number |
| `paymentNotes` | string | No | Payment notes |
| `createdAt` | timestamp | Yes | Firestore server timestamp |
| `updatedAt` | timestamp | No | Firestore server timestamp |

**Invoice Item Object (inside `items` array):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | Yes | Service/item name |
| `quantity` | number | Yes | Quantity |
| `unitPrice` | number | Yes | Price per unit |
| `amount` | number | Yes | quantity * unitPrice |

**Predefined Service Categories for Invoice Items:**

| Category | Common Items |
|----------|-------------|
| Consultation | General Consultation, Specialist Consultation |
| Laboratory | Blood Test, Urine Test, X-Ray |
| Imaging | MRI Scan, CT Scan, Ultrasound |
| Dental | Dental Cleaning, Dental Filling |
| Pharmacy | Medicines, Supplies |
| Procedure | Minor Surgery, Wound Dressing |

---

### Collection: `payments`

Document ID = Auto-generated

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `invoiceId` | string | Yes | Reference to invoices document ID |
| `invoiceNumber` | string | Yes | Invoice number for display |
| `patientName` | string | Yes | Patient name |
| `patientPhone` | string | Yes | Patient phone |
| `amount` | number | Yes | Payment amount |
| `method` | string | Yes | "cash", "card", or "online" |
| `reference` | string | No | Transaction reference/receipt number |
| `notes` | string | No | Payment notes |
| `processedBy` | string | No | Who processed the payment |
| `processedAt` | timestamp | Yes | Firestore server timestamp |
| `status` | string | No | "completed" (default) |

---

## About Document IDs

There are two types of document IDs in this project:

- **Auto-generated**: Firestore creates a random ID like `aB3xK9mPqR2wN5vL`. In Firebase Console, click the **"Auto-ID"** button when creating a document. In code, `addDoc()` handles this automatically. Used by: `patients`, `appointments`, `prescriptions`, `medicines`, `invoices`, `payments`.

- **Manual (Auth UID)**: You must type the ID yourself. Only `staffData` uses this - the document ID **must exactly match** the user's Firebase Auth UID (e.g. `fPu3Bg831WfbnSqJKyhH0PtSfUr8`). Find the UID in **Authentication > Users** tab.

---

## Dummy Data - Ready to Paste into Firebase Console

Below is one sample document for each collection. Use these to get started.

### staffData - Doctor (Document ID = copy UID from Auth > Users)

```
Document ID: (paste doctor's Auth UID here)

uid             (string)    →  (same Auth UID)
email           (string)    →  doctor1@gmail.com
fullName        (string)    →  Dr. Ahmed Khan
role            (string)    →  doctor
emailVerified   (boolean)   →  true
createdAt       (string)    →  2026-01-01T00:00:00.000Z
lastLogin       (string)    →  2026-02-26T09:00:00.000Z
specialization  (string)    →  General Medicine
```

### staffData - Receptionist (Document ID = copy UID from Auth > Users)

```
Document ID: (paste receptionist's Auth UID here)

uid             (string)    →  (same Auth UID)
email           (string)    →  receptionist1@gmail.com
fullName        (string)    →  Sarah Johnson
role            (string)    →  receptionist
emailVerified   (boolean)   →  true
createdAt       (string)    →  2026-01-01T00:00:00.000Z
lastLogin       (string)    →  2026-02-26T09:00:00.000Z
```

### patients (Document ID = click Auto-ID)

```
Document ID: (click Auto-ID)

fullName                (string)    →  John Doe
phone                   (string)    →  03001234567
email                   (string)    →  john.doe@example.com
dateOfBirth             (string)    →  1990-05-15
gender                  (string)    →  Male
address                 (string)    →  123 Main Street, Lahore
city                    (string)    →  Lahore
state                   (string)    →  Punjab
zipCode                 (string)    →  54000
bloodGroup              (string)    →  O+
allergies               (string)    →  Penicillin
medicalHistory          (string)    →  Hypertension since 2020
medications             (string)    →  Amlodipine 5mg daily
emergencyContactName    (string)    →  Jane Doe
emergencyContactPhone   (string)    →  03009876543
emergencyContactRelation(string)    →  Wife
insuranceProvider       (string)    →  State Life Insurance
insurancePolicyNumber   (string)    →  SLI-2026-78901
notes                   (string)    →  Regular follow-up patient
status                  (string)    →  active
patientId               (string)    →  PAT-A1B2C3
createdAt               (string)    →  2026-01-15T10:30:00.000Z
createdBy               (string)    →  (receptionist's Auth UID)
```

### medicines (Document ID = click Auto-ID)

```
Document ID: (click Auto-ID)

name                (string)    →  Amoxicillin
category            (string)    →  Antibiotic
strength            (string)    →  500mg
form                (string)    →  Capsule
manufacturer        (string)    →  PharmaCo Ltd.
description         (string)    →  Broad-spectrum antibiotic
sideEffects         (string)    →  Nausea, diarrhea, rash
contraindications   (string)    →  Penicillin allergy
dosageInstructions  (string)    →  Take with food, complete full course
storageInstructions (string)    →  Store below 25C, keep dry
price               (number)    →  15
stockQuantity       (number)    →  200
reorderLevel        (number)    →  50
isActive            (boolean)   →  true
createdAt           (string)    →  2026-01-10T08:00:00.000Z
```

### appointments (Document ID = click Auto-ID)

```
Document ID: (click Auto-ID)

patientId       (string)    →  (paste patient's Auto-ID from above)
patientName     (string)    →  John Doe
patientPhone    (string)    →  03001234567
patientEmail    (string)    →  john.doe@example.com
patientAge      (string)    →  35
patientGender   (string)    →  Male
doctorId        (string)    →  (paste doctor's Auth UID)
doctorName      (string)    →  Dr. Ahmed Khan
appointmentDate (string)    →  2026-02-26
appointmentTime (string)    →  11:00
appointmentType (string)    →  consultation
status          (string)    →  scheduled
symptoms        (string)    →  Persistent cough, mild fever for 3 days
notes           (string)    →  Patient referred by Dr. Ali
medicalHistory  (string)    →  Hypertension since 2020
medications     (string)    →  Amlodipine 5mg daily
vitalSigns      (map)       →  (add as sub-fields below)
  bloodPressure (string)    →  130/85
  heartRate     (string)    →  78 bpm
  temperature   (string)    →  99.2F
  weight        (string)    →  75 kg
createdAt       (string)    →  2026-02-26T08:30:00.000Z
createdBy       (string)    →  (receptionist's Auth UID)
```

### prescriptions (Document ID = click Auto-ID)

```
Document ID: (click Auto-ID)

patientId        (string)    →  (paste patient's Auto-ID)
patientName      (string)    →  John Doe
patientAge       (string)    →  35
patientGender    (string)    →  Male
patientPhone     (string)    →  03001234567
patientEmail     (string)    →  john.doe@example.com
doctorId         (string)    →  (paste doctor's Auth UID)
doctorName       (string)    →  Dr. Ahmed Khan
prescriptionDate (string)    →  2026-02-26
diagnosis        (string)    →  Upper respiratory tract infection
symptoms         (string)    →  Persistent cough, mild fever
instructions     (string)    →  Rest for 3 days, drink plenty of fluids
followUpDate     (string)    →  2026-03-05
status           (string)    →  active
notes            (string)    →  Patient advised to return if fever exceeds 102F
createdAt        (string)    →  2026-02-26T11:30:00.000Z
medicines        (array)     →  (add array with one map entry below)
  [0]            (map)
    id           (string)    →  (paste medicine's Auto-ID from above)
    name         (string)    →  Amoxicillin
    category     (string)    →  Antibiotic
    dosage       (string)    →  500mg
    frequency    (string)    →  3 times a day
    duration     (string)    →  7 days
    timing       (string)    →  After meals
    specialInstructions (string) →  Complete the full course
```

### invoices (Document ID = click Auto-ID)

```
Document ID: (click Auto-ID)

invoiceNumber   (string)    →  INV-1740000000001
patientId       (string)    →  (paste patient's Auto-ID)
patientName     (string)    →  John Doe
patientPhone    (string)    →  03001234567
patientEmail    (string)    →  john.doe@example.com
patientAddress  (string)    →  123 Main Street, Lahore
invoiceDate     (string)    →  2026-02-26
dueDate         (string)    →  2026-03-05
subtotal        (number)    →  2500
taxRate         (number)    →  18
taxAmount       (number)    →  450
discount        (number)    →  0
totalAmount     (number)    →  2950
notes           (string)    →  Follow-up consultation included
terms           (string)    →  Payment due within 7 days
status          (string)    →  pending
createdAt       (timestamp) →  (click timestamp type, pick current date)
items           (array)     →  (add array with map entries below)
  [0]           (map)
    description (string)    →  General Consultation
    quantity    (number)    →  1
    unitPrice   (number)    →  1500
    amount      (number)    →  1500
  [1]           (map)
    description (string)    →  Blood Test - CBC
    quantity    (number)    →  1
    unitPrice   (number)    →  1000
    amount      (number)    →  1000
```

### payments (Document ID = click Auto-ID)

```
Document ID: (click Auto-ID)

invoiceId       (string)    →  (paste invoice's Auto-ID from above)
invoiceNumber   (string)    →  INV-1740000000001
patientName     (string)    →  John Doe
patientPhone    (string)    →  03001234567
amount          (number)    →  2950
method          (string)    →  cash
reference       (string)    →  RCPT-20260226-001
notes           (string)    →  Paid in full at reception
processedBy     (string)    →  receptionist
processedAt     (timestamp) →  (click timestamp type, pick current date)
status          (string)    →  completed
```

---

### How to Add Nested Fields in Firebase Console

**For `map` types** (like `vitalSigns`):
1. Click **"Add field"**
2. Set the field name (e.g. `vitalSigns`)
3. Change the type dropdown to **"map"**
4. Click the **"+"** icon next to the map to add sub-fields inside it

**For `array` types** (like `medicines`, `items`):
1. Click **"Add field"**
2. Set the field name (e.g. `medicines`)
3. Change the type dropdown to **"array"**
4. Click the **"+"** icon to add an element
5. Change the element type to **"map"**
6. Click the **"+"** icon inside the map to add key-value pairs

---

## 7. Firestore Security Rules

### Development Rules (current - open access)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Production Rules (recommended)

Replace the above with these rules when deploying to production:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Staff data - users can read their own record, authenticated users can read all
    match /staffData/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Patients - any authenticated user can read/write
    match /patients/{patientId} {
      allow read, write: if request.auth != null;
    }

    // Appointments - any authenticated user can read/write
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }

    // Prescriptions - any authenticated user can read, doctors can write
    match /prescriptions/{prescriptionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Medicines - any authenticated user can read, doctors can write
    match /medicines/{medicineId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Invoices - any authenticated user can read/write
    match /invoices/{invoiceId} {
      allow read, write: if request.auth != null;
    }

    // Payments - any authenticated user can read/write
    match /payments/{paymentId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

To deploy rules:

```bash
firebase deploy --only firestore:rules
```

---

## 8. Seed Initial Data

The project includes seed scripts in the `scripts/` folder to populate test data.

### Prerequisites

- Firebase emulators running **OR** a live Firestore database
- Staff users already created in both Authentication and `staffData` collection
- Node.js installed

### Run the Seed Scripts

#### Step 1: Start emulators (if using local development)

```bash
firebase emulators:start
```

#### Step 2: Run the comprehensive seed

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/generate_comprehensive_seed.cjs
```

This creates:
- 45 patients
- 20 medicines
- 20 appointments per doctor (today + past/future)
- 20 prescriptions per doctor
- 20 invoices per receptionist

#### Step 3: Run the emulator seed (additional data)

```bash
node scripts/seed-emulator.js
```

This adds 53 additional documents linked to Doctor 1.

### Alternative: Seed from the Login Page

The Login page has a built-in **"Seed Database"** button (development feature). Click it after logging in to populate medicines, appointments, and invoices with sample data.

---

## 9. Local Emulator Setup (Optional)

The Firebase Emulator Suite allows you to run the entire backend locally for free.

### Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Initialize Firebase in the project

If `.firebaserc` and `firebase.json` already exist, skip this. Otherwise:

```bash
firebase init
```

Select:
- Firestore
- Authentication
- Emulators

### Emulator Ports (from firebase.json)

| Service | Port |
|---------|------|
| Authentication | 9099 |
| Firestore | 8080 |
| Emulator UI | Auto-assigned |

### Start Emulators

```bash
firebase emulators:start
```

The app automatically connects to emulators when running on `localhost` (see `src/firebase/config.js` line 51-54).

### Emulator UI

After starting emulators, open the Emulator UI URL shown in the terminal (usually `http://127.0.0.1:4000`). From here you can:
- View/edit Firestore documents
- Manage Auth users
- Monitor requests

---

## 10. Troubleshooting

### "No doctors found" in appointment form
The `staffData` collection must have documents with `role: "doctor"`. Make sure:
- Document ID = the Firebase Auth UID
- The `role` field is exactly `"doctor"` (lowercase)

### Appointments not showing for doctor
Every appointment needs a `doctorId` field matching the doctor's Auth UID. If appointments were created without `doctorId`, they will be invisible to the doctor.

### "Permission denied" errors
Check that your Firestore rules allow access. During development, use the open rules. For production, ensure users are authenticated.

### Emulator data disappears on restart
Emulator data is ephemeral by default. To persist data between restarts:

```bash
firebase emulators:start --export-on-exit=./emulator-data --import=./emulator-data
```

### Date format mismatches
The app handles two date formats:
- **Firestore Timestamp** objects (from seed scripts using Admin SDK)
- **ISO date strings** like `"2026-02-26"` (from the web app forms)

Both formats are handled in the code, but be aware of this when querying manually.

---

## Quick Reference: Collection Relationships

```
staffData (doctors/receptionists)
    |
    |-- uid ──> appointments.doctorId
    |           appointments.createdBy
    |
    |-- uid ──> prescriptions.doctorId
    |
    v
patients
    |
    |-- id ───> appointments.patientId
    |           prescriptions.patientId
    |           invoices.patientId
    |
    v
appointments ──(tokenNumber)──> Token Queue / Token Display
    |
    v
prescriptions ──(medicines[].id)──> medicines
    |
    v
invoices ──(invoiceId)──> payments
```
