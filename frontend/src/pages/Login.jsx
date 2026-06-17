import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { authService } from '../services/authService.js';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  User,
  ShieldCheck,
  Layers,
  ListTodo
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { instance, accounts } = useMsal();

  // Redirect if already authenticated locally
  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Auth States
  const [selectedRole, setSelectedRole] = useState('EMPLOYEE'); // EMPLOYEE or ADMIN
  const [loading, setLoading] = useState(false);

  // Error / Access Denied States
  const [errorMsg, setErrorMsg] = useState('');
  const [accessDeniedEmail, setAccessDeniedEmail] = useState('');
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  // Check if we were redirected with denied state
  useEffect(() => {
    if (location.state?.denied) {
      setErrorMsg('You do not have the required permissions to access this page.');
    }
  }, [location]);

  // Handle Microsoft redirect callback processing
  useEffect(() => {
    const processRedirectCallback = async () => {
      // If MSAL successfully logged in the user via redirect
      if (accounts.length > 0) {
        setLoading(true);
        setErrorMsg('');
        setIsAccessDenied(false);

        try {
          const account = accounts[0];

          // Silently acquire the idToken from the redirect response
          const tokenResult = await instance.acquireTokenSilent({
            scopes: ['user.read'],
            account: account
          });

          const idToken = tokenResult.idToken;
          const accessToken = tokenResult.accessToken;
          const userEmail = account.username || '';

          // Fetch profile photo from MS Graph if available
          let profileImageBase64 = null;
          try {
            console.log('[AUTH] Querying MS Graph for profile picture...');
            const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            if (photoResponse.ok) {
              const blob = await photoResponse.blob();
              profileImageBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
              });
              console.log('[AUTH] Successfully extracted MS Graph profile picture.');
            }
          } catch (photoErr) {
            console.warn('[AUTH] Failed to fetch MS Graph profile photo:', photoErr);
          }

          console.log('[AUTH] MSAL redirect authentication success. Verifying with TKS database...', userEmail);

          // Call backend to verify whitelist and sign local JWT session
          await authService.loginWithMicrosoft(idToken, userEmail, profileImageBase64);

          navigate('/dashboard');
        } catch (error) {
          console.error('[AUTH ERROR] Whitelist verification failed:', error);

          if (error.message && (error.message.includes('Access Denied') || error.message.includes('not authorized'))) {
            // Find whitelisted email
            const attemptedEmail = accounts[0]?.username || 'your-email@techknomatic.com';
            setAccessDeniedEmail(attemptedEmail);
            setIsAccessDenied(true);
          } else {
            setErrorMsg(error.message || 'Verification with TKS server failed.');
          }
        } finally {
          setLoading(false);
        }
      }
    };

    processRedirectCallback();
  }, [accounts, instance, navigate]);

  // Handle Microsoft Login Flow
  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setIsAccessDenied(false);

    try {
      const loginRequest = {
        scopes: ['user.read', 'openid', 'profile', 'email'],
        prompt: 'select_account',
        redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin + '/auth/microsoft/callback'
      };

      console.log('[AUTH] Launching Microsoft Redirect Flow with URI:', loginRequest.redirectUri);

      // Run standard MSAL redirect flow (immune to popup blocking & nested frame issues)
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Microsoft redirect login failed:', error);
      setErrorMsg(error.message || 'Microsoft Authentication failed.');
      setLoading(false);
    }
  };

  const handleResetAccessDenied = () => {
    setIsAccessDenied(false);
    setAccessDeniedEmail('');
    setErrorMsg('');
    // Clean up local session on access denial so they can retry
    authService.logout();
    navigate('/login');
  };

  // Access Denied Screen Overlay
  if (isAccessDenied) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 md:p-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-premium border border-red-100 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Your email address is not pre-approved to access the system.
          </p>

          <div className="w-full bg-slate-50 rounded-xl p-4 mb-6 text-left border border-slate-100">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Attempted Email</div>
            <div className="text-sm font-semibold text-slate-700 break-all">{accessDeniedEmail || 'Unknown Email'}</div>
            <div className="text-xs text-slate-400 mt-3 font-semibold uppercase tracking-wider mb-1">Requested Session Role</div>
            <div className="text-sm text-slate-700 flex items-center gap-1.5 font-semibold">
              {selectedRole === 'ADMIN' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-tks-blue" />
                  Admin (Read-Only)
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-tks-blue" />
                  Developer (Read-Write)
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            To gain access, please contact your administrator to whitelist your corporate email address in the organization database.
          </p>

          <button
            onClick={handleResetAccessDenied}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold text-sm transition-all duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
        <div className="text-xs text-slate-400 mt-8">
          © 2024 TKS Product Development Tracking. All rights reserved.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 md:p-6">

      {/* Central Login Card */}
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-premium overflow-hidden flex flex-col md:flex-row min-h-[760px] border border-slate-100">

        {/* Left Section - Forms */}
        <div className="w-full md:w-1/2 pt-12 pb-8 px-6 md:pt-16 md:pb-12 md:px-10 flex flex-col justify-between items-center gap-8 md:gap-0">

          {/* Logo & Welcome Header */}
          <div className="w-full max-w-md text-center">
            <div className="flex justify-center mb-4">
              <img
                src="/tks.png"
                alt="TKS Logo"
                className="h-24 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Welcome Back!</h1>
            <p className="text-slate-500 text-sm mt-1.5">Please login to continue</p>
          </div>

          {/* Core Login Actions */}
          <div className="w-full max-w-md space-y-6">

            {/* Role Select Options */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Login as</label>
              <div className="grid grid-cols-1 gap-3">

                {/* Employee Option */}
                <div
                  onClick={() => setSelectedRole('EMPLOYEE')}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-150 ${selectedRole === 'EMPLOYEE'
                      ? 'border-[#0F52BA] bg-blue-50/20'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${selectedRole === 'EMPLOYEE' ? 'bg-[#0F52BA]/10 text-[#0F52BA]' : 'bg-slate-50 text-slate-400'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Developer</div>
                      <div className="text-[11px] text-slate-400">Update & manage product status</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedRole === 'EMPLOYEE' ? 'border-[#0F52BA]' : 'border-slate-300'
                    }`}>
                    {selectedRole === 'EMPLOYEE' && <div className="w-2.5 h-2.5 rounded-full bg-[#0F52BA]" />}
                  </div>
                </div>

                {/* Admin Option */}
                <div
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-150 ${selectedRole === 'ADMIN'
                      ? 'border-[#0F52BA] bg-blue-50/20'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${selectedRole === 'ADMIN' ? 'bg-[#0F52BA]/10 text-[#0F52BA]' : 'bg-slate-50 text-slate-400'}`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Admin</div>
                      <div className="text-[11px] text-slate-400">View product status only</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedRole === 'ADMIN' ? 'border-[#0F52BA]' : 'border-slate-300'
                    }`}>
                    {selectedRole === 'ADMIN' && <div className="w-2.5 h-2.5 rounded-full bg-[#0F52BA]" />}
                  </div>
                </div>

              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Microsoft Login Area */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-3.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
              >
                {/* Custom Microsoft Logo */}
                <svg className="w-5 h-5" viewBox="0 0 23 23">
                  <path fill="#F25022" d="M1 1h10v10H1z" />
                  <path fill="#7FBA00" d="M12 1h10v10H12z" />
                  <path fill="#00A4EF" d="M1 12h10v10H1z" />
                  <path fill="#FFB900" d="M12 12h10v10H12z" />
                </svg>
                {loading ? 'Redirecting...' : 'Sign in with Microsoft'}
              </button>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Secure login with your organization Microsoft account</span>
              </div>
            </div>

          </div>

          {/* Contact Admin Link */}
          <div className="w-full max-w-md text-center text-xs text-slate-500">
            Don't have access?{' '}
            <a
              href="mailto:admin@techknomatic.com?subject=TKS%20Access%20Request"
              className="text-blue-600 hover:text-blue-800 font-bold underline"
            >
              Contact your administrator.
            </a>
          </div>

        </div>

        {/* Right Section - Illustration & Corporate Marketing */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-[#F3F7FC] to-[#E5EFF9] p-10 flex-col justify-between border-l border-slate-100">

          {/* Illustration Container */}
          <div className="flex-1 flex items-center justify-center p-4">
            <svg viewBox="0 0 500 380" className="w-full max-w-sm drop-shadow-xl select-none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="480" height="360" rx="20" fill="#FFFFFF" />
              <rect x="10" y="10" width="480" height="40" rx="20" fill="#EBF3FF" />
              <rect x="10" y="30" width="480" height="20" fill="#EBF3FF" />
              <circle cx="35" cy="30" r="6" fill="#FF5F56" />
              <circle cx="55" cy="30" r="6" fill="#FFBD2E" />
              <circle cx="75" cy="30" r="6" fill="#27C93F" />
              <rect x="30" y="75" width="200" height="15" rx="4" fill="#EBF3FF" />
              <rect x="30" y="105" width="440" height="2" fill="#F1F5F9" />
              <rect x="30" y="125" width="200" height="75" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="45" y="140" width="100" height="12" rx="3" fill="#E2E8F0" />
              <rect x="45" y="162" width="150" height="8" rx="2" fill="#F1F5F9" />
              <rect x="45" y="176" width="70" height="8" rx="2" fill="#F1F5F9" />
              <rect x="30" y="215" width="200" height="100" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="45" y="230" width="120" height="12" rx="3" fill="#E2E8F0" />
              <rect x="45" y="252" width="160" height="8" rx="2" fill="#F1F5F9" />
              <rect x="45" y="266" width="130" height="8" rx="2" fill="#F1F5F9" />
              <circle cx="53" cy="290" r="10" fill="#E2E8F0" />
              <rect x="70" y="286" width="50" height="8" rx="2" fill="#E2E8F0" />
              <rect x="260" y="125" width="210" height="190" rx="12" fill="#F8FAFC" stroke="#EBF3FF" strokeWidth="1" />
              <rect x="280" y="145" width="80" height="10" rx="2" fill="#E2E8F0" />
              <path d="M 280 280 L 320 230 L 360 250 L 400 180 L 440 210" fill="none" stroke="#0F52BA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="280" cy="280" r="4" fill="#FFFFFF" stroke="#0F52BA" strokeWidth="2" />
              <circle cx="320" cy="230" r="4" fill="#FFFFFF" stroke="#0F52BA" strokeWidth="2" />
              <circle cx="360" cy="250" r="4" fill="#FFFFFF" stroke="#0F52BA" strokeWidth="2" />
              <circle cx="400" cy="180" r="4" fill="#FFFFFF" stroke="#0F52BA" strokeWidth="2" />
              <circle cx="440" cy="210" r="4" fill="#FFFFFF" stroke="#0F52BA" strokeWidth="2" />
              <g transform="translate(420, 90) scale(0.6)" stroke="#0F52BA" strokeWidth="2.5" fill="none" opacity="0.6">
                <circle cx="20" cy="20" r="10" />
                <path d="M 20 2 v 6 M 20 32 v 6 M 2 20 h 6 M 32 20 h 6 M 7 7 l 4.5 4.5 M 28.5 28.5 l 4.5 4.5 M 7 33 l 4.5 -4.5 M 28.5 11.5 l 4.5 -4.5" />
              </g>
              <g transform="translate(15, 290)">
                <rect x="5" y="35" width="20" height="20" fill="#0F52BA" rx="3" opacity="0.8" />
                <path d="M 15 35 Q 2 15 -5 10 Q 5 25 15 35 Z" fill="#22C55E" />
                <path d="M 15 35 Q 28 15 35 10 Q 25 25 15 35 Z" fill="#22C55E" />
                <path d="M 15 35 Q 15 5 15 0 Q 20 20 15 35 Z" fill="#15803D" />
              </g>
            </svg>
          </div>

          {/* Marketing Copy Points */}
          <div className="space-y-4">

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#0F52BA] shrink-0 shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Track Progress</h3>
                <p className="text-xs text-slate-500 leading-normal">Monitor product development in real-time.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0 shadow-sm">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Stay Organized</h3>
                <p className="text-xs text-slate-500 leading-normal">Manage features, user stories and status in one place.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Secure & Reliable</h3>
                <p className="text-xs text-slate-500 leading-normal">Role based access for security and transparency.</p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer Branding Copyright */}
      <div className="text-slate-400 text-[11px] text-center mt-6">
        © 2024 TKS Product Development Tracking. All rights reserved.
      </div>

    </div>
  );
};

export default Login;
