import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Save, AlertCircle } from 'lucide-react';
import { Card, Button, Input, Spinner } from '../../../components/ui';

const ProductModal = ({ isOpen, onClose, product = null, onSave, categories = [] }) => {
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    category: '',
    brand: 'هفار',
    unit: 'القطعة',
    selling_price: '',
    purchase_price: '',
    alert_quantity: '',
    opening_stock: '',
    description: '',
    warranty_period_months: '12'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name_ar: product.name_ar || product.name || '',
        name_en: product.name_en || '',
        category: product.category || '',
        brand: product.brand || 'هفار',
        unit: product.unit || 'القطعة',
        selling_price: product.selling_price || '',
        purchase_price: product.purchase_price || '',
        alert_quantity: product.alert_quantity || product.min_threshold || '',
        opening_stock: product.quantity || product.opening_stock || '',
        description: product.description || '',
        warranty_period_months: product.warranty_period_months || '12'
      });
    } else {
      setFormData({
        name_ar: '',
        name_en: '',
        category: '',
        brand: 'هفار',
        unit: 'القطعة',
        selling_price: '',
        purchase_price: '',
        alert_quantity: '',
        opening_stock: '',
        description: '',
        warranty_period_months: '12'
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name_ar.trim()) {
      newErrors.name_ar = 'اسم المنتج باللغة العربية مطلوب';
    }

    if (!formData.category) {
      newErrors.category = 'فئة المنتج مطلوبة';
    }

    if (formData.selling_price && isNaN(parseFloat(formData.selling_price))) {
      newErrors.selling_price = 'سعر البيع يجب أن يكون رقم صحيح';
    }

    if (formData.purchase_price && isNaN(parseFloat(formData.purchase_price))) {
      newErrors.purchase_price = 'سعر الشراء يجب أن يكون رقم صحيح';
    }

    if (formData.alert_quantity && isNaN(parseInt(formData.alert_quantity))) {
      newErrors.alert_quantity = 'كمية التنبيه يجب أن تكون رقم صحيح';
    }

    if (formData.opening_stock && isNaN(parseInt(formData.opening_stock))) {
      newErrors.opening_stock = 'المخزون الافتتاحي يجب أن يكون رقم صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const productData = {
        ...formData,
        selling_price: parseFloat(formData.selling_price) || 0,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        alert_quantity: parseInt(formData.alert_quantity) || 0,
        opening_stock: parseInt(formData.opening_stock) || 0,
        warranty_period_months: parseInt(formData.warranty_period_months) || 12
      };

      await onSave(productData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({ submit: error.message || 'فشل في حفظ المنتج' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="mr-3">
                    <p className="text-sm text-red-700">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">المعلومات الأساسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المنتج (العربية) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => handleInputChange('name_ar', e.target.value)}
                    error={errors.name_ar}
                    placeholder="خلاط هفار 1000 وات"
                  />
                  {errors.name_ar && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.name_ar}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المنتج (الإنجليزية)
                  </label>
                  <Input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => handleInputChange('name_en', e.target.value)}
                    placeholder="HVAR Blender 1000W"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.category ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">اختر الفئة</option>
                    {categories.map((category, index) => (
                      <option 
                        key={index} 
                        value={typeof category === 'object' ? category.category_id : category}
                      >
                        {typeof category === 'object' 
                          ? (category.category_name_ar || category.category_name_en) 
                          : category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العلامة التجارية
                  </label>
                  <Input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="هفار"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوحدة
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="القطعة">القطعة</option>
                    <option value="الكيلو">الكيلو</option>
                    <option value="المتر">المتر</option>
                    <option value="العلبة">العلبة</option>
                    <option value="الطقم">الطقم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    فترة الضمان (بالأشهر)
                  </label>
                  <Input
                    type="number"
                    value={formData.warranty_period_months}
                    onChange={(e) => handleInputChange('warranty_period_months', e.target.value)}
                    placeholder="12"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات الأسعار</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سعر البيع (جنيه)
                  </label>
                  <Input
                    type="number"
                    value={formData.selling_price}
                    onChange={(e) => handleInputChange('selling_price', e.target.value)}
                    error={errors.selling_price}
                    placeholder="299.99"
                    min="0"
                    step="0.01"
                  />
                  {errors.selling_price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.selling_price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سعر الشراء (جنيه)
                  </label>
                  <Input
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                    error={errors.purchase_price}
                    placeholder="200.00"
                    min="0"
                    step="0.01"
                  />
                  {errors.purchase_price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.purchase_price}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات المخزون</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كمية التنبيه
                  </label>
                  <Input
                    type="number"
                    value={formData.alert_quantity}
                    onChange={(e) => handleInputChange('alert_quantity', e.target.value)}
                    error={errors.alert_quantity}
                    placeholder="5"
                    min="0"
                  />
                  {errors.alert_quantity && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.alert_quantity}
                    </p>
                  )}
                </div>

                {!product && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المخزون الافتتاحي
                    </label>
                    <Input
                      type="number"
                      value={formData.opening_stock}
                      onChange={(e) => handleInputChange('opening_stock', e.target.value)}
                      error={errors.opening_stock}
                      placeholder="20"
                      min="0"
                    />
                    {errors.opening_stock && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.opening_stock}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="وصف تفصيلي للمنتج..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{product ? 'تحديث' : 'حفظ'}</span>
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductModal; 