import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ui';
import { Layout } from './components/layout';

// Context providers
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { OrdersProvider } from './context/OrdersContext';

// Loading components
import { PageLoading } from './components/ui/Loading';

// Pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const CustomersPage = React.lazy(() => import('./pages/CustomersPage'));
const CustomerDetailPage = React.lazy(() => import('./pages/CustomerDetailPage'));
const AICustomersPage = React.lazy(() => import('./pages/AICustomersPage'));
const CustomerServicePage = React.lazy(() => import('./pages/customer-service/CustomerServicePage'));
const ServiceRequestsPage = React.lazy(() => import('./pages/customer-service/ServiceRequestsPage'));
const ServiceRequestForm = React.lazy(() => import('./pages/customer-service/ServiceRequestForm'));
const RequestDetailPage = React.lazy(() => import('./pages/customer-service/RequestDetailPage'));
const CallCenterPage = React.lazy(() => import('./pages/call-center/CallCenterPage'));
const AnalyticsPage = React.lazy(() => import('./pages/analytics/AnalyticsPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Orders Pages
const OrdersPage = React.lazy(() => import('./pages/orders/OrdersPage'));
const OrdersAnalyticsPage = React.lazy(() => import('./pages/orders/OrdersAnalyticsPage'));

// Hub Scanning Pages
const HubScanningPage = React.lazy(() => import('./pages/hub-scanning/HubScanningPage'));

// Service Actions Pages
const ServiceActionsPage = React.lazy(() => import('./pages/service-actions/ServiceActionsPage'));

// Service Management Pages
const ServiceManagementPage = React.lazy(() => import('./pages/service-management/ServiceManagementPage'));

// Maintenance Pages
const MaintenancePage = React.lazy(() => import('./pages/maintenance/MaintenancePage'));

//Products Pages
const ProductsPage = React.lazy(() => import('./pages/products/ProductsPage'));

// Stock Management Pages
const StockPage = React.lazy(() => import('./pages/stock/StockPage'));
const StockDashboard = React.lazy(() => import('./pages/stock/StockDashboard'));
const StockAnalyticsPage = React.lazy(() => import('./pages/stock/StockAnalyticsPage'));
const StockMovementsPage = React.lazy(() => import('./pages/stock/StockMovementsPage'));

// Clean loading fallback using our new loading system
const LoadingFallback = () => (
  <PageLoading text="جاري تحميل الصفحة..." />
);

// Auth guard for protected routes
const ProtectedRoute = ({ children }) => {
  // For demo purposes, just checking if token exists
  const isAuthenticated = localStorage.getItem('token');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider defaultDirection="rtl" defaultTheme="light">
      <LoadingProvider>
        <OrdersProvider>
          <AuthProvider>
            <Router>
          <React.Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                
                {/* Customers routes */}
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/:phone" element={<CustomerDetailPage />} />
                <Route path="ai-customers/:phone" element={<AICustomersPage />} />
                
                {/* Orders routes - Main Orders Management */}
                <Route path="orders" element={<OrdersPage />} />
                <Route path="orders/analytics" element={<OrdersAnalyticsPage />} />
                
                {/* Hub Scanning routes */}
                <Route path="hub-scanning" element={<HubScanningPage />} />
                
                {/* Stock Management routes */}
                <Route path="stock" element={<StockDashboard />} />
                <Route path="stock/products" element={<StockPage />} />
                <Route path="stock/analytics" element={<StockAnalyticsPage />} />
                <Route path="stock/movements" element={<StockMovementsPage />} />

                {/* Customer service routes */}
                <Route path="customer-service" element={<CustomerServicePage />} />
                <Route path="customer-service/requests" element={<ServiceRequestsPage />} />
                <Route path="customer-service/requests/new" element={<ServiceRequestForm />} />
                <Route path="customer-service/requests/:id/edit" element={<ServiceRequestForm />} />
                <Route path="customer-service/requests/:id" element={<RequestDetailPage />} />
                
                {/* Call center routes */}
                <Route path="call-center" element={<CallCenterPage />} />
                
                {/* Analytics routes */}
                <Route path="analytics" element={<AnalyticsPage />} />

                {/* Service Actions routes */}
                <Route path="service-actions" element={<ServiceActionsPage />} />
                
                {/* Service Management routes */}
                <Route path="service-management" element={<ServiceManagementPage />} />

                {/* Maintenance routes */}
                <Route path="maintenance" element={<MaintenancePage />} />

                {/* Products routes */}
                <Route path="products" element={<ProductsPage />} />
              </Route>
              
              {/* Not found */}
                            <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </React.Suspense>
        </Router>
        </AuthProvider>
        </OrdersProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;