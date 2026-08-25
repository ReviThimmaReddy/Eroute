import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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

const API_KEY = firebaseConfig.apiKey;

// Firebase Auth REST API endpoints
async function resetOrUpdateAuthAccount(email, newPassword, role, fullName) {
  console.log(`\n=== PROVISIONING FIREBASE AUTH ACCOUNT: ${email} ===`);
  
  // 1. Try REST API signUp (creates if doesn't exist)
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
  const signUpRes = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: newPassword, returnSecureToken: true })
  });
  
  const signUpData = await signUpRes.json();
  
  let uid = null;
  let idToken = null;
  
  if (signUpRes.ok) {
    console.log(`✓ NEW Auth account created in Firebase Auth (${email}) -> UID: ${signUpData.localId}`);
    uid = signUpData.localId;
    idToken = signUpData.idToken;
  } else {
    console.log(`! Account ${email} already exists in Firebase Auth. Updating password via password reset flow or direct login...`);
    console.log(`  SignUp Error: ${signUpData.error?.message}`);

    // 2. Try login with newPassword
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, newPassword);
      uid = userCred.user.uid;
      console.log(`✓ Already active with password '${newPassword}' -> UID: ${uid}`);
    } catch (loginErr) {
      console.log(`  Login with '${newPassword}' failed: ${loginErr.code} ${loginErr.message}`);

      // 3. Send password reset or try reset via Firebase Auth REST API
      const resetUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`;
      const resetRes = await fetch(resetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email })
      });
      const resetData = await resetRes.json();
      console.log(`  Password Reset Request sent for ${email}:`, resetData);
      return;
    }
  }

  if (uid) {
    // 4. Ensure Firestore document users/{UID} exists with exact role and matching UID!
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const now = Date.now();

    const userProfile = {
      id: uid,
      uid: uid,
      email: email,
      fullName: snap.exists() ? (snap.data().fullName || fullName) : fullName,
      role: role,
      status: 'Active',
      updatedAt: now,
      ...(snap.exists() ? snap.data() : { createdAt: now })
    };

    userProfile.id = uid;
    userProfile.uid = uid;
    userProfile.role = role;

    await setDoc(userRef, userProfile, { merge: true });
    console.log(`✓ Firestore document users/${uid} synced and verified:`, JSON.stringify(userProfile, null, 2));
  }
}

async function run() {
  await resetOrUpdateAuthAccount("admin@eroute.com", "Admin@12345", "admin", "System Administrator (Transport Office)");
  await resetOrUpdateAuthAccount("conductor@eroute.com", "Conductor@12345", "conductor", "Suresh Mani (Conductor)");
  await resetOrUpdateAuthAccount("student@eroute.com", "password123", "student", "Thimma Reddy K C");
}

run();
