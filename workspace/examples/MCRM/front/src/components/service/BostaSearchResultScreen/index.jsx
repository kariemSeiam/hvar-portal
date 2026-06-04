/**
 * BostaSearchResultScreen - Two-panel layout after Bosta search
 * Redesigned with ServiceModalViewer-inspired design, draft support
 */
import BostaIdentityPanel from './BostaIdentityPanel';
import BostaContentPanel from './BostaContentPanel';
import BostaSearchResultSkeleton from './BostaSearchResultSkeleton';

export default function BostaSearchResultScreen({
    isSearching,
    customerData,
    customerOrders,
    existingServices,
    selectedOrder,
    searchQuery,
    copiedPhone,
    newCustomerData,
    customerFormErrors,
    isCreatingCustomer,
    onCopyPhone,
    onViewTicket,
    onClose,
    onOrderSelect,
    onCustomerFormChange,
    onCreateCustomer,
}) {
    if (isSearching) {
        return <BostaSearchResultSkeleton />;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 w-full min-w-0" dir="rtl">
            {/* Panel A - Identity (1 col); Panel B - Content (2 cols). Vertical stack on small; 2×1 row that fills on lg+ */}
            <div className="min-w-0 flex flex-col">
                <BostaIdentityPanel
                    customerData={customerData}
                    customerOrders={customerOrders}
                    existingServices={existingServices}
                    copiedPhone={copiedPhone}
                    onCopyPhone={onCopyPhone}
                    onViewTicket={onViewTicket}
                    onClose={onClose}
                    searchQuery={searchQuery}
                />
            </div>

            {/* Panel B - Tickets + orders; fills second column */}
            <div className="min-w-0 flex flex-col">
                <BostaContentPanel
                    customerData={customerData}
                    customerOrders={customerOrders}
                    existingServices={existingServices}
                    selectedOrder={selectedOrder}
                    newCustomerData={newCustomerData}
                    customerFormErrors={customerFormErrors}
                    isCreatingCustomer={isCreatingCustomer}
                    onViewTicket={onViewTicket}
                    onOrderSelect={onOrderSelect}
                    onCustomerFormChange={onCustomerFormChange}
                    onCreateCustomer={onCreateCustomer}
                    onClose={onClose}
                />
            </div>
        </div>
    );
}
