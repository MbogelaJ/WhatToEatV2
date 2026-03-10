import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Shield, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { paymentsApi } from '../api';

export default function SubscribePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser, isPremium, hasCompletedOnboarding } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [polling, setPolling] = useState(false);

  const sessionId = searchParams.get('session_id');

  // Redirect unauthenticated users (without session_id) to onboarding
  useEffect(() => {
    if (!sessionId && !hasCompletedOnboarding()) {
      navigate('/onboarding', { replace: true });
    }
  }, [sessionId, hasCompletedOnboarding, navigate]);

  // Poll for payment status when returning from Stripe
  useEffect(() => {
    if (sessionId && !paymentStatus) {
      pollPaymentStatus(sessionId);
    }
  }, [sessionId]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setPaymentStatus('timeout');
      setPolling(false);
      return;
    }

    setPolling(true);

    try {
      const response = await paymentsApi.getStatus(sessionId);
      const data = response.data;

      if (data.payment_status === 'paid') {
        setPaymentStatus('success');
        setPolling(false);
        // Update user to premium
        updateUser({ isPremium: true, premiumPurchasedAt: new Date().toISOString() });
        return;
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
        setPolling(false);
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (err) {
      console.error('Error checking payment status:', err);
      if (attempts < maxAttempts - 1) {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
      } else {
        setPaymentStatus('error');
        setPolling(false);
      }
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const originUrl = window.location.origin;
      const userId = user?.id || `guest_${Date.now()}`;
      const response = await paymentsApi.createCheckout(originUrl, userId);

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.detail || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  // Already premium
  if (isPremium()) {
    return (
      <div className="max-w-md mx-auto px-4 py-12" data-testid="already-premium">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">You're Already Premium!</h1>
          <p className="text-stone-600 mb-6">
            You have access to all premium features.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Payment success
  if (paymentStatus === 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-12" data-testid="payment-success">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Payment Successful!</h1>
          <p className="text-stone-600 mb-6">
            Thank you for upgrading to Premium. Enjoy all the features!
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-lg"
            data-testid="get-started-btn"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  // Payment failed/expired
  if (paymentStatus === 'expired' || paymentStatus === 'error' || paymentStatus === 'timeout') {
    return (
      <div className="max-w-md mx-auto px-4 py-12" data-testid="payment-failed">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="text-red-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Payment Not Completed</h1>
          <p className="text-stone-600 mb-6">
            {paymentStatus === 'timeout' 
              ? 'Payment verification timed out. Please check your email for confirmation.'
              : 'Your payment was not completed. Please try again.'}
          </p>
          <button
            onClick={() => {
              setPaymentStatus(null);
              navigate('/subscribe', { replace: true });
            }}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Polling state
  if (polling) {
    return (
      <div className="max-w-md mx-auto px-4 py-12" data-testid="payment-processing">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader className="text-emerald-600 animate-spin" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Processing Payment...</h1>
          <p className="text-stone-600">
            Please wait while we confirm your payment.
          </p>
        </div>
      </div>
    );
  }

  // Checkout page
  return (
    <div className="max-w-md mx-auto px-4 py-6" data-testid="subscribe-page">
      <h1 className="text-2xl font-bold text-stone-800 mb-6 text-center">Complete Your Purchase</h1>

      {/* Order Summary */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 mb-6">
        <h2 className="font-semibold text-stone-800 mb-4">Order Summary</h2>
        
        <div className="flex justify-between items-center py-3 border-b border-stone-100">
          <div>
            <p className="font-medium text-stone-800">WhatToEat Premium</p>
            <p className="text-sm text-stone-500">12 months access</p>
          </div>
          <p className="font-semibold text-stone-800">$0.99</p>
        </div>

        <div className="flex justify-between items-center py-3">
          <p className="font-medium text-stone-800">Total</p>
          <p className="text-xl font-bold text-emerald-600">$0.99</p>
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-stone-50 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Shield className="text-stone-400 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm text-stone-600">
            Your payment is secured by Stripe. We never store your card details.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="checkout-btn"
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={20} />
            Processing...
          </>
        ) : (
          <>
            <CreditCard size={20} />
            Pay $0.99 with Stripe
          </>
        )}
      </button>

      {/* Cancel Link */}
      <button
        onClick={() => navigate('/premium')}
        className="w-full mt-4 py-2 text-stone-500 text-sm hover:text-stone-700 transition-colors"
      >
        Cancel
      </button>

      {/* Payment Methods */}
      <div className="mt-6 flex items-center justify-center gap-2 text-stone-400">
        <span className="text-xs">Powered by</span>
        <span className="font-semibold text-stone-500">Stripe</span>
      </div>
    </div>
  );
}
