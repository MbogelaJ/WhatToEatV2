import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Loader } from 'lucide-react';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useUser();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL hash
        const hash = window.location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          console.error('No session_id found in URL');
          navigate('/onboarding', { replace: true });
          return;
        }

        const sessionId = sessionIdMatch[1];
        
        // Exchange session_id for user data via backend
        const result = await loginWithGoogle(sessionId);
        
        if (result.success) {
          // Check if user needs to complete onboarding (profile setup)
          if (result.user?.onboarding_completed || result.user?.age) {
            // User has completed profile - check premium status
            if (result.user?.is_premium) {
              navigate('/', { replace: true });
            } else {
              navigate('/premium', { replace: true });
            }
          } else {
            // New user - needs to complete profile (skip to step 3)
            sessionStorage.setItem('google_auth_user', JSON.stringify(result.user));
            sessionStorage.setItem('skip_to_profile', 'true');
            navigate('/onboarding', { replace: true, state: { skipToProfile: true } });
          }
        } else {
          console.error('Google auth failed:', result.error);
          navigate('/onboarding', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/onboarding', { replace: true });
      }
    };

    processAuth();
  }, [navigate, loginWithGoogle]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
        <p className="text-stone-600">Completing sign in...</p>
      </div>
    </div>
  );
}
