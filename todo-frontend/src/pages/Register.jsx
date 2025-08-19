import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      await register({ fn, ln, email, password });
      setSuccess('Account created! You can login now.');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-lg card">
        <h2 className="text-2xl font-semibold mb-1">Create Account</h2>
        <p className="text-sm text-gray-500 mb-6">Join to start organizing your tasks</p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {success && <p className="text-sm text-green-600 mb-3">{success}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div>
            <label className="label">First Name</label>
            <input className="input" value={fn} onChange={(e) => setFn(e.target.value)} required />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input className="input" value={ln} onChange={(e) => setLn(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="label">Confirm</label>
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <button disabled={loading} type="submit" className="btn btn-primary">{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <div className="mt-6 text-sm">
          <Link className="link" to="/">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}


