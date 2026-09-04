import { useState } from 'react';
import { GraduationCap, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import LoginShell from '@/components/ui/LoginShell.jsx';
import { authApi, setAuthSession } from '@/lib/api.js';

export default function StudentLogin({ navigate }) {
  const [showPw, setShowPw] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await authApi.login(identifier, pw);
      if (session.role !== 'student') throw new Error('This account does not have student portal access.');
      setAuthSession({ token: session.token, user: session });
      navigate('student-dashboard');
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginShell
      icon={GraduationCap}
      title="Student Login"
      subtitle="Enter your roll number, CNIC, registration ID, or email to continue."
    >
      <form onSubmit={handleLogin} className="LoginShell-form-13">
        <div>
          <label className="LoginShell-label-14">Roll Number / CNIC / Email</label>
          <input
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="BQ-FSD-2026-0451"
            className="LoginShell-input-15"
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label className="LoginShell-label-14">Password</label>
          <div className="LoginShell-div-16">
            <input
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={(event) => setPw(event.target.value)}
              placeholder="••••••••"
              className="LoginShell-input-17"
              required
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPw((visible) => !visible)} className="LoginShell-button-18" aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff className="LoginShell-eye-19" /> : <Eye className="LoginShell-eye-19" />}
            </button>
          </div>
        </div>

        {error && <div className="login-error" role="alert"><AlertCircle size={16} /> {error}</div>}

        <button type="submit" className="LoginShell-button-20" disabled={loading}>
          {loading ? <><Loader2 size={16} className="spin" /> Signing in…</> : 'Log In to Student Portal'}
        </button>
      </form>

      <div className="LoginShell-div-25">
        <button type="button" className="LoginShell-button-26">Forgot password?</button>
        <span className="LoginShell-p-22"> · </span>
        <button type="button" onClick={() => navigate('landing')} className="LoginShell-button-26">New here? Register</button>
      </div>

      <div className="LoginShell-div-21">
        <p className="LoginShell-p-22">Switch Portal</p>
        <div className="LoginShell-div-23">
          <button type="button" onClick={() => navigate('teacher-login')} className="LoginShell-button-24">Teacher Login</button>
          <button type="button" onClick={() => navigate('admin-login')} className="LoginShell-button-24">Admin Login</button>
        </div>
      </div>

      <button type="button" onClick={() => navigate('portal-selector')} className="login-back-link"><ArrowLeft size={15} /> Back to portal selection</button>
    </LoginShell>
  );
}
