import React, { useState, useEffect } from 'react';
import { 
  Loader, 
  Send, 
  Target, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Package,
  Settings,
  Camera,
  FileText,
  Award,
  Shield,
  TrendingUp,
  Activity,
  Zap,
  BarChart3,
  Clock,
  MapPin,
  Tag,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Button, Input } from '../../../components/ui';
import { useTheme } from '../../../components/ui/DesignSystem';
import { api } from '../../../services/api';

const QualityScoreSlider = ({ value, onChange, disabled }) => {
  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 9) return 'ممتاز';
    if (score >= 7) return 'جيد جداً';
    if (score >= 5) return 'جيد';
    if (score >= 3) return 'مقبول';
    return 'ضعيف';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          تقييم الجودة
        </label>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getScoreColor(value)}`}>
            {value}/10
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {getScoreLabel(value)}
          </span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>0</span>
          <span>2</span>
          <span>4</span>
          <span>6</span>
          <span>8</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
};

const ConditionOption = ({ value, label, description, icon: Icon, selected, onClick, disabled }) => (
  <button
    onClick={() => onClick(value)}
    disabled={disabled}
    className={`p-4 border-2 rounded-xl transition-all duration-200 text-right ${
      selected 
        ? 'border-brand-red-500 bg-brand-red-50 dark:bg-brand-red-900/20 text-brand-red-700 dark:text-brand-red-300' 
        : 'border-gray-200 dark:border-gray-700 hover:border-brand-red-300 dark:hover:border-brand-red-700 text-gray-600 dark:text-gray-400 hover:text-brand-red-600 dark:hover:text-brand-red-400'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${
        selected 
          ? 'bg-brand-red-100 dark:bg-brand-red-900/30' 
          : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium mb-1">{label}</h4>
        <p className="text-sm opacity-75">{description}</p>
      </div>
    </div>
  </button>
);

const PartsInspectionSection = ({ parts, onChange, disabled, actionDetails }) => {
  const [showPartsForm, setShowPartsForm] = useState(false);
  const [availableParts, setAvailableParts] = useState([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);

  // Load available parts for this service action
  useEffect(() => {
    const loadParts = async () => {
      if (!actionDetails?.action_id) return;
      
      setIsLoadingParts(true);
      try {
        const response = await api.unifiedCustomerService.getServiceAction(actionDetails.action_id);
        if (response.success && response.data?.parts) {
          setAvailableParts(response.data.parts);
        }
      } catch (err) {
        console.error('Error loading parts:', err);
      } finally {
        setIsLoadingParts(false);
      }
    };

    loadParts();
  }, [actionDetails?.action_id]);

  const addPart = () => {
    const newPart = {
      sku: '',
      condition: 'good',
      notes: ''
    };
    onChange([...parts, newPart]);
  };

  const updatePart = (index, field, value) => {
    const updatedParts = [...parts];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    onChange(updatedParts);
  };

  const removePart = (index) => {
    onChange(parts.filter((_, i) => i !== index));
  };

  const addExistingPart = (part) => {
    const newPart = {
      sku: part.sku,
      condition: 'good',
      notes: `إضافة من القطع المرتبطة: ${part.part_name || part.sku}`
    };
    onChange([...parts, newPart]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Package className="w-5 h-5 text-brand-red-600" />
          فحص القطع
        </h4>
        <button
          onClick={() => setShowPartsForm(!showPartsForm)}
          className="text-sm text-brand-red-600 dark:text-brand-red-400 hover:underline"
        >
          {showPartsForm ? 'إخفاء' : 'إضافة قطع'}
        </button>
      </div>

      {/* Available Parts */}
      {availableParts.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">القطع المرتبطة بالخدمة</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableParts.map((part, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-200">{part.sku}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{part.part_name || 'غير محدد'}</p>
                </div>
                <button
                  onClick={() => addExistingPart(part)}
                  disabled={disabled}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  إضافة
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPartsForm && (
        <div className="space-y-4">
          {parts.map((part, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-800 dark:text-gray-200">القطعة {index + 1}</h5>
                <button
                  onClick={() => removePart(index)}
                  disabled={disabled}
                  className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="رمز القطعة (SKU)"
                  value={part.sku}
                  onChange={(e) => updatePart(index, 'sku', e.target.value)}
                  disabled={disabled}
                  dir="ltr"
                />
                <select
                  value={part.condition}
                  onChange={(e) => updatePart(index, 'condition', e.target.value)}
                  disabled={disabled}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-brand-red-500 focus:border-brand-red-500"
                >
                  <option value="good">جيد</option>
                  <option value="fair">مقبول</option>
                  <option value="damaged">تالف</option>
                  <option value="missing">مفقود</option>
                </select>
                <Input
                  placeholder="ملاحظات"
                  value={part.notes}
                  onChange={(e) => updatePart(index, 'notes', e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
          
          <button
            onClick={addPart}
            disabled={disabled}
            className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-brand-red-300 dark:hover:border-brand-red-700 hover:text-brand-red-600 dark:hover:text-brand-red-400 transition-colors"
          >
            + إضافة قطعة جديدة
          </button>
        </div>
      )}
    </div>
  );
};

const InspectionForm = ({ onSubmit, isInspecting, actionDetails }) => {
  const { direction } = useTheme();
  const [inspectionData, setInspectionData] = useState({
    product_condition: 'good',
    quality_score: 8,
    inspection_notes: '',
    parts_inspection: [],
    recommended_action: 'proceed',
    team_leader_review_required: false
  });

  // Initialize form with existing data if available
  useEffect(() => {
    if (actionDetails?.hub_confirmation) {
      const hubData = actionDetails.hub_confirmation;
      setInspectionData(prev => ({
        ...prev,
        product_condition: hubData.product_condition || 'good',
        quality_score: hubData.quality_score || 8,
        inspection_notes: hubData.inspection_notes || '',
        team_leader_review_required: hubData.team_leader_review_required || false
      }));
    }
  }, [actionDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInspectionData(prev => ({
      ...prev,
      [name]: name === 'quality_score' ? parseInt(value, 10) : value,
    }));
  };

  const handleConditionChange = (condition) => {
    setInspectionData(prev => ({
      ...prev,
      product_condition: condition,
      // Auto-adjust quality score based on condition
      quality_score: condition === 'good' ? 8 : 
                    condition === 'fair' ? 6 : 
                    condition === 'damaged' ? 3 : 
                    condition === 'requires_parts' ? 5 : 4
    }));
  };

  const handleQualityScoreChange = (score) => {
    setInspectionData(prev => ({
      ...prev,
      quality_score: score,
      // Auto-determine if team leader review is required
      team_leader_review_required: score < 5 || prev.product_condition === 'damaged'
    }));
  };

  const handlePartsChange = (parts) => {
    setInspectionData(prev => ({
      ...prev,
      parts_inspection: parts,
      // Auto-determine if team leader review is required based on parts
      team_leader_review_required: prev.quality_score < 5 || 
                                  prev.product_condition === 'damaged' ||
                                  parts.some(part => part.condition === 'damaged')
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(inspectionData);
  };

  return (
    <div className="w-full space-y-6" dir={direction}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Condition */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-red-600" />
            حالة المنتج
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ConditionOption
              value="good"
              label="جيد"
              description="المنتج في حالة ممتازة"
              icon={CheckCircle}
              selected={inspectionData.product_condition === 'good'}
              onClick={handleConditionChange}
              disabled={isInspecting}
            />
            <ConditionOption
              value="fair"
              label="مقبول"
              description="المنتج يحتاج صيانة بسيطة"
              icon={Clock}
              selected={inspectionData.product_condition === 'fair'}
              onClick={handleConditionChange}
              disabled={isInspecting}
            />
            <ConditionOption
              value="damaged"
              label="تالف"
              description="المنتج تالف ويحتاج إصلاح"
              icon={AlertTriangle}
              selected={inspectionData.product_condition === 'damaged'}
              onClick={handleConditionChange}
              disabled={isInspecting}
            />
            <ConditionOption
              value="requires_parts"
              label="يحتاج قطع"
              description="المنتج يحتاج قطع غيار"
              icon={Package}
              selected={inspectionData.product_condition === 'requires_parts'}
              onClick={handleConditionChange}
              disabled={isInspecting}
            />
          </div>
        </div>

        {/* Quality Score */}
        <div className="space-y-4">
          <QualityScoreSlider
            value={inspectionData.quality_score}
            onChange={handleQualityScoreChange}
            disabled={isInspecting}
          />
        </div>

        {/* Parts Inspection */}
        <PartsInspectionSection
          parts={inspectionData.parts_inspection}
          onChange={handlePartsChange}
          disabled={isInspecting}
          actionDetails={actionDetails}
        />

        {/* Inspection Notes */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ملاحظات الفحص
          </label>
          <textarea
            name="inspection_notes"
            value={inspectionData.inspection_notes}
            onChange={handleChange}
            disabled={isInspecting}
            rows={4}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-brand-red-500 focus:border-brand-red-500 resize-none"
            placeholder="أدخل ملاحظات الفحص هنا..."
          />
        </div>

        {/* Recommended Action */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            الإجراء الموصى به
          </label>
          <select
            name="recommended_action"
            value={inspectionData.recommended_action}
            onChange={handleChange}
            disabled={isInspecting}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-brand-red-500 focus:border-brand-red-500"
          >
            <option value="proceed">المتابعة</option>
            <option value="maintenance">صيانة</option>
            <option value="replacement">استبدال</option>
            <option value="refund">استرداد</option>
            <option value="team_review">مراجعة الفريق</option>
          </select>
        </div>

        {/* Team Leader Review Required */}
        {inspectionData.team_leader_review_required && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                يتطلب مراجعة من قائد الفريق
              </p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              سيتم إرسال هذا الإجراء إلى قائد الفريق للمراجعة والموافقة.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isInspecting}
          className="w-full py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {isInspecting ? (
            <div className="flex items-center gap-2">
              <Loader className="w-5 h-5 animate-spin" />
              <span>جاري إرسال الفحص...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              <span>إرسال الفحص</span>
            </div>
          )}
        </Button>
      </form>
    </div>
  );
};

export default InspectionForm; 