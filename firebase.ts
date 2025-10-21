import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6TTK1GIaXm8LrQ7p3oGP0OGti4PsrWwE",
  authDomain: "gestion-contenedores.firebaseapp.com",
  projectId: "gestion-contenedores",
  storageBucket: "gestion-contenedores.firebasestorage.app",
  messagingSenderId: "459026862295",
  appId: "1:459026862295:web:866a768651c7bf377b6092"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
