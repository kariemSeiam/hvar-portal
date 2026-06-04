import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CallSessionProvider, useCallSession } from './contexts/CallSessionContext';
import { Toaster, ToastBar, toast } from 'react-hot-toast';

const ServiceActionsPage = lazy(() => import('./components/service/ServiceActionsPage'));
const StockManagementPage = lazy(() => import('./pages/StockManagementPage'));
const HubPage = lazy(() => import('./pages/HubPage'));
const CustomerServicePage = lazy(() => import('./pages/CustomerServicePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ApiRedirect = lazy(() => import('./components/ApiRedirect'));

// Global FAB — rendered at root so it survives all route changes
const CallSessionFAB = lazy(() => import('./components/call-center/CallSessionFAB'));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300" aria-busy="true">
      <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin" />
    </div>
  );
}

// Redirects: /login when authenticated → /; other routes when not authenticated → /login
function AuthGuard() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  if (pathname === '/login') {
    if (isAuthenticated) return <Navigate to="/" replace />;
    return <Outlet />;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Renders the persistent global call FAB using the global context
function GlobalCallFAB() {
  const { activeCallSession, endCallSession, sessionEpoch } = useCallSession();

  // Show FAB when we have a session: order-based (Path A) or direct call with customerContext (Path B)
  if (!activeCallSession) return null;
  if (!activeCallSession.order && !activeCallSession.customerContext) return null;

  return (
    <Suspense fallback={null}>
      <CallSessionFAB
        key={sessionEpoch}
        order={activeCallSession.order}
        customerContext={activeCallSession.customerContext}
        onClose={endCallSession}
        onComplete={endCallSession}
        onModification={() => { }}
      />
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider initialRTL={true}>
        <CallSessionProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route element={<AuthGuard />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<HubPage />} />
                    <Route path="/services" element={<ServiceActionsPage />} />
                    <Route path="/stock" element={<StockManagementPage />} />
                    <Route path="/customer-service" element={<CustomerServicePage />} />
                    <Route path="/venom" element={<UsersPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/404" element={<NotFoundPage />} />
                    {/* API routes - redirect to backend */}
                    <Route path="/api/*" element={<ApiRedirect />} />
                    {/* All other routes - show 404 page */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </Suspense>
            </div>

            {/* ✅ Global Call Session FAB — persists across ALL pages */}
            <GlobalCallFAB />

            <Toaster
              position="top-center"
              reverseOrder={false}
              containerClassName=""
              containerStyle={{}}
              toastOptions={{
                className: '',
                duration: 3000,
                style: {
                  background: 'var(--color-bg-card-light)',
                  color: 'var(--color-gray-900)',
                  border: '1px solid var(--color-gray-200)',
                  boxShadow: 'var(--shadow-md)',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  maxWidth: '90vw',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  direction: 'rtl'
                },
                success: {
                  duration: 2500,
                },
              }}
            >
              {(t) => (
                <ToastBar toast={t}>
                  {({ icon, message }) => (
                    <div className="flex items-center gap-3">
                      {icon}
                      <div className="truncate" dir="rtl">{message}</div>
                      <button
                        aria-label="إغلاق"
                        onClick={() => toast.dismiss(t.id)}
                        className="ml-2 rounded p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </ToastBar>
              )}
            </Toaster>
          </Router>
        </CallSessionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
