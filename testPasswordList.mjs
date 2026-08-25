import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

const passwords = [
  "Admin@12345",
  "Conductor@12345",
  "password123",
  "admin@12345",
  "conductor@12345",
  "Admin123",
  "Conductor123",
  "Admin@123",
  "Conductor@123",
  "admin12345",
  "conductor12345",
  "Admin@2026",
  "Conductor@2026",
  "Eroute@12345",
  "Eroute@2026",
  "ErouteAdmin@123",
  "AdminPass123",
  "Password123!",
  "Admin123!",
  "Admin@123456"
];

async function findPasswords() {
  console.log("=== SEARCHING VALID PASSWORDS FOR ADMIN & CONDUCTOR ===");

  for (const email of ["admin@eroute.com", "conductor@eroute.com"]) {
    console.log(`\nTesting ${email} ...`);
    let found = false;
    for (const p of passwords) {
      try {
        const res = await signInWithEmailAndPassword(auth, email, p);
        console.log(`✓ FOUND VALID PASSWORD FOR ${email}: '${p}' -> Auth UID: ${res.user.uid}`);

        // Check Firestore
        const snap = await getDoc(doc(db, 'users', res.user.uid));
        if (snap.exists()) {
          console.log(`  ✓ Firestore users/${res.user.uid} exists:`, snap.data());
        } else {
          console.log(`  ✕ Firestore users/${res.user.uid} does NOT exist!`);
        }
        found = true;
        break;
      } catch (err) {
        if (err.code === 'auth/too-many-requests') {
          console.log(`  ! Rate limited for '${p}'. Waiting 2 seconds...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    if (!found) {
      console.log(`✕ No password matched for ${email} in test list.`);
    }
  }
}

findPasswords();
