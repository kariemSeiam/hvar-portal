import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { Logo } from '../components/layout';

/**
 * 404 Not Found page
 */
const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="lg" showText={true} />
        </div>
        
        {/* Error message */}
        <div>
          <h1 className="mt-2 text-9xl font-extrabold text-brand-red-600">
            404
          </h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            الصفحة غير موجودة
          </h2>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.
          </p>
        </div>
        
        {/* Back to home button */}
        <div className="mt-8">
          <Link to="/">
            <Button variant="primary" size="lg">
              العودة إلى الصفحة الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 