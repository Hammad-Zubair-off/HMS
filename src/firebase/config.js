// import { initializeApp } from 'firebase/app'
// import { getAuth, connectAuthEmulator } from 'firebase/auth'
// import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID
// }

// // Initialize Firebase
// const app = initializeApp(firebaseConfig)

// // Initialize Firebase Authentication
// export const auth = getAuth(app)

// // Initialize Firestore
// export const db = getFirestore(app)

// // Connect to emulators when running locally
// if (location.hostname === "localhost") {
//   connectAuthEmulator(auth, "http://127.0.0.1:9099")
//   connectFirestoreEmulator(db, "127.0.0.1", 8080)
// }

// export default app
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-72oeIGetQLSMtuJ0nxAwFkiiXGnLNZc",
  authDomain: "clinic-management-system-551f5.firebaseapp.com",
  projectId: "clinic-management-system-551f5",
  storageBucket: "clinic-management-system-551f5.firebasestorage.app",
  messagingSenderId: "720768878063",
  appId: "1:720768878063:web:f346dff16b435a00d1a21a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
