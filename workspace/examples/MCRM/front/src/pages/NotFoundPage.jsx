import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4" dir="rtl">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 font-cairo mb-2">
                404
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-tajawal mb-6">
                الصفحة غير موجودة
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                    to="/"
                    className="px-6 py-3 rounded-xl bg-brand-red-600 hover:bg-brand-red-700 text-white font-cairo font-medium transition-colors"
                >
                    العودة للرئيسية
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;
