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

async function checkAdmin() {
  console.log("=== ADMIN AUTH & FIRESTORE DIAGNOSIS ===");
  console.log("Firebase Project ID:", firebaseConfig.projectId);

  let user = null;
  const passwordsToTest = [
    "Admin@12345", 
    "Admin@123", 
    "Admin@1234", 
    "Admin123", 
    "Admin12345", 
    "admin@12345", 
    "admin@123",
    "password123",
    "Password@123",
    "AdminPass123!",
    "ErouteAdmin@123",
    "Eroute@123"
  ];
  
  for (const pass of passwordsToTest) {
    try {
      const res = await signInWithEmailAndPassword(auth, "admin@eroute.com", pass);
      user = res.user;
      console.log("✓ Firebase Auth SUCCESS with password:", pass);
      console.log("✓ Authenticated UID:", user.uid);
      break;
    } catch (err) {
      console.log("✕ Auth failed for:", pass, "-> Code:", err.code);
    }
  }

  if (!user) {
    console.error("✕ Failed to authenticate admin@eroute.com with tested passwords.");
    return;
  }

  console.log("\nChecking Firestore doc users/" + user.uid + " ...");
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      console.log("✓ users/" + user.uid + " FOUND in Firestore:");
      console.log(JSON.stringify(snap.data(), null, 2));
    } else {
      console.log("✕ users/" + user.uid + " NOT FOUND in Firestore at users/" + user.uid);
      console.log("Querying users collection where email == 'admin@eroute.com' ...");
      const emailQ = query(collection(db, 'users'), where('email', '==', 'admin@eroute.com'));
      const emailSnap = await getDocs(emailQ);
      if (emailSnap.empty) {
        console.log("✕ No document with email admin@eroute.com found in users collection!");
      } else {
        console.log("Found document(s) by email query:");
        emailSnap.forEach(d => {
          console.log("  Doc ID:", d.id);
          console.log("  Doc Data:", JSON.stringify(d.data(), null, 2));
        });
      }
    }
  } catch (fsErr) {
    console.error("✕ Firestore read error:", fsErr.code, fsErr.message);
  }
}

checkAdmin();
