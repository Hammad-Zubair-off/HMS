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
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDY3jg8FWjpoZeq5wrlTO60S-4orEpUuJs",
  authDomain: "life-clinic-management-s-a2493.firebaseapp.com",
  projectId: "life-clinic-management-s-a2493",
  storageBucket: "life-clinic-management-s-a2493.firebasestorage.app",
  messagingSenderId: "631263753154",
  appId: "1:631263753154:web:540b8f99ebd69ffbab1c5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect emulators (100% free, no billing)
if (location.hostname === "localhost") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export default app;
