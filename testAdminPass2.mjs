import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBbcV9dycSt8_T5ILbzDdmdxLankBU5X04",
  authDomain: "eroute-ed29d.firebaseapp.com",
  projectId: "eroute-ed29d",
  storageBucket: "eroute-ed29d.firebasestorage.app",
  messagingSenderId: "372127532296",
  appId: "1:372127532296:web:1b51e1c53443dbeb1698bd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testSingle() {
  console.log("=== TESTING password123 ===");
  try {
    const res = await signInWithEmailAndPassword(auth, "admin@eroute.com", "password123");
    console.log("✓ AUTH SUCCESS! UID:", res.user.uid);
    console.log("Email:", res.user.email);

    const userSnap = await getDoc(doc(db, 'users', res.user.uid));
    if (userSnap.exists()) {
      console.log("✓ Firestore doc users/" + res.user.uid + " FOUND:");
      console.log(JSON.stringify(userSnap.data(), null, 2));
    } else {
      console.log("✕ Firestore doc users/" + res.user.uid + " NOT FOUND.");
      const q = query(collection(db, 'users'), where('email', '==', 'admin@eroute.com'));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        console.log("Found document by email query:");
        qSnap.forEach(d => console.log("Doc ID:", d.id, "Data:", d.data()));
      }
    }
  } catch (err) {
    console.error("✕ AUTH FAILED with password123:", err.code, err.message);
  }
}

testSingle();
