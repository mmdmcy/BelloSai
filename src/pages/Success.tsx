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
          // Subscription is already active
          await refreshSubscription();
          setProcessingComplete(true);
          return;
        } else {
          // Payment successful but subscription not yet active
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
      
      setError('There was a problem processing your payment. Your payment was likely successful, but it may take some time before your subscription is activated.');
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

        // Wait until auth and processing are ready
  if (!isAuthReady || (isProcessing && !processingComplete)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processing your payment...
          </h2>
          <p className="text-gray-600 mb-4">
            Confirming your payment. This may take a few seconds.
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-900">
              Attempt {retryCount + 1} of 3...
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
            Almost ready...
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
              className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              Continue to app
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
          Payment Successful! 🎉
        </h1>
        
        <p className="text-gray-600 mb-2">
          Thanks for your purchase!
        </p>
        
        <div className="mb-8">
          <p className="text-gray-700">
            Your credits will appear shortly. If you don't see them after a minute, refresh balances in your Account panel.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What's included</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Credits for the bundle you selected</li>
              <li>✅ Access to models in your bundle tier</li>
              <li>✅ Keep unused credits (no expiry)</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black transition-colors"
          >
            <Home className="w-5 h-5" />
            Start chatting
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          You can manage your subscription via your account settings.
        </p>
      </div>
    </div>
  );
} 
