import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      navigate('/todos');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md card">
        <h2 className="text-2xl font-semibold mb-1">Login</h2>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage your todos</p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button disabled={loading} type="submit" className="btn btn-primary w-full">{loading ? 'Signing in...' : 'Login'}</button>
        </form>
        <div className="flex items-center justify-between mt-6 text-sm">
          <Link className="link" to="/register">Create New Account</Link>
          <Link className="link" to="/forgot">Forgot Password</Link>
        </div>
      </div>
    </div>
  );
}


