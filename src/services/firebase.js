import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// YOUR Firebase configuration from the image you showed
const firebaseConfig = {
  apiKey: "AIzaSyBVgXHTbDYxMszamSv-p_x-LD6EvfDjZFg",
  authDomain: "sword-drill.firebaseapp.com",
  projectId: "sword-drill",
  storageBucket: "sword-drill.firebasestorage.app",
  messagingSenderId: "350800984953",
  appId: "1:35080098984953:web:5788bc5072d4ca35db8da8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);