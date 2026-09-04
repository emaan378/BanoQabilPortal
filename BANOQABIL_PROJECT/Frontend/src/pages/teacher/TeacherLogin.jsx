import { useState } from 'react';
import { Shield, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import LoginShell from '@/components/ui/LoginShell.jsx';
import { authApi, setAuthSession } from '@/lib/api.js';

export default function TeacherLogin({ navigate }) {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await authApi.login(email, pw);
      if (session.role !== 'teacher') throw new Error('This account does not have teacher portal access.');
      setAuthSession({ token: session.token, user: session });
      navigate('teacher-dashboard');
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginShell
      icon={Shield}
      title="Teacher Login"
      subtitle="Access your assigned batches and classroom tools."
    >
      <form onSubmit={handleLogin} className="LoginShell-form-13">
        <div>
          <label className="LoginShell-label-14">Email Address</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teacher@banoquabil.com" className="LoginShell-input-15" required autoComplete="username" />
        </div>

        <div>
          <label className="LoginShell-label-14">Password</label>
          <div className="LoginShell-div-16">
            <input type={showPw ? 'text' : 'password'} value={pw} onChange={(event) => setPw(event.target.value)} placeholder="••••••••" className="LoginShell-input-17" required autoComplete="current-password" />
            <button type="button" onClick={() => setShowPw((visible) => !visible)} className="LoginShell-button-18" aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff className="LoginShell-eye-19" /> : <Eye className="LoginShell-eye-19" />}
            </button>
          </div>
        </div>

        {error && <div className="login-error" role="alert"><AlertCircle size={16} /> {error}</div>}

        <button type="submit" className="LoginShell-button-20" disabled={loading}>
          {loading ? <><Loader2 size={16} className="spin" /> Signing in…</> : 'Log In to Teacher Portal'}
        </button>
      </form>

      <div className="LoginShell-div-21">
        <p className="LoginShell-p-22">Switch Portal</p>
        <div className="LoginShell-div-23">
          <button type="button" onClick={() => navigate('student-login')} className="LoginShell-button-24">Student Login</button>
          <button type="button" onClick={() => navigate('admin-login')} className="LoginShell-button-24">Admin Login</button>
        </div>
      </div>

      <button type="button" onClick={() => navigate('portal-selector')} className="login-back-link"><ArrowLeft size={15} /> Back to portal selection</button>
    </LoginShell>
  );
}
