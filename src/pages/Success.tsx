import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { CheckCircle, Home, Loader2, RefreshCw } from 'lucide-react';

interface SuccessPageProps {}

export default function Success(props: SuccessPageProps) {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user, isAuthReady } = useAuth();
  const { refreshSubscription, hasActiveSubscription, loading } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);

  const processPayment = useCallback(async () => {
    if (!sessionId || !user || !isAuthReady || processingComplete) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Stap 1: Probeer direct session verificatie via Stripe API
      console.log('Verifying payment session...');
      const { StripeService } = await import('../lib/stripeService');
      
      const verifyResult = await StripeService.verifyPaymentSession(sessionId);
      console.log('Session verification result:', verifyResult);

      if (verifyResult.success) {
        // Session was succesvol geverifieerd
        if (verifyResult.subscriptionActive) {
          // Subscription is al actief
          await refreshSubscription();
          setProcessingComplete(true);
          return;
        } else {
          // Betaling succesvol maar subscription nog niet actief
          console.log('Payment successful, waiting for subscription activation...');
        }
      }

      // Stap 2: Wacht voor webhook verwerking als directe verificatie niet volledig lukte
      console.log('Waiting for webhook processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Stap 3: Refresh subscription data
      console.log('Refreshing subscription data...');
      await refreshSubscription();
      
      // Stap 4: Extra controle na refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingComplete(true);
    } catch (err) {
      console.error('Error processing payment success:', err);
      
      // Als het de eerste keer niet lukt, probeer nog een keer
      if (retryCount < 2) {
        console.log(`Retry attempt ${retryCount + 1}`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => processPayment(), 2000);
        return;
      }
      
      setError('Er was een probleem bij het verwerken van je betaling. Je betaling is waarschijnlijk succesvol, maar het kan even duren voordat je abonnement wordt geactiveerd.');
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, user, isAuthReady, refreshSubscription, retryCount, processingComplete]);

  useEffect(() => {
    processPayment();
  }, [processPayment]);

  // Redirect naar home als er geen session ID is
  if (!sessionId) {
    return <Navigate to="/" replace />;
  }

  // Wacht tot auth en processing klaar zijn
  if (!isAuthReady || (isProcessing && !processingComplete)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Bezig met verwerken van je betaling...
          </h2>
          <p className="text-gray-600 mb-4">
            We bevestigen je abonnement. Dit kan 5-10 seconden duren.
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-purple-600">
              Poging {retryCount + 1} van 3...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Bijna klaar...
          </h1>
          <p className="text-gray-600 mb-8">
            {error}
          </p>
          <div className="space-y-4">
            <button
              onClick={() => {
                setError(null);
                setRetryCount(0);
                setProcessingComplete(false);
                processPayment();
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Probeer opnieuw
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              Ga door naar de app
            </button>
          </div>
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
            ✅ Je abonnement is actief en klaar voor gebruik.
          </p>
        ) : (
          <div className="mb-8">
            <p className="text-orange-600 font-medium mb-2">
              ⏳ Je abonnement wordt binnenkort geactiveerd.
            </p>
            <p className="text-sm text-gray-500">
              Het kan 1-2 minuten duren voordat alle functies beschikbaar zijn.
            </p>
          </div>
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