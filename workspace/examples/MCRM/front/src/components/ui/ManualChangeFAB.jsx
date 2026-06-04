import { Edit } from 'lucide-react';

const ManualChangeFAB = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            aria-label="تغيير يدوي"
        >
            <Edit className="w-6 h-6" />
        </button>
    );
};

export default ManualChangeFAB;

