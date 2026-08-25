import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

const ACCOUNTS = [
  {
    email: 'admin@eroute.com',
    password: 'password123',
    role: 'admin',
    fullName: 'System Administrator (Transport Office)',
    department: 'Central Transport Directorate',
    college: 'Saveetha School of Engineering (SIMATS)',
    phoneNumber: '9876543200'
  },
  {
    email: 'student@eroute.com',
    password: 'password123',
    role: 'student',
    fullName: 'Thimma Reddy K C',
    registerNumber: 'REG-192325025',
    department: 'Computer Science & Engineering',
    college: 'Saveetha School of Engineering (SIMATS)',
    phoneNumber: '9876543210'
  },
  {
    email: 'conductor@eroute.com',
    password: 'password123',
    role: 'conductor',
    fullName: 'Suresh Mani (Conductor)',
    department: 'Ticketing & Boarding',
    college: 'Saveetha Transport Division',
    phoneNumber: '9876543230'
  }
];

async function syncAccount(account) {
  let uid = '';
  try {
    const res = await signInWithEmailAndPassword(auth, account.email, account.password);
    uid = res.user.uid;
    console.log(`✓ Auth login successful for ${account.email} -> UID: ${uid}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      try {
        const res = await createUserWithEmailAndPassword(auth, account.email, account.password);
        uid = res.user.uid;
        console.log(`+ Auth user created for ${account.email} -> UID: ${uid}`);
      } catch (createErr) {
        console.error(`✕ Failed to create auth user ${account.email}:`, createErr.message);
        return;
      }
    } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      console.warn(`! Auth account ${account.email} already exists in Firebase Auth. Try signing in with existing password or reset password.`);
      // If createUser is called when email exists, it returns email-already-in-use
      return;
    } else {
      console.error(`✕ Auth error for ${account.email}:`, err.message);
      return;
    }
  }

  if (uid) {
    const now = Date.now();
    const profile = {
      id: uid,
      uid: uid,
      email: account.email,
      fullName: account.fullName,
      role: account.role,
      photoUrl: null,
      registerNumber: account.registerNumber || null,
      department: account.department || null,
      college: account.college || null,
      phoneNumber: account.phoneNumber || '',
      status: 'Active',
      createdAt: now,
      updatedAt: now
    };

    try {
      await setDoc(doc(db, 'users', uid), profile, { merge: true });
      console.log(`✓ Firestore profile synced for users/${uid} (${account.role})`);
    } catch (fsErr) {
      console.error(`✕ Firestore sync error for users/${uid}:`, fsErr.message);
    }
  }
}

async function main() {
  console.log("Syncing Firebase Auth & Firestore Users for eroute-ed29d...\n");
  for (const acc of ACCOUNTS) {
    await syncAccount(acc);
  }
  console.log("\nSync Complete.");
  process.exit(0);
}

main();
