import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md card">
        <h2 className="text-2xl font-semibold mb-1">Forgot Password</h2>
        <p className="text-sm text-gray-500 mb-6"></p>
        {sent ? (
          <p className="text-sm text-red-600">Password recovery is currently under maintenance. Please try again later or contact support</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Enter email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-full">Send Password</button>
          </form>
        )}
        <div className="mt-6 text-sm">
          <Link className="link" to="/">Back</Link>
        </div>
      </div>
    </div>
  );
}


