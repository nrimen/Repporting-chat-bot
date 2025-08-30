// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-4PCJCSyzpl4FmC7SSj1pGmbNYTZlR4I",
  authDomain: "dillyapp-dd985.firebaseapp.com",
  projectId: "dillyapp-dd985",
  storageBucket: "dillyapp-dd985.firebasestorage.app",
  messagingSenderId: "335612613585",
  appId: "1:335612613585:web:e834f225c677867c94c6f0",
  measurementId: "G-MRVE7ZRTDB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


export { auth };