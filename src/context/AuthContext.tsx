import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import type { UserProfile } from '../types';
import { parseFirebaseWebAuthError } from '../utils/firebaseErrorUtils';
import { validateFullName, validateRegisterNumber } from '../utils/studentValidation';

interface StudentSignupData {
  fullName: string;
  registerNumber: string;
  phoneNumber: string;
  email: string;
  password: string;
  role?: string;
  department?: string;
  college?: string;
}

interface AuthContextType {
  currentUser: any;
  profile: UserProfile | null;
  role: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<string>;
  registerStudent: (data: StudentSignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const MISSING_PROFILE_ERROR = 'Admin account is authenticated, but the Admin profile was not found. Please contact the administrator.';
const UNAUTHORIZED_ROLE_ERROR = 'This account is not authorized as an Admin.';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    localStorage.removeItem('eroute_user_session');
    setCurrentUser(null);
    setProfile(null);
    setRole(null);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser || !currentUser.uid) return;

    if (data.fullName) {
      const nameCheck = validateFullName(data.fullName);
      if (!nameCheck.isValid) {
        throw new Error(nameCheck.error!);
      }
      data.fullName = nameCheck.value;
    }

    if (data.registerNumber) {
      const regCheck = validateRegisterNumber(data.registerNumber);
      if (!regCheck.isValid) {
        throw new Error(regCheck.error!);
      }
      data.registerNumber = regCheck.value;
    }

    const updatedData = { ...data, updatedAt: Date.now() };

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), updatedData);
    } catch (e) {
      console.warn('Firestore update profile note:', e);
    }

    if (profile) {
      setProfile({ ...profile, ...updatedData });
    }
  };

  const registerStudent = async (data: StudentSignupData) => {
    const nameCheck = validateFullName(data.fullName);
    if (!nameCheck.isValid) {
      throw new Error(nameCheck.error!);
    }

    const regCheck = validateRegisterNumber(data.registerNumber);
    if (!regCheck.isValid) {
      throw new Error(regCheck.error!);
    }

    const trimmedName = nameCheck.value;
    const trimmedReg = regCheck.value;
    const trimmedPhone = (data.phoneNumber || '').trim();
    const trimmedEmail = (data.email || '').trim();

    try {
      const regQuery = query(
        collection(db, 'users'), 
        where('registerNumber', '==', trimmedReg)
      );
      const regSnap = await getDocs(regQuery);
      if (!regSnap.empty) {
        throw new Error('Register number already exists.');
      }
    } catch (e: any) {
      if (e.message === 'Register number already exists.') throw e;
      console.warn('Register number check warning:', e);
    }

    let user: any = null;
    try {
      const res = await createUserWithEmailAndPassword(auth, trimmedEmail, data.password);
      user = res ? res.user : null;
    } catch (err: any) {
      throw new Error(parseFirebaseWebAuthError(err));
    }

    if (!user || !user.uid) {
      throw new Error('Registration failed. Auth user object missing.');
    }

    const now = Date.now();
    const studentProfile: UserProfile = {
      id: user.uid,
      uid: user.uid,
      email: trimmedEmail,
      fullName: trimmedName,
      role: 'student',
      photoUrl: null,
      phoneNumber: trimmedPhone,
      registerNumber: trimmedReg,
      department: (data.department || '').trim() || 'Computer Science & Engineering',
      college: (data.college || '').trim() || 'Saveetha School of Engineering (SIMATS)',
      status: 'Active',
      createdAt: now,
      updatedAt: now
    };

    try {
      await setDoc(doc(db, 'users', user.uid), studentProfile);
    } catch (fsErr: any) {
      console.error('AUTH_ERROR: Failed to write Firestore user document, rolling back Auth user:', fsErr);
      await user.delete().catch(() => {});
      await clearAuthState();
      throw new Error('Registration failed: Could not create user profile in Firestore.');
    }

    const authUser = { uid: user.uid, email: user.email, displayName: trimmedName };
    localStorage.setItem('eroute_user_session', JSON.stringify(authUser));
    setCurrentUser(authUser);
    setProfile(studentProfile);
    setRole('student');
    console.log('STUDENT_REGISTER_SUCCESS');
    console.log('STUDENT_UID:', user.uid);
  };

  const login = async (emailInput: string, passInput: string): Promise<string> => {
    const trimmedEmail = (emailInput || '').trim();
    console.log('AUTH START');
    console.log('Firebase project: eroute-ed29d');

    // Clear any stale previous-session state before authenticating
    localStorage.removeItem('eroute_user_session');

    let user: any = null;
    try {
      const res = await signInWithEmailAndPassword(auth, trimmedEmail, passInput);
      user = res ? res.user : null;
      console.log('AUTH SUCCESS');
      console.log('UID:', user?.uid);
    } catch (fbErr: any) {
      console.error('AUTH FAILED:', fbErr);
      throw new Error(parseFirebaseWebAuthError(fbErr));
    }

    if (!user || !user.uid) {
      await clearAuthState();
      throw new Error('Unable to verify your account. Please try again.');
    }

    const userRef = doc(db, 'users', user.uid);
    let userSnap: any = null;
    try {
      userSnap = await getDoc(userRef);

      // Fallback: if users/{uid} is missing, search by email in users collection and sync doc ID to UID
      if (!userSnap || !userSnap.exists()) {
        console.log('Firestore users/' + user.uid + ': NOT FOUND');
        const emailQ = query(collection(db, 'users'), where('email', '==', trimmedEmail));
        const emailSnap = await getDocs(emailQ);
        if (!emailSnap.empty) {
          const existingDoc = emailSnap.docs[0];
          const existingData = existingDoc.data() as UserProfile;
          console.log('Firestore profile: FOUND via email query (Doc ID: ' + existingDoc.id + '), syncing to users/' + user.uid);
          const syncedProfile: UserProfile = {
            ...existingData,
            id: user.uid,
            uid: user.uid,
            updatedAt: Date.now()
          };
          await setDoc(userRef, syncedProfile, { merge: true });
          userSnap = await getDoc(userRef);
        }
      } else {
        console.log('Firestore users/' + user.uid + ': FOUND');
      }
    } catch (fsErr: any) {
      console.error('AUTH_ERROR Firestore read failure:', fsErr);
      await clearAuthState();
      throw new Error('Unable to verify your account. Please try again.');
    }

    if (!userSnap || !userSnap.exists() || !userSnap.data()) {
      await clearAuthState();
      throw new Error(MISSING_PROFILE_ERROR);
    }

    const profileData = userSnap.data() as UserProfile;
    const rawRole = profileData ? profileData.role : null;
    const storedRole = rawRole ? rawRole.toString().toLowerCase().trim() : '';
    console.log('Role:', storedRole || 'missing');

    if (!storedRole || !['admin', 'conductor', 'student'].includes(storedRole)) {
      await clearAuthState();
      throw new Error(UNAUTHORIZED_ROLE_ERROR);
    }

    const targetRoute = `/${storedRole}/dashboard`;
    console.log('Navigation:', targetRoute);

    const authUser = { uid: user.uid, email: user.email, displayName: user.displayName || profileData.fullName || 'User' };
    localStorage.setItem('eroute_user_session', JSON.stringify(authUser));
    setCurrentUser(authUser);
    setProfile(profileData);
    setRole(storedRole);

    return storedRole;
  };

  const logout = async () => {
    await clearAuthState();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          let userSnap = await getDoc(userRef);

          if ((!userSnap || !userSnap.exists()) && user.email) {
            const emailQ = query(collection(db, 'users'), where('email', '==', user.email.trim()));
            const emailSnap = await getDocs(emailQ);
            if (!emailSnap.empty) {
              const existingDoc = emailSnap.docs[0];
              const existingData = existingDoc.data() as UserProfile;
              const syncedProfile: UserProfile = {
                ...existingData,
                id: user.uid,
                uid: user.uid,
                updatedAt: Date.now()
              };
              await setDoc(userRef, syncedProfile, { merge: true });
              userSnap = await getDoc(userRef);
            }
          }

          if (userSnap && userSnap.exists() && userSnap.data()) {
            const profileData = userSnap.data() as UserProfile;
            const rawRole = profileData ? profileData.role : null;
            const storedRole = rawRole ? rawRole.toString().toLowerCase().trim() : '';
            if (['admin', 'student', 'conductor'].includes(storedRole)) {
              setCurrentUser({ uid: user.uid, email: user.email, displayName: user.displayName || profileData.fullName || 'User' });
              setProfile(profileData);
              setRole(storedRole);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error('Error reading user role on auth state change:', err);
        }

        await clearAuthState();
        setLoading(false);
      } else {
        localStorage.removeItem('eroute_user_session');
        setCurrentUser(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, profile, role, loading, login, registerStudent, logout, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
};
export type { UserProfile };
