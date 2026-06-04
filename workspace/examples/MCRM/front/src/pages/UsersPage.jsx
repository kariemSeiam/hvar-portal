/**
 * UsersPage — venom masterpiece
 * Admin-only user management: add, delete, reset password.
 * Design genome: LoginPage gradients, ServiceModalWrapper, EmptyState, RTL Arabic.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/axios';
import PageHeader from '../components/layout/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { ServiceModalWrapper, ServiceModalHeader } from '../components/modals/shared';
import {
  RefreshCw,
  UserPlus,
  Trash2,
  Key,
  Phone,
  Lock,
  User,
  Shield,
  Crown,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { isAdminRole } from '../utils/authRoles';



const UsersPage = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showResetModal, setShowResetModal] = useState(null);
  const [addForm, setAddForm] = useState({ phone: '', password: '', name: '', role: 'agent' });
  const [resetPassword, setResetPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdminRole(userInfo?.role)) {
      navigate('/', { replace: true });
      return;
    }
  }, [userInfo, navigate]);

  const fetchUsers = useCallback(async () => {
    if (!isAdminRole(userInfo?.role)) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get('/api/auth/users');
      setUsers(data.users || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [userInfo?.role]);

  useEffect(() => {
    if (isAdminRole(userInfo?.role)) {
      fetchUsers();
    }
  }, [userInfo?.role, fetchUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!addForm.phone?.trim() || !addForm.password?.trim() || !addForm.name?.trim()) {
      toast.error('أدخل رقم الهاتف وكلمة المرور والاسم');
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post('/api/auth/users', {
        phone: addForm.phone.trim(),
        password: addForm.password.trim(),
        name: addForm.name.trim(),
        role: addForm.role || 'agent',
      });
      toast.success('تم إضافة المستخدم');
      setShowAddModal(false);
      setAddForm({ phone: '', password: '', name: '', role: 'agent' });
      fetchUsers();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'فشل إضافة المستخدم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!showDeleteModal) return;
    setSubmitting(true);
    try {
      await axiosInstance.delete(`/api/auth/users/${showDeleteModal.id}`);
      toast.success('تم حذف المستخدم');
      setShowDeleteModal(null);
      fetchUsers();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'فشل حذف المستخدم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (isAdminRole(user.role) || user.role === newRole) return;
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/api/auth/users/${user.id}`, { role: newRole });
      toast.success('تم تحديث الدور');
      fetchUsers();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'فشل تحديث الدور');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!showResetModal || !resetPassword?.trim()) {
      toast.error('أدخل كلمة المرور الجديدة');
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/api/auth/users/${showResetModal.id}/reset-password`, {
        password: resetPassword.trim(),
      });
      toast.success('تم تغيير كلمة المرور');
      setShowResetModal(null);
      setResetPassword('');
      fetchUsers();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'فشل تغيير كلمة المرور');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdminRole(userInfo?.role)) {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
      dir="rtl"
    >
      {/* Gradient accents — LoginPage genome */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-0 right-0 w-[min(100%,480px)] h-[min(100%,420px)] bg-brand-blue-500/5 dark:bg-brand-blue-500/10 rounded-bl-[40%]" />
        <div className="absolute bottom-0 left-0 w-[min(100%,320px)] h-[min(100%,280px)] bg-brand-red-500/5 dark:bg-brand-red-500/10 rounded-tr-[30%]" />
      </div>

      <PageHeader
        title="venom"
        rightControls={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red-600 hover:bg-brand-red-700 text-white font-cairo text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <UserPlus className="w-4 h-4" />
              إضافة مستخدم
            </button>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-cairo text-sm disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>
        }
      />

      <div className="relative p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {error && (
          <div
            className="mb-6 p-4 rounded-xl border border-brand-red-200 dark:border-brand-red-800 bg-brand-red-50 dark:bg-brand-red-900/20 text-brand-red-700 dark:text-brand-red-300 font-cairo text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-brand-blue-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
            <EmptyState
              icon={<UserPlus className="w-10 h-10" />}
              title="لا يوجد مستخدمين"
              description="أضف أول مستخدم للبدء"
              variant="cool"
              action={{
                label: 'إضافة مستخدم',
                onClick: () => setShowAddModal(true),
              }}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden transition-all hover:shadow-xl hover:border-brand-blue-200 dark:hover:border-brand-blue-800"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        u.role === 'team_leader'
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300'
                          : 'bg-brand-blue-100 dark:bg-brand-blue-900/40 text-brand-blue-700 dark:text-brand-blue-300'
                      }`}
                    >
                      {isAdminRole(u.role) ? (
                        <Crown className="w-6 h-6" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 font-cairo text-sm sm:text-base">
                          {u.name}
                        </h3>
                        {isAdminRole(u.role) ? (
                          <span
                            className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          >
                            قائد
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            disabled={submitting}
                            className="px-2 py-0.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-cairo focus:outline-none focus:ring-2 focus:ring-brand-blue-500 disabled:opacity-60"
                          >
                            <option value="agent">وكيل</option>
                            <option value="team_leader">قائد</option>
                          </select>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 font-cairo">
                        <span className="flex items-center gap-1" dir="ltr">
                          <Phone className="w-3.5 h-3.5" />
                          {u.phone}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-cairo">
                          <Lock className="w-3.5 h-3.5 flex-shrink-0 opacity-70" aria-hidden />
                          كلمة المرور غير معروضة — استخدم «كلمة المرور» لتغييرها
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isAdminRole(u.role) && (
                      <>
                        <button
                          onClick={() => setShowResetModal(u)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-brand-blue-600 dark:text-brand-blue-400 hover:bg-brand-blue-50 dark:hover:bg-brand-blue-900/30 font-cairo text-sm transition-colors"
                          title="إعادة تعيين كلمة المرور"
                        >
                          <Key className="w-4 h-4" />
                          <span className="hidden sm:inline">كلمة المرور</span>
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(u)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-brand-red-600 dark:text-brand-red-400 hover:bg-brand-red-50 dark:hover:bg-brand-red-900/30 font-cairo text-sm transition-colors"
                          title="حذف المستخدم"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">حذف</span>
                        </button>
                      </>
                    )}
                    {isAdminRole(u.role) && (
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-cairo">
                        <Shield className="w-3.5 h-3.5" />
                        المشرف
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <ServiceModalWrapper isOpen={true} onClose={() => !submitting && setShowAddModal(false)} maxWidth="max-w-md">
          <ServiceModalHeader
            title="إضافة مستخدم"
            icon={UserPlus}
            iconBgColor="bg-brand-red-600"
            onClose={() => !submitting && setShowAddModal(false)}
            isSubmitting={submitting}
          />
          <form onSubmit={handleAddUser} className="p-4 sm:p-5 space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo mb-1.5">الاسم</span>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="اسم المستخدم"
                  className="w-full min-h-[44px] pr-11 pl-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 font-cairo text-base focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  dir="rtl"
                />
              </div>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo mb-1.5">رقم الهاتف</span>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="tel"
                  inputMode="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="01xxxxxxxxx"
                  className="w-full min-h-[44px] pr-11 pl-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 font-cairo text-base focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo mb-1.5">كلمة المرور</span>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={addForm.password}
                  onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] pr-11 pl-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 font-cairo text-base focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo mb-1.5">الدور</span>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full min-h-[44px] px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-cairo text-base focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                <option value="agent">وكيل</option>
                <option value="team_leader">قائد</option>
              </select>
            </label>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
                className="flex-1 min-h-[44px] px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-cairo font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 min-h-[44px] px-4 rounded-xl bg-brand-red-600 hover:bg-brand-red-700 text-white font-cairo font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إضافة'}
              </button>
            </div>
          </form>
        </ServiceModalWrapper>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ServiceModalWrapper isOpen={true} onClose={() => !submitting && setShowDeleteModal(null)} maxWidth="max-w-sm">
          <ServiceModalHeader
            title="حذف المستخدم"
            subtitle={showDeleteModal.name}
            icon={Trash2}
            iconBgColor="bg-brand-red-600"
            onClose={() => !submitting && setShowDeleteModal(null)}
            isSubmitting={submitting}
          />
          <div className="p-4 sm:p-5 space-y-4">
            <p className="text-gray-600 dark:text-gray-400 font-cairo text-sm">
              هل أنت متأكد من حذف المستخدم <strong className="text-gray-900 dark:text-gray-100">{showDeleteModal.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(null)}
                disabled={submitting}
                className="flex-1 min-h-[44px] px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-cairo font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={submitting}
                className="flex-1 min-h-[44px] px-4 rounded-xl bg-brand-red-600 hover:bg-brand-red-700 text-white font-cairo font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حذف'}
              </button>
            </div>
          </div>
        </ServiceModalWrapper>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <ServiceModalWrapper isOpen={true} onClose={() => !submitting && setShowResetModal(null)} maxWidth="max-w-md">
          <ServiceModalHeader
            title="إعادة تعيين كلمة المرور"
            subtitle={showResetModal.name}
            icon={Key}
            iconBgColor="bg-brand-blue-600"
            onClose={() => !submitting && setShowResetModal(null)}
            isSubmitting={submitting}
          />
          <form onSubmit={handleResetPassword} className="p-4 sm:p-5 space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo mb-1.5">كلمة المرور الجديدة</span>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] pr-11 pl-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 font-cairo text-base focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </label>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(null)}
                disabled={submitting}
                className="flex-1 min-h-[44px] px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-cairo font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting || !resetPassword?.trim()}
                className="flex-1 min-h-[44px] px-4 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-cairo font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تغيير'}
              </button>
            </div>
          </form>
        </ServiceModalWrapper>
      )}
    </div>
  );
};

export default UsersPage;
