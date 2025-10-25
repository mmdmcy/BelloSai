import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Home, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SuccessPageProps {}

export default function Success(props: SuccessPageProps) {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user, isAuthReady } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [credited, setCredited] = useState<{ light: number; medium: number; heavy: number } | null>(null);

  const pollTokenBalances = useCallback(async (maxAttempts = 20, delayMs = 3000) => {
    if (!user) return null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data, error } = await supabase
        .from('user_token_balances')
        .select('light_credits, medium_credits, heavy_credits')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && data) {
        const total = (data.light_credits || 0) + (data.medium_credits || 0) + (data.heavy_credits || 0);
        if (total > 0) {
          setCredited({
            light: data.light_credits || 0,
            medium: data.medium_credits || 0,
            heavy: data.heavy_credits || 0,
          });
          return data;
        }
      }
      // wait
      await new Promise(r => setTimeout(r, delayMs));
    }
    return null;
  }, [user]);

  const processPayment = useCallback(async () => {
    if (!sessionId || !user || !isAuthReady || processingComplete) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // 1) Verify session (works for both subscription and one-time payments)
      console.log('Verifying payment session...');
      const { StripeService } = await import('../lib/stripeService');
      
      const verifyResult = await StripeService.verifyPaymentSession(sessionId);
      console.log('Session verification result:', verifyResult);

      // 2) Try to fulfill credits on-demand (idempotent) to avoid waiting for webhook delays
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { getRuntimeEnv } = await import('../lib/runtime-env');
        const { VITE_SUPABASE_URL } = getRuntimeEnv();
        const resp = await fetch(`${VITE_SUPABASE_URL}/functions/v1/stripe-fulfill-bundle`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });
        if (resp.ok) {
          const result = await resp.json();
          console.log('Fulfill result:', result);
        } else {
          console.warn('Fulfill endpoint returned non-OK');
        }
      } catch (e) {
        console.warn('Fulfill call failed:', e);
      }

      // 3) Poll for balances to appear
      const balances = await pollTokenBalances();
      if (balances) {
        try {
          localStorage.setItem('bellosai-token-balances', JSON.stringify({
            light: balances.light_credits || 0,
            medium: balances.medium_credits || 0,
            heavy: balances.heavy_credits || 0,
          }));
        } catch {}
        setProcessingComplete(true);
        return;
      }

      // If credits didn’t appear yet, show soft error with retry option
      setProcessingComplete(false);
      throw new Error('Credits not visible yet');
    } catch (err) {
      console.error('Error processing payment success:', err);
      
      // Als het de eerste keer niet lukt, probeer nog een keer
      if (retryCount < 2) {
        console.log(`Retry attempt ${retryCount + 1}`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => processPayment(), 2000);
        return;
      }
      
      setError('Payment succeeded, but credits are not visible yet. This can take a minute. You can retry below.');
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, user, isAuthReady, pollTokenBalances, retryCount, processingComplete]);

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
          {credited && (
            <div className="mt-3 text-sm text-gray-700">
              Added credits — Light: {credited.light}, Medium: {credited.medium}, Heavy: {credited.heavy}
            </div>
          )}
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

        <p className="text-xs text-gray-500 mt-6">Payments are one-time purchases of credits. No subscriptions.</p>
      </div>
    </div>
  );
} 
