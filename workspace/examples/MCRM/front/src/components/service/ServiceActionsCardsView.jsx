import ServiceActionCard from './ServiceActionCard';
import { EmptyState } from '../';

export default function ServiceActionsCardsView({
    tickets,
    loading,
    onAction,
    onStatusChange,
    onRefresh
}) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-600">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                    <div className="text-center">
                        <h3 className="font-cairo font-semibold text-gray-900 dark:text-gray-100">
                            جاري تحميل البيانات...
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-cairo mt-1">
                            يرجى الانتظار قليلاً
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!tickets || tickets.length === 0) {
        return (
            <EmptyState
                icon={
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                }
                title="لا توجد إجراءات خدمة حالياً"
                description="يمكنك البحث عن عميل أو إنشاء خدمة جديدة من خلال الشريط الجانبي"
                size="medium"
            />
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((action) => (
                <ServiceActionCard
                    key={action.id || action._id}
                    action={action}
                    onAction={onAction}
                    onStatusChange={onStatusChange}
                    onRefresh={onRefresh}
                />
            ))}
        </div>
    );
}
