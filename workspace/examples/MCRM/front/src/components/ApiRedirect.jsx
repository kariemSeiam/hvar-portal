import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * ApiRedirect Component
 * Only redirects API paths (starting with /api/) to the backend
 * For non-API paths, this should not be reached (NotFoundPage handles those)
 */
const ApiRedirect = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const path = location.pathname;
        
        // Only redirect if path starts with /api/
        // This prevents infinite loops for non-API routes
        if (path.startsWith('/api/')) {
            // Get API base URL based on environment mode
            // Production: use VITE_APP_API_URL
            // Development: use VITE_APP_API_URL_DEV
            let apiBaseUrl;

            if (import.meta.env.PROD) {
                // Production: use VITE_APP_API_URL
                apiBaseUrl = import.meta.env.VITE_APP_API_URL || window.location.origin;
            } else {
                // Development: use VITE_APP_API_URL_DEV
                apiBaseUrl = import.meta.env.VITE_APP_API_URL_DEV || window.location.origin;
            }

            // Get the current path and redirect to API
            const apiUrl = `${apiBaseUrl}${path}${location.search}`;

            // Redirect to the API endpoint
            window.location.href = apiUrl;
        } else {
            // If it's not an API path, redirect to 404 page
            // This should not happen if routing is correct, but as a safety measure
            navigate('/404', { replace: true });
        }
    }, [location, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400" dir="rtl">
                    جاري التوجيه إلى الخادم...
                </p>
            </div>
        </div>
    );
};

export default ApiRedirect;
