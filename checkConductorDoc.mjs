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

async function checkConductor() {
  console.log("Checking conductor@eroute.com ...");
  let user = null;
  const passwords = ["Conductor@12345", "password123", "conductor123"];
  for (const pass of passwords) {
    try {
      const res = await signInWithEmailAndPassword(auth, "conductor@eroute.com", pass);
      user = res.user;
      console.log("✓ Firebase Auth LOGIN SUCCESS with password:", pass, "-> UID:", user.uid);
      break;
    } catch (err) {
      console.log("✕ Failed with password:", pass, "-", err.code);
    }
  }

  if (!user) {
    console.error("✕ Could not log in with any tested password.");
    return;
  }

  console.log("Checking Firestore doc users/" + user.uid + " ...");
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    console.log("✓ users/" + user.uid + " EXISTS:");
    console.log(JSON.stringify(snap.data(), null, 2));
  } else {
    console.log("✕ users/" + user.uid + " DOES NOT EXIST!");
    console.log("Searching users collection by email conductor@eroute.com ...");
    const q = query(collection(db, 'users'), where('email', '==', 'conductor@eroute.com'));
    const emailSnap = await getDocs(q);
    if (emailSnap.empty) {
      console.log("✕ No document with email conductor@eroute.com in users collection!");
    } else {
      console.log("Found document(s) by email:");
      emailSnap.forEach(d => console.log("Doc ID:", d.id, "Data:", d.data()));
    }
  }
}

checkConductor();
