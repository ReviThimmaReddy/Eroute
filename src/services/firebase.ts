import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBbcV9dycSt8_T5ILbzDdmdxLankBU5X04",
  authDomain: "eroute-ed29d.firebaseapp.com",
  projectId: "eroute-ed29d",
  storageBucket: "eroute-ed29d.firebasestorage.app",
  messagingSenderId: "372127532296",
  appId: "1:372127532296:web:1b51e1c53443dbeb1698bd"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable Firestore offline persistence for web
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore offline persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore offline persistence is not supported by this browser.');
    }
  });
} catch (e) {
  console.error('Error enabling Firestore persistence:', e);
}

// Firebase Cloud Messaging (FCM) safe setup for browser
let messagingModule: any = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messagingModule = getMessaging(app);
  }
} catch (err) {
  console.warn('FCM is not supported or permission blocked in this browser env:', err);
}
export const messaging = messagingModule;

export { getToken, onMessage };
