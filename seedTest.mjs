import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBbcV9dycSt8_T5ILbzDdmdxLankBU5X04",
  authDomain: "eroute-ed29d.firebaseapp.com",
  projectId: "eroute-ed29d",
  storageBucket: "eroute-ed29d.firebasestorage.app",
  messagingSenderId: "372127532296",
  appId: "1:372127532296:web:1b51e1c53443dbeb1698bd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Connecting to Firestore eroute-ed29d...");
  try {
    const testDoc = {
      name: "Test Connection",
      timestamp: Date.now()
    };
    await setDoc(doc(db, 'systemSettings', 'connectionTest'), testDoc);
    console.log("Successfully wrote connectionTest document to Firestore!");
  } catch (err) {
    console.error("Firestore write failed with error:", err);
  }
}

run();
