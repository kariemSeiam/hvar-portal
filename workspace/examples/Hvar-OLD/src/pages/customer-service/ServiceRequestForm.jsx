import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Input } from '../../components/ui';
import api from '../../services/api';

// Icons
import {
  Save,
  ArrowLeft,
  Phone,
  User,
  Package,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  Search,
  Loader2
} from 'lucide-react';

/**
 * Service Request Form - Create or edit service request
 */
const ServiceRequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    phone: '',
    email: '',
    address: '',
    product_id: '',
    product_code: '',
    product_name: '',
    issue_description: '',
    priority_level: '2',
    appointment_date: '',
    appointment_time: '',
    notes: '',
    status: 'pending',
    warranty_status: false
  });
  
  // Products list (would be fetched from API)
  const [products, setProducts] = useState([]);
  
  // Fetch data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchRequestData = async () => {
        setLoading(true);
        try {
          // In a real app, this would be:
          // const data = await api.customerService.getRequest(id);
          
          // Mock data for demonstration
          await new Promise(resolve => setTimeout(resolve, 800));
          const mockData = {
            id: id,
            customer_id: '1001',
            customer_name: 'أحمد محمد',
            phone: '01023456789',
            email: 'ahmed@example.com',
            address: 'القاهرة، مصر',
            product_id: '101',
            product_code: 'HV-2000',
            product_name: 'مكيف هواء HVAR إكو',
            issue_description: 'جهاز التحكم عن بعد لا يعمل والوحدة لا تستجيب للأوامر',
            priority_level: '3',
            appointment_date: '2024-05-25',
            appointment_time: '10:30',
            notes: 'العميل سيكون متواجد في المنزل من الساعة 10 صباحا حتى 2 مساءً',
            status: 'pending',
            warranty_status: true
          };
          
          setFormData(mockData);
        } catch (error) {
          console.error('Error fetching request data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchRequestData();
    }
    
    // Fetch products list
    const fetchProducts = async () => {
      try {
        // In a real app, this would be:
        // const productsData = await api.customerService.getProducts();
        
        // Mock data for demonstration
        const mockProducts = [
          { id: '101', code: 'HV-1000', name: 'مكيف هواء HVAR ستاندرد' },
          { id: '102', code: 'HV-1500', name: 'مكيف هواء HVAR بريميوم' },
          { id: '103', code: 'HV-2000', name: 'مكيف هواء HVAR إكو' },
          { id: '104', code: 'HV-3000', name: 'مكيف هواء HVAR برو' },
          { id: '105', code: 'HV-4000', name: 'مكيف هواء HVAR إليت' }
        ];
        
        setProducts(mockProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    fetchProducts();
  }, [id, isEditMode]);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle product selection
  const handleProductChange = (e) => {
    const productId = e.target.value;
    const selectedProduct = products.find(p => p.id === productId) || {};
    
    setFormData({
      ...formData,
      product_id: productId,
      product_code: selectedProduct.code || '',
      product_name: selectedProduct.name || ''
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    
    try {
      // Validate form
      if (!formData.customer_name || !formData.phone || !formData.product_id || !formData.issue_description) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
      }
      
      // In a real app, this would be:
      // if (isEditMode) {
      //   await api.customerService.updateRequest(id, formData);
      // } else {
      //   await api.customerService.createRequest(formData);
      // }
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to requests list
      navigate('/customer-service/requests');
    } catch (error) {
      console.error('Error saving request:', error);
      alert('حدث خطأ أثناء حفظ الطلب');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Handle customer search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    
    try {
      // In a real app, this would be:
      // const results = await api.customers.search(searchQuery);
      
      // Mock search results
      await new Promise(resolve => setTimeout(resolve, 600));
      const mockResults = Array(5).fill(null).map((_, index) => ({
        id: `100${index + 1}`,
        name: ['أحمد محمد', 'فاطمة علي', 'محمد أحمد', 'سارة حسين', 'علي محمود'][index],
        phone: `0100${1000000 + (index * 1111111)}`,
        email: [`ahmed@example.com`, `fatma@example.com`, `mohamed@example.com`, `sara@example.com`, `ali@example.com`][index],
        address: ['القاهرة، مصر', 'الإسكندرية، مصر', 'الجيزة، مصر', 'بورسعيد، مصر', 'الإسماعيلية، مصر'][index]
      }));
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Handle customer selection from search results
  const selectCustomer = (customer) => {
    setFormData({
      ...formData,
      customer_id: customer.id,
      customer_name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address
    });
    
    setIsLookupOpen(false);
    setSearchResults([]);
    setSearchQuery('');
  };
  
  // Reset the form
  const resetForm = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط النموذج؟')) {
      setFormData({
        customer_id: '',
        customer_name: '',
        phone: '',
        email: '',
        address: '',
        product_id: '',
        product_code: '',
        product_name: '',
        issue_description: '',
        priority_level: '2',
        appointment_date: '',
        appointment_time: '',
        notes: '',
        status: 'pending',
        warranty_status: false
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-brand-red-600 border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-500 dark:text-gray-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {isEditMode ? 'تعديل طلب خدمة' : 'طلب خدمة جديد'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEditMode ? 'تعديل تفاصيل طلب الخدمة الحالي' : 'إنشاء طلب خدمة جديد لعميل'}
          </p>
        </div>
        
        <Button 
          variant="outline"
          className="flex items-center gap-1"
          onClick={() => navigate('/customer-service/requests')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>العودة</span>
        </Button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                معلومات العميل
              </h2>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setIsLookupOpen(true)}
              >
                <Search className="w-4 h-4" />
                <span>بحث عن عميل</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  اسم العميل <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-400" />
                  <Input
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    className="pr-10"
                    placeholder="اسم العميل"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pr-10"
                    placeholder="رقم الهاتف"
                    required
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  البريد الإلكتروني
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="البريد الإلكتروني"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  العنوان
                </label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="العنوان"
                />
              </div>
            </div>
          </Card>
          
          {/* Service Information */}
          <Card className="p-5 lg:row-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              معلومات الخدمة
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  المنتج <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-400" />
                  <select
                    id="product_id"
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleProductChange}
                    className="block w-full px-3 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-red-500 focus:border-brand-red-500"
                    required
                  >
                    <option value="">اختر المنتج</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="priority_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  مستوى الأولوية <span className="text-red-500">*</span>
                </label>
                <select
                  id="priority_level"
                  name="priority_level"
                  value={formData.priority_level}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-red-500 focus:border-brand-red-500"
                  required
                >
                  <option value="1">منخفضة</option>
                  <option value="2">متوسطة</option>
                  <option value="3">عالية</option>
                  <option value="4">عاجلة</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  الحالة
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-red-500 focus:border-brand-red-500"
                >
                  <option value="pending">معلّق</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغي</option>
                  <option value="on_hold">متوقف</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  تاريخ الموعد
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-400" />
                  <Input
                    id="appointment_date"
                    name="appointment_date"
                    type="date"
                    value={formData.appointment_date}
                    onChange={handleChange}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="appointment_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  وقت الموعد
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-400" />
                  <Input
                    id="appointment_time"
                    name="appointment_time"
                    type="time"
                    value={formData.appointment_time}
                    onChange={handleChange}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="warranty_status"
                  name="warranty_status"
                  type="checkbox"
                  checked={formData.warranty_status}
                  onChange={handleChange}
                  className="h-4 w-4 text-brand-red-600 focus:ring-brand-red-500 border-gray-300 rounded"
                />
                <label htmlFor="warranty_status" className="mr-2 block text-sm text-gray-900 dark:text-gray-300">
                  ضمن فترة الضمان
                </label>
              </div>
            </div>
          </Card>
          
          {/* Issue Description */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              وصف المشكلة
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="issue_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  وصف المشكلة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute top-3 transform right-3 text-gray-400" />
                  <textarea
                    id="issue_description"
                    name="issue_description"
                    value={formData.issue_description}
                    onChange={handleChange}
                    rows={4}
                    className="block w-full px-3 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-red-500 focus:border-brand-red-500"
                    placeholder="اكتب وصفاً مفصلاً للمشكلة"
                    required
                  ></textarea>
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ملاحظات إضافية
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-red-500 focus:border-brand-red-500"
                  placeholder="أي ملاحظات إضافية حول الطلب"
                ></textarea>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Action buttons */}
        <div className="mt-6 flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={resetForm}
          >
            إعادة ضبط
          </Button>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/customer-service/requests')}
            >
              إلغاء
            </Button>
            
            <Button 
              type="submit"
              disabled={saveLoading}
              className="flex items-center gap-1"
            >
              {saveLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
      
      {/* Customer lookup modal */}
      {isLookupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                بحث عن عميل
              </h3>
              
              <button 
                type="button"
                onClick={() => setIsLookupOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <span className="sr-only">إغلاق</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث بالاسم أو رقم الهاتف"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                
                <Button 
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="flex items-center gap-1"
                >
                  {searchLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>بحث</span>
                </Button>
              </div>
              
              {searchLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500 dark:text-gray-400">جاري البحث...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 text-right">
                        <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">الاسم</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">رقم الهاتف</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">البريد الإلكتروني</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {searchResults.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                            {customer.name}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400" dir="ltr">
                            {customer.phone}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400" dir="ltr">
                            {customer.email}
                          </td>
                          <td className="py-3 px-4">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => selectCustomer(customer)}
                            >
                              اختيار
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : searchQuery ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-500 dark:text-gray-400">لم يتم العثور على أي نتائج</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-500 dark:text-gray-400">ابحث عن عميل بالاسم أو رقم الهاتف</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <Button 
                variant="outline"
                onClick={() => setIsLookupOpen(false)}
              >
                إلغاء
              </Button>
              
              <Button onClick={() => setIsLookupOpen(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequestForm; 