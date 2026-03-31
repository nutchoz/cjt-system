import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/context/auth';

/**
 * ProtectedRoute - A wrapper component that restricts access to authenticated users only.
 * Redirects unauthenticated users to the login page, and shows a full-screen
 * loading spinner while the auth state is being resolved.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    // Retrieve authentication state and loading status from the auth context
    const { isAuthenticated, isLoading } = useAuth();

    // If auth check is complete and user is not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            {/* Render the protected page content */}
            {children}

            {/* Show a full-screen overlay spinner while authentication state is loading */}
            {isLoading && (
                <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-[9999]">
                    <svg className="animate-spin w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24">
                        {/* Spinner track (faint circle) */}
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        {/* Spinner indicator (moving arc) */}
                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            )}
        </>
    );
};

export default ProtectedRoute;