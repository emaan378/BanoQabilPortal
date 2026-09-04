import { useState } from 'react';
import { authApi, setAuthSession } from '@/lib/api.js';
import { Settings, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import LoginShell from '@/components/ui/LoginShell.jsx';

export default function AdminLogin({ navigate }) {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.login(email, pw);
      if (!['admin', 'campus_admin'].includes(response.role)) throw new Error('This account does not have admin access');
      setAuthSession({ token: response.token, user: response });
      navigate('admin-dashboard');
    } catch (error) {
      window.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginShell
      icon={Settings}
      title="Admin Login"
      subtitle="Access the operations & academic dashboard."
    >
      <form onSubmit={handleLogin} className="LoginShell-form-13">
        <div>
          <label className="LoginShell-label-14">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@banoquabil.fsd"
            className="LoginShell-input-15"
            required
          />
        </div>

        <div>
          <label className="LoginShell-label-14">Password</label>
          <div className="LoginShell-div-16">
            <input
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              className="LoginShell-input-17"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="LoginShell-button-18"
            >
              {showPw ? <EyeOff className="LoginShell-eye-19" /> : <Eye className="LoginShell-eye-19" />}
            </button>
          </div>
        </div>

        <button type="submit" className="LoginShell-button-20" disabled={loading}>
          {loading ? 'Signing In...' : 'Log In to Admin Portal'}
        </button>
      </form>

      <div className="LoginShell-div-21">
        <p className="LoginShell-p-22">Switch Portal</p>
        <div className="LoginShell-div-23">
          <button onClick={() => navigate('student-login')} className="LoginShell-button-24">
            Student Login
          </button>
          <button onClick={() => navigate('teacher-login')} className="LoginShell-button-24">
            Teacher Login
          </button>
        </div>
      </div>

      <div className="LoginShell-div-25">
        <button onClick={() => navigate('portal-selector')} className="LoginShell-button-26">
          <ArrowLeft className="LoginShell-arrow-27" /> Back to Portal Selection
        </button>
      </div>
    </LoginShell>
  );
}
