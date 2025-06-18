import React, { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { CheckCircle, Home, Loader2 } from 'lucide-react';

interface SuccessPageProps {}

export default function Success(props: SuccessPageProps) {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user, isAuthReady } = useAuth();
  const { refreshSubscription, hasActiveSubscription, loading } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      if (!sessionId || !user || !isAuthReady) {
        setIsProcessing(false);
        return;
      }

      try {
        // Wacht even om de webhook tijd te geven om te verwerken
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh subscription data
        await refreshSubscription();
        
        setIsProcessing(false);
      } catch (err) {
        console.error('Error processing payment success:', err);
        setError('Er was een probleem bij het verwerken van je betaling. Controleer je account of neem contact op met support.');
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [sessionId, user, isAuthReady, refreshSubscription]);

  // Redirect naar home als er geen session ID is
  if (!sessionId) {
    return <Navigate to="/" replace />;
  }

  // Wacht tot auth en processing klaar zijn
  if (!isAuthReady || isProcessing || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Bezig met verwerken van je betaling...
          </h2>
          <p className="text-gray-600">
            Dit kan even duren. We bevestigen je abonnement.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Er ging iets mis
          </h1>
          <p className="text-gray-600 mb-8">
            {error}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Terug naar home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Betaling Geslaagd! 🎉
        </h1>
        
        <p className="text-gray-600 mb-2">
          Welkom bij BelloSai Pro!
        </p>
        
        {hasActiveSubscription ? (
          <p className="text-green-600 font-medium mb-8">
            Je abonnement is actief en klaar voor gebruik.
          </p>
        ) : (
          <p className="text-orange-600 font-medium mb-8">
            Je abonnement wordt binnenkort geactiveerd.
          </p>
        )}

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Wat krijg je nu?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Onbeperkte AI berichten</li>
              <li>✅ Toegang tot alle AI modellen</li>
              <li>✅ Prioriteit support</li>
              <li>✅ Geavanceerde functies</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Start chatten
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Je kunt je abonnement beheren via je account instellingen.
        </p>
      </div>
    </div>
  );
} 