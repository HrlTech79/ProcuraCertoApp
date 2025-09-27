// src/services/firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAoIFleph8aR7T4K6v2z18sXlOB5LO29Fo",
  authDomain: "procura-certo-mj7yov.firebaseapp.com",
  projectId: "procura-certo-mj7yov",
  storageBucket: "procura-certo-mj7yov.firebasestorage.app",
  messagingSenderId: "240872673404",
  appId: "1:240872673404:web:136b7a3976f3459837b9f9",
  measurementId: "G-VD50N2XQYP",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
  db,
  auth,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
};
