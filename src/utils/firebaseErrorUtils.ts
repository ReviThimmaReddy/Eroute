export const parseFirebaseWebAuthError = (err: any): string => {
  const code = err?.code || '';
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Invalid email or password.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many login attempts. Please wait and try again.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/user-disabled') {
    return 'This account has been disabled. Please contact the administrator.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Unable to verify your account. Please try again.';
  }
  return err?.message || 'Unable to verify your account. Please try again.';
};
