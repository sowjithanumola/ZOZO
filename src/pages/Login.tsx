import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { MessageSquareCode, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const { error } = await supabase().auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error);
        alert(error.message);
      } else {
        navigate('/');
      }
    } else {
      const { error } = await supabase().auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        console.error('Signup error:', error);
        alert(error.message);
      } else {
        alert('Check your email for confirmation!');
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-100 to-sky-200">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <MessageSquareCode className="text-gray-900" size={24} />
        <span className="font-bold text-xl tracking-tight text-gray-900">ZOZO</span>
      </div>

      <form onSubmit={handleAuth} className="p-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 w-[400px]">
        <div className="flex justify-center mb-6">
          <div className="bg-white p-3 rounded-2xl shadow-sm">
            <MessageSquareCode className="text-blue-600" size={32} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">{isLogin ? 'Sign in' : 'Create account'}</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Welcome to ZOZO, let's get you started.</p>
        
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400" required />
          </div>
        </div>
        
        <button type="submit" className="w-full mt-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-gray-900/20">
          {isLogin ? 'Get Started' : 'Sign Up'}
        </button>
        
        <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-sm text-gray-400 hover:text-gray-900 transition-colors">
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </button>
      </form>
    </div>
  );
}
