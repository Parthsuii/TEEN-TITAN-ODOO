import { useState, useContext } from 'react';
import AuthContext from './context';
import axios from '../axios';

export default function Login() {
  const { login, register } = useContext(AuthContext);
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'
  
  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // UI State
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setIsLoading(true);

    try {
      if (view === 'login') {
        await login(email, password);
      } else if (view === 'register') {
        await register(name, email, password);
      } else if (view === 'forgot') {
        await axios.post('/auth/forgot-password', { email });
        setSuccessMsg(`Reset link sent to ${email}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-gray-100 p-4">
      <div className="bg-[#2d2d2d] p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-lg mx-auto flex items-center justify-center text-black font-bold text-xl mb-4">SM</div>
          <h1 className="text-2xl font-bold text-white">
            {view === 'login' && 'Welcome Back'}
            {view === 'register' && 'Create Account'}
            {view === 'forgot' && 'Reset Password'}
          </h1>
        </div>

        {/* Messages */}
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        {successMsg && <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded mb-4 text-sm text-center">{successMsg}</div>}

        {/* Tabs */}
        {view !== 'forgot' && (
          <div className="flex border-b border-gray-600 mb-6">
            <button onClick={() => setView('login')} className={`flex-1 pb-3 text-sm font-bold transition-colors ${view === 'login' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-500'}`}>Login</button>
            <button onClick={() => setView('register')} className={`flex-1 pb-3 text-sm font-bold transition-colors ${view === 'register' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-500'}`}>Register</button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
              <input required type="text" className="w-full bg-[#1e1e1e] border border-gray-600 rounded p-3 text-white outline-none focus:border-emerald-500" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
            <input required type="email" className="w-full bg-[#1e1e1e] border border-gray-600 rounded p-3 text-white outline-none focus:border-emerald-500" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          {view !== 'forgot' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
              <input required type="password" className="w-full bg-[#1e1e1e] border border-gray-600 rounded p-3 text-white outline-none focus:border-emerald-500" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          )}

          {view === 'login' && (
            <div className="flex justify-end">
              <button type="button" onClick={() => setView('forgot')} className="text-xs text-emerald-400 hover:underline">Forgot Password?</button>
            </div>
          )}

          <button disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded font-bold shadow-lg transition-all mt-2 disabled:opacity-50">
            {isLoading ? 'Processing...' : (view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Send Link')}
          </button>
        </form>

        {view === 'forgot' && (
          <button onClick={() => setView('login')} className="w-full mt-4 text-gray-400 text-sm hover:text-white">Back to Login</button>
        )}
      </div>
    </div>
  );
}