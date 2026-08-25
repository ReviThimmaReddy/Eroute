import React, { useState } from 'react';
import { 
  Box, Card, CardContent, Typography, TextField, Button, Alert, 
  CircularProgress, Grid, InputAdornment, IconButton, Tab, Tabs,
  FormControlLabel, Checkbox, Link as MuiLink, Paper
} from '@mui/material';
import { 
  DirectionsBus, Visibility, VisibilityOff, Email, Lock, Person, 
  Badge, Phone, School, QrCodeScanner, Route as RouteIcon, CreditCard,
  VerifiedUser, CheckCircle, ArrowForward
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  validateFullName, 
  validateRegisterNumber, 
  sanitizeFullNameInput, 
  sanitizeRegisterNumberInput 
} from '../utils/studentValidation';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, registerStudent } = useAuth();
  
  // Tab state: 'login' | 'register'
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Register State
  const [fullName, setFullName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpLoading, setSignUpLoading] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [regNoError, setRegNoError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = sanitizeFullNameInput(rawVal);
    setFullName(sanitized);

    if (rawVal !== sanitized) {
      setNameError('Full Name must contain letters and spaces only.');
    } else {
      const check = validateFullName(sanitized);
      setNameError(check.isValid ? null : check.error);
    }
  };

  const handleRegNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const sanitized = sanitizeRegisterNumberInput(rawVal);
    setRegisterNumber(sanitized);

    if (rawVal !== sanitized) {
      setRegNoError('Register / Roll Number must contain numbers only.');
    } else {
      const check = validateRegisterNumber(sanitized);
      setRegNoError(check.isValid ? null : check.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userRole = await login(email.trim(), password);
      if (userRole) {
        navigate(`/${userRole}/dashboard`, { replace: true });
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError('Invalid email/mobile number or password. Please try again.');
      setPassword('');
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    const nameCheck = validateFullName(fullName);
    if (!nameCheck.isValid) {
      setNameError(nameCheck.error);
      setSignUpError(nameCheck.error!);
      return;
    }
    setNameError(null);

    const regCheck = validateRegisterNumber(registerNumber);
    if (!regCheck.isValid) {
      setRegNoError(regCheck.error);
      setSignUpError(regCheck.error!);
      return;
    }
    setRegNoError(null);

    const phoneTrimmed = phoneNumber.trim();
    const emailTrimmed = signUpEmail.trim();

    if (!phoneTrimmed) {
      setSignUpError('Phone Number is required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phoneTrimmed)) {
      setSignUpError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!emailTrimmed) {
      setSignUpError('Email address is required.');
      return;
    }
    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters long.');
      return;
    }
    if (signUpPassword !== confirmPassword) {
      setSignUpError('Confirm Password does not match Password.');
      return;
    }

    setSignUpLoading(true);
    try {
      await registerStudent({
        fullName: nameCheck.value,
        registerNumber: regCheck.value,
        phoneNumber: phoneTrimmed,
        email: emailTrimmed,
        password: signUpPassword,
        role: 'student'
      });

      navigate('/student/dashboard', { replace: true });
    } catch (err: any) {
      console.error(err);
      setSignUpError(err.message || 'Failed to register student account');
    } finally {
      setSignUpLoading(false);
    }
  };

  const features = [
    {
      icon: <CreditCard sx={{ fontSize: 24, color: '#60a5fa' }} />,
      title: 'Smart Bus Pass',
      desc: 'Digital bus pass application & instant dynamic fare calculations'
    },
    {
      icon: <RouteIcon sx={{ fontSize: 24, color: '#34d399' }} />,
      title: 'Real-Time Transit',
      desc: 'Live telemetry, route mapping & stop schedule tracking'
    },
    {
      icon: <QrCodeScanner sx={{ fontSize: 24, color: '#a78bfa' }} />,
      title: 'Secure QR Pass',
      desc: 'Cryptographically encrypted QR codes for campus boarding'
    },
    {
      icon: <VerifiedUser sx={{ fontSize: 24, color: '#fbbf24' }} />,
      title: 'Smart Attendance',
      desc: 'Automated conductor scan logs & attendance auditing'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100%', 
      display: 'flex', 
      bgcolor: 'background.default',
      overflowX: 'hidden'
    }}>
      <Grid container sx={{ flex: 1, minHeight: '100vh' }}>
        {/* LEFT PANEL: Promotional Brand Hero Section (Hidden on xs, visible on md+) */}
        <Grid 
          size={{ xs: 12, md: 6 }} 
          sx={{ 
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justify: 'space-between',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e3a8a 100%)',
            color: '#fff',
            p: { md: 6, lg: 8 },
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Ambient Background Decorative Glows */}
          <Box sx={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }} />

          {/* Top Brand Identity */}
          <Box sx={{ zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: 3, 
                bgcolor: 'primary.main', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)'
              }}>
                <DirectionsBus sx={{ fontSize: 28, color: '#fff' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#fff' }}>
                eRoute
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1.5, color: '#93c5fd', fontWeight: 700 }}>
              Student Mobility Hub
            </Typography>
          </Box>

          {/* Hero Content */}
          <Box sx={{ zIndex: 1, my: 'auto', py: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, leading: 1.2, letterSpacing: '-1px' }}>
              Smart Student Mobility &amp; Transit Ecosystem
            </Typography>
            <Typography variant="body1" sx={{ color: '#cbd5e1', mb: 5, fontSize: '1.1rem', maxWidth: 520, leading: 1.6 }}>
              Seamless digital bus passes, live route telemetry, and conductor verification for modern campus transportation.
            </Typography>

            {/* Feature Cards Grid */}
            <Grid container spacing={2.5}>
              {features.map((feat, idx) => (
                <Grid key={idx} size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ 
                    p: 2.5, 
                    borderRadius: 3, 
                    bgcolor: 'rgba(255, 255, 255, 0.05)', 
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      borderColor: 'rgba(147, 197, 253, 0.4)'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.08)', display: 'flex' }}>
                        {feat.icon}
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                        {feat.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                      {feat.desc}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Footer Copyright */}
          <Box sx={{ zIndex: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              &copy; {new Date().getFullYear()} eRoute Mobility Systems &bull; Safe &amp; Reliable Campus Transit
            </Typography>
          </Box>
        </Grid>

        {/* RIGHT PANEL: Authentication Form Section */}
        <Grid 
          size={{ xs: 12, md: 6 }} 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            justify: 'center',
            alignItems: 'center',
            p: { xs: 3, sm: 5, md: 6, lg: 8 },
            bgcolor: 'background.paper'
          }}
        >
          {/* Mobile Top Brand Header (Visible only on xs & sm) */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 4, width: '100%' }}>
            <Box sx={{ 
              width: 54, 
              height: 54, 
              borderRadius: 3, 
              bgcolor: 'primary.main', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
              mb: 1.5
            }}>
              <DirectionsBus sx={{ fontSize: 32, color: '#fff' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              eRoute
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Student Mobility Hub
            </Typography>
          </Box>

          {/* Auth Panel Card Box */}
          <Box sx={{ width: '100%', maxWidth: 460 }}>
            {/* Segmented Auth Tab Switcher (Sign In | Create Account) */}
            <Paper sx={{ 
              p: 0.5, 
              mb: 4, 
              borderRadius: 3, 
              bgcolor: 'action.hover',
              display: 'flex'
            }}>
              <Button
                fullWidth
                disableRipple
                onClick={() => { setAuthTab('login'); setError(null); }}
                sx={{
                  py: 1.2,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  color: authTab === 'login' ? 'primary.main' : 'text.secondary',
                  bgcolor: authTab === 'login' ? 'background.paper' : 'transparent',
                  boxShadow: authTab === 'login' ? 2 : 0,
                  '&:hover': { bgcolor: authTab === 'login' ? 'background.paper' : 'rgba(255,255,255,0.05)' }
                }}
              >
                Sign In
              </Button>
              <Button
                fullWidth
                disableRipple
                onClick={() => { setAuthTab('register'); setSignUpError(null); }}
                sx={{
                  py: 1.2,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  color: authTab === 'register' ? 'primary.main' : 'text.secondary',
                  bgcolor: authTab === 'register' ? 'background.paper' : 'transparent',
                  boxShadow: authTab === 'register' ? 2 : 0,
                  '&:hover': { bgcolor: authTab === 'register' ? 'background.paper' : 'rgba(255,255,255,0.05)' }
                }}
              >
                Create Account
              </Button>
            </Paper>

            {/* TAB 1: SIGN IN FORM */}
            {authTab === 'login' && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
                    Welcome back 👋
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Sign in to your eRoute account to continue
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 500 }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.8 }}>
                      Email Address / Username
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="e.g. student@simats.edu or admin"
                      type="email"
                      variant="outlined"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="action" fontSize="small" />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 2.5 }
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Password
                      </Typography>
                      <MuiLink 
                        component={RouterLink} 
                        to="/forgot-password" 
                        variant="body2" 
                        sx={{ fontWeight: 700, textDecoration: 'none', color: 'primary.main' }}
                      >
                        Forgot password?
                      </MuiLink>
                    </Box>
                    <TextField
                      fullWidth
                      placeholder="Enter your password"
                      type={showPassword ? 'text' : 'password'}
                      variant="outlined"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock color="action" fontSize="small" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowPassword(!showPassword)}
                                onMouseDown={(e) => e.preventDefault()}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 2.5 }
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={rememberMe} 
                          onChange={(e) => setRememberMe(e.target.checked)} 
                          color="primary" 
                          size="small"
                        />
                      }
                      label={<Typography variant="body2" color="text.secondary">Keep me signed in</Typography>}
                    />
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ 
                      py: 1.6, 
                      fontWeight: 700, 
                      fontSize: '1rem', 
                      borderRadius: 2.5,
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        <span>Signing in...</span>
                      </Box>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    New to eRoute?{' '}
                    <MuiLink 
                      component="button" 
                      type="button" 
                      onClick={() => setAuthTab('register')} 
                      sx={{ fontWeight: 700, textDecoration: 'none', color: 'primary.main', border: 'none', bg: 'transparent', cursor: 'pointer' }}
                    >
                      Create an account
                    </MuiLink>
                  </Typography>
                </Box>
              </Box>
            )}

            {/* TAB 2: CREATE ACCOUNT FORM */}
            {authTab === 'register' && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
                    Create Account 🚀
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Register as a student for campus bus passes &amp; transit
                  </Typography>
                </Box>

                {signUpError && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 500 }}>
                    {signUpError}
                  </Alert>
                )}

                <form onSubmit={handleSignUpSubmit}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.6 }}>
                        Full Name *
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="e.g. Raghu Ram"
                        required
                        value={fullName}
                        onChange={handleNameChange}
                        error={!!nameError}
                        helperText={nameError || "Letters and spaces only"}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person color="action" fontSize="small" />
                              </InputAdornment>
                            ),
                            sx: { borderRadius: 2.5 }
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.6 }}>
                        Register / Roll No *
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="e.g. 192324247"
                        required
                        value={registerNumber}
                        onChange={handleRegNoChange}
                        error={!!regNoError}
                        helperText={regNoError || "Digits 0-9 only"}
                        slotProps={{
                          htmlInput: {
                            type: 'text',
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                            maxLength: 20
                          },
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Badge color="action" fontSize="small" />
                              </InputAdornment>
                            ),
                            sx: { borderRadius: 2.5 }
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.6 }}>
                        Mobile Phone *
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="e.g. 9876543210"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        helperText="10-digit Indian mobile"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone color="action" fontSize="small" />
                              </InputAdornment>
                            ),
                            sx: { borderRadius: 2.5 }
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.6 }}>
                        Email Address *
                      </Typography>
                      <TextField
                        fullWidth
                        type="email"
                        placeholder="student@simats.edu"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email color="action" fontSize="small" />
                              </InputAdornment>
                            ),
                            sx: { borderRadius: 2.5 }
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.6 }}>
                        Password *
                      </Typography>
                      <TextField
                        fullWidth
                        type={showSignUpPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock color="action" fontSize="small" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                                  edge="end"
                                >
                                  {showSignUpPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            ),
                            sx: { borderRadius: 2.5 }
                          }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.6 }}>
                        Confirm Password *
                      </Typography>
                      <TextField
                        fullWidth
                        type={showSignUpPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock color="action" fontSize="small" />
                              </InputAdornment>
                            ),
                            sx: { borderRadius: 2.5 }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={signUpLoading}
                    sx={{ 
                      mt: 3.5,
                      py: 1.6, 
                      fontWeight: 700, 
                      fontSize: '1rem', 
                      borderRadius: 2.5,
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                    }}
                  >
                    {signUpLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        <span>Creating account...</span>
                      </Box>
                    ) : (
                      'Create Student Account'
                    )}
                  </Button>
                </form>

                <Box sx={{ mt: 3.5, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <MuiLink 
                      component="button" 
                      type="button" 
                      onClick={() => setAuthTab('login')} 
                      sx={{ fontWeight: 700, textDecoration: 'none', color: 'primary.main', border: 'none', bg: 'transparent', cursor: 'pointer' }}
                    >
                      Sign In
                    </MuiLink>
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;

