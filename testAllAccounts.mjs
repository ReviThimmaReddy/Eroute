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

const testList = [
  { email: 'admin@eroute.com', passes: ['Admin@12345', 'password123', 'Admin@123', 'admin123', 'Admin123'] },
  { email: 'conductor@eroute.com', passes: ['Conductor@12345', 'password123', 'Conductor@123', 'conductor123'] },
  { email: 'student@eroute.com', passes: ['Student@12345', 'password123', 'Student@123', 'student123'] }
];

async function checkAll() {
  console.log("=== CHECKING FIREBASE AUTH ACCOUNTS IN eroute-ed29d ===");
  for (const item of testList) {
    console.log("\nTesting email:", item.email);
    let success = false;
    for (const p of item.passes) {
      try {
        const res = await signInWithEmailAndPassword(auth, item.email, p);
        console.log(`  ✓ SUCCESS with password '${p}' -> UID: ${res.user.uid}`);
        
        // Check Firestore doc
        const uSnap = await getDoc(doc(db, 'users', res.user.uid));
        if (uSnap.exists()) {
          console.log(`    ✓ Firestore users/${res.user.uid} exists -> role: ${uSnap.data()?.role}`);
        } else {
          console.log(`    ✕ Firestore users/${res.user.uid} NOT FOUND`);
          const q = query(collection(db, 'users'), where('email', '==', item.email));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            qSnap.forEach(d => console.log(`    -> Email query found doc ${d.id} with role: ${d.data()?.role}`));
          }
        }
        success = true;
        break;
      } catch (err) {
        console.log(`  ✕ Failed with '${p}': ${err.code}`);
      }
    }
    if (!success) {
      console.log(`✕ Could not authenticate ${item.email} with any tested password.`);
    }
  }
}

checkAll();
