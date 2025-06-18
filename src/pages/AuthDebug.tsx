import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function AuthDebug() {
  const { user, session, loading, signOut, isAuthReady } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user && !data.session) {
        setSuccess(`Registratie succesvol! Controleer je email (${email}) voor bevestiging.`);
      } else {
        setSuccess('Registratie en login succesvol!');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      setSuccess('Login succesvol!');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSuccess('Uitgelogd!');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Auth Debug</h1>
          <p className="text-gray-600 mt-2">Supabase Authenticatie Test</p>
        </div>

        {/* Auth Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Auth Status</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Loading:</strong> {loading ? 'Ja' : 'Nee'}</p>
            <p><strong>Auth Ready:</strong> {isAuthReady ? 'Ja' : 'Nee'}</p>
            <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
            <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
            <p><strong>Full Name:</strong> {user?.user_metadata?.full_name || 'N/A'}</p>
            <p><strong>Session:</strong> {session ? 'Active' : 'No session'}</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
            {success}
          </div>
        )}

        {!user ? (
          <div className="space-y-6">
            {/* Sign Up Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <h3 className="text-lg font-semibold">Registreren</h3>
              <input
                type="text"
                placeholder="Volledige naam"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Wachtwoord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {authLoading ? 'Bezig...' : 'Registreren'}
              </button>
            </form>

            <hr />

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <h3 className="text-lg font-semibold">Inloggen</h3>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="password"
                placeholder="Wachtwoord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {authLoading ? 'Bezig...' : 'Inloggen'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
                              <h3 className="text-lg font-semibold text-green-800">Welcome!</h3>
                              <p className="text-green-700">You are logged in as: {user.email}</p>
              {user.user_metadata?.full_name && (
                <p className="text-green-700">Naam: {user.user_metadata.full_name}</p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700"
            >
              Uitloggen
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Terug naar hoofdpagina
          </a>
        </div>
      </div>
    </div>
  );
} 
