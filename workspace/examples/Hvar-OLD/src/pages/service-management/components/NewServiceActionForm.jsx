import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Search, Package, Wrench, Phone, User, AlertCircle, CheckCircle, Clock, ArrowRight, TrendingUp, FileText, Settings, ChevronDown, ChevronUp, List, CalendarCheck, MapPin, Calendar } from 'lucide-react';
import { Card } from '../../../components/ui';
import { Button } from '../../../components/ui';
import { Input } from '../../../components/ui';
import { Badge } from '../../../components/ui';
import Loading from '../../../components/ui/Loading';
import { api } from '../../../services/api';

const NewServiceActionForm = ({ customer, onSubmit, onClose, selectedOrder = null, orders = [], selectedActionType = null, modalType = 'service' }) => {
  const [formData, setFormData] = useState({
    // Service Action fields
    receiver_phone: customer?.phone || '',
    tracking_number: selectedOrder?.tracking_number || '',
    action_type: selectedActionType || '',
    priority: 'medium',
    product_name: selectedOrder?.product_name || '',
    cod: selectedOrder?.cod || 0,
    service_notes: '',
    assigned_technician: '',
    parts_required: [],
    replacement_new_products: [],
    replacement_old_products: [],

    // New Order fields
    selected_products: [],
    new_order_cod: 0,
    new_order_notes: '',
    selectedCategory: null, // Add category filter state

    // Follow-up fields
    follow_up_type: 'general',
    follow_up_date: '',
    follow_up_time: '',
    follow_up_order_id: '',
    follow_up_product_id: '',
    follow_up_notes: '',
    follow_up_priority: 'medium',
    agent_name: 'كريم صيام', // Required field for follow-up creation
    couponType: 'percent',
    couponValue: 0
  });

  // COD type state for new orders
  const [codType, setCodType] = useState('client'); // 'client' for refund, 'us' for collection
  const [shippingEnabled, setShippingEnabled] = useState(true); // Free shipping by default (selected)
  const [manualShippingCost, setManualShippingCost] = useState(0); // Manual shipping cost when free is disabled

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [allParts, setAllParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [showPartSearch, setShowPartSearch] = useState(false);

  const [replacementType, setReplacementType] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    order: true,
    product: true,
    service: true,
    parts: true,
    notes: false
  });

  // Log state changes
  useEffect(() => {
    console.log('🔄 State Change - showPartSearch:', showPartSearch);
  }, [showPartSearch]);

  useEffect(() => {
    console.log('🔄 State Change - replacementType:', replacementType);
  }, [replacementType]);

  useEffect(() => {
    console.log('🔄 State Change - partSearchTerm:', partSearchTerm);
  }, [partSearchTerm]);
  const [currentSelectedOrder, setCurrentSelectedOrder] = useState(selectedOrder);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [showOrderSelection, setShowOrderSelection] = useState(false);

  // Filter and sort orders by latest first with enhanced search and customer grouping
  const filteredOrders = useMemo(() => {
    // Debug: Log orders data to see what we're working with
    if (orders.length > 0) {
      console.log('Orders data for search:', orders.slice(0, 2)); // Log first 2 orders
    }

    if (!orderSearchTerm) {
      return orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const searchLower = orderSearchTerm.toLowerCase();
    const filtered = orders.filter(order => {
      const matches = (
        // Enhanced search fields
        order.tracking_number?.toLowerCase().includes(searchLower) ||
        order.product_name?.toLowerCase().includes(searchLower) ||
        order.status?.toLowerCase().includes(searchLower) ||
        order.dropoff_city_name?.toLowerCase().includes(searchLower) ||
        // Customer information
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.customer_phone?.toLowerCase().includes(searchLower) ||
        order.receiver_phone?.toLowerCase().includes(searchLower) ||
        order.receiver_name?.toLowerCase().includes(searchLower) ||
        // Additional fields
        order.notes?.toLowerCase().includes(searchLower) ||
        order.product_description?.toLowerCase().includes(searchLower) ||
        order.product_details?.toLowerCase().includes(searchLower)
      );

      // Debug: Log search matches
      if (orderSearchTerm && matches) {
        console.log('Search match found:', {
          searchTerm: orderSearchTerm,
          orderId: order.id,
          trackingNumber: order.tracking_number,
          customerName: order.customer_name,
          customerPhone: order.customer_phone
        });
      }

      return matches;
    });

    console.log(`Filtered ${filtered.length} orders from ${orders.length} total orders`);
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [orders, orderSearchTerm]);

  // Group orders by customer for better organization
  const groupedOrders = useMemo(() => {
    const groups = {};

    filteredOrders.forEach(order => {
      // Enhanced customer key generation with fallbacks
      const customerKey = order.customer_phone ||
        order.receiver_phone ||
        order.customer_name ||
        order.receiver_name ||
        order.customer_id ||
        customer?.phone || // Fallback to customer prop
        'unknown';

      if (!groups[customerKey]) {
        groups[customerKey] = {
          customerKey,
          customerName: order.customer_name ||
            order.receiver_name ||
            order.full_name ||
            customer?.full_name || // Fallback to customer prop
            'غير محدد',
          customerPhone: order.customer_phone ||
            order.receiver_phone ||
            order.phone ||
            customer?.phone || // Fallback to customer prop
            'غير محدد',
          orders: [],
          orderCount: 0
        };
      }

      groups[customerKey].orders.push(order);
      groups[customerKey].orderCount++;
    });

    const result = Object.values(groups);
    console.log('Grouped orders:', result.length, 'customers');
    return result;
  }, [filteredOrders, customer]);

  // Generate unique colors for customers
  const getCustomerColor = (customerKey) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600',
      'from-emerald-500 to-emerald-600'
    ];

    // Generate consistent color based on customer key
    const hash = customerKey.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  // Get customer initials for avatar
  const getCustomerInitials = (customerName) => {
    if (!customerName || customerName === 'غير محدد') return '?';

    const words = customerName.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return customerName[0]?.toUpperCase() || '?';
  };

  // Service action types with icons and descriptions
  const serviceActionTypes = [
    {
      type: 'maintenance',
      label: 'صيانة',
      description: 'صيانة المنتج وإصلاح الأعطال',
      icon: <Wrench className="w-4 h-4" />
    },
    {
      type: 'product_swap',
      label: 'استبدال المنتج',
      description: 'استبدال المنتج بآخر جديد',
      icon: <Package className="w-4 h-4" />
    },
    {
      type: 'refund',
      label: 'استرداد',
      description: 'استرداد المبلغ وإرجاع المنتج',
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      type: 'technical_support',
      label: 'دعم متابعه صيانه',
      description: 'دعم متابعه صيانه وإرشادات',
      icon: <Phone className="w-4 h-4" />
    }
  ];

  // Follow-up types
  const followUpTypes = [
    {
      type: 'general',
      label: 'متابعة عامة',
      description: 'متابعة عامة للعميل',
      icon: <Phone className="w-4 h-4" />
    },
    {
      type: 'technical',
      label: 'متابعة صيانة',
      description: 'متابعة صيانة للمنتج',
      icon: <Wrench className="w-4 h-4" />
    },
    {
      type: 'delivery',
      label: 'متابعة التوصيل',
      description: 'متابعة حالة التوصيل',
      icon: <Package className="w-4 h-4" />
    },
    {
      type: 'complaint',
      label: 'متابعة شكوى',
      description: 'متابعة شكوى العميل',
      icon: <AlertCircle className="w-4 h-4" />
    }
  ];

  useEffect(() => {
    console.log('🚀 Component Initialization');
    console.log('📊 Initial Props:', {
      customer,
      selectedOrder,
      orders: orders.length,
      selectedActionType,
      modalType
    });

    loadProducts();
    loadAllParts();

    console.log('✅ Component Initialization Complete');
  }, []);

  // Click outside handler for search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      // No longer needed since we removed showAllProducts
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update form data when selectedActionType changes
  useEffect(() => {
    if (selectedActionType) {
      setFormData(prev => ({ ...prev, action_type: selectedActionType }));
    }
  }, [selectedActionType]);

  // Debounced search effect for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim() && Array.isArray(products) && products.length > 0) {
        setIsSearching(true);

        // Filter products immediately
        const filtered = products.filter(product =>
          product.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredProducts(filtered);

        // Stop loading after a short delay for UX
        setTimeout(() => {
          setIsSearching(false);
        }, 200);

      } else if (!searchTerm.trim()) {
        // Clear filtered products when no search term
        setFilteredProducts([]);
        setIsSearching(false);
      } else {
        // No products or empty search
        setFilteredProducts([]);
        setIsSearching(false);
      }
    }, 100); // Faster response

    return () => clearTimeout(timer);
  }, [searchTerm, products]);

  // Load initial products when component mounts
  useEffect(() => {
    if (Array.isArray(products) && products.length > 0 && !searchTerm.trim()) {
      setFilteredProducts(products.slice(0, 9));
    }
  }, [products, searchTerm]);

  useEffect(() => {
    console.log('🔍 Parts Filtering Effect Triggered');
    console.log('📊 Filter State:', {
      partSearchTerm: partSearchTerm,
      allPartsLength: allParts.length,
      isArray: Array.isArray(allParts)
    });

    if (partSearchTerm.trim() && Array.isArray(allParts) && allParts.length > 0) {
      console.log('🔍 Filtering Parts with Search Term:', partSearchTerm);
      const filtered = allParts.filter(part => {
        const matches = part.part_name?.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
          part.part_sku?.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
          part.part_type?.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
          part.product_name?.toLowerCase().includes(partSearchTerm.toLowerCase());

        if (matches) {
          console.log('✅ Part Match Found:', part.part_name);
        }

        return matches;
      });
      console.log('📋 Filtered Results:', filtered.length, 'parts');
      setFilteredParts(filtered);
    } else {
      console.log('📋 Showing All Parts:', allParts.length);
      setFilteredParts(Array.isArray(allParts) ? allParts : []);
    }
  }, [partSearchTerm, allParts]);

  // Product selection helper functions
  const addProductToSelection = (product) => {
    const existingProduct = formData.selected_products?.find(p => p.id === product.id);

    if (existingProduct) {
      // Update quantity if product already exists
      setFormData(prev => ({
        ...prev,
        selected_products: prev.selected_products.map(p =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      }));
    } else {
      // Add new product with quantity 1
      setFormData(prev => ({
        ...prev,
        selected_products: [...(prev.selected_products || []), { ...product, quantity: 1 }]
      }));
    }
  };

  const removeProductFromSelection = (index) => {
    setFormData(prev => ({
      ...prev,
      selected_products: prev.selected_products.filter((_, i) => i !== index)
    }));
  };

  const clearAllProducts = () => {
    setFormData(prev => ({
      ...prev,
      selected_products: []
    }));
  };

  const adjustProductQuantity = (index, change) => {
    setFormData(prev => ({
      ...prev,
      selected_products: prev.selected_products.map((product, i) =>
        i === index
          ? { ...product, quantity: Math.max(1, product.quantity + change) }
          : product
      )
    }));
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('Loading products...');

      const response = await api.products.getProducts();
      console.log('Products API response:', response);

      if (response.success) {
        // Handle both possible response structures
        let productsData = [];
        if (Array.isArray(response.data)) {
          // Direct array response
          productsData = response.data;
        } else if (response.data && Array.isArray(response.data.products)) {
          // Nested products response
          productsData = response.data.products;
        } else if (Array.isArray(response.products)) {
          // Direct products response
          productsData = response.products;
        }

        console.log('Products loaded successfully:', productsData.length);
        setProducts(productsData);
        // Show initial products
        setFilteredProducts(productsData.slice(0, 9));
      } else {
        console.error('Failed to load products:', response.error);
        // Try to load from product data as fallback
        try {
          const fallbackResponse = await api.products.getProducts({ limit: 50 });
          if (fallbackResponse.success) {
            let fallbackProducts = [];
            if (Array.isArray(fallbackResponse.data)) {
              fallbackProducts = fallbackResponse.data;
            } else if (fallbackResponse.data && Array.isArray(fallbackResponse.data.products)) {
              fallbackProducts = fallbackResponse.data.products;
            } else if (Array.isArray(fallbackResponse.products)) {
              fallbackProducts = fallbackResponse.products;
            }

            if (fallbackProducts.length > 0) {
              console.log('Fallback products loaded:', fallbackProducts.length);
              setProducts(fallbackProducts);
              setFilteredProducts(fallbackProducts.slice(0, 9));
            } else {
              // Use hardcoded product data as final fallback
              const hardcodedProducts = [
                {
                  product_id: 1,
                  sku: 'hvar5057',
                  name_ar: 'هاند بلندر هفار 1500 وات 5057',
                  name_en: 'HVAR Hand Blender 1500W 5057',
                  category: 'هاند بلندر',
                  brand: 'هفار',
                  selling_price: 1991.26,
                  purchase_price: 1500.00,
                  available_quantity: 100,
                  quantity: 100,
                  alert_quantity: 10,
                  warranty_period_months: 12,
                  unit: 'القطعة',
                  is_active: 1
                },
                {
                  product_id: 2,
                  sku: 'hvar5055',
                  name_ar: 'هاند بلندر هفار 1500 وات 5055',
                  name_en: 'HVAR Hand Blender 1500W 5055',
                  category: 'هاند بلندر',
                  brand: 'هفار',
                  selling_price: 1255.00,
                  purchase_price: 1000.00,
                  available_quantity: 100,
                  quantity: 100,
                  alert_quantity: 10,
                  warranty_period_months: 12,
                  unit: 'القطعة',
                  is_active: 1
                },
                {
                  product_id: 3,
                  sku: 'hvar228',
                  name_ar: 'مكنسة هفار بطه 2800 وات',
                  name_en: 'HVAR Vacuum Cleaner 2800W 228',
                  category: 'مكنسة',
                  brand: 'هفار',
                  selling_price: 1.00,
                  purchase_price: 0.80,
                  available_quantity: 100,
                  quantity: 100,
                  alert_quantity: 10,
                  warranty_period_months: 12,
                  unit: 'القطعة',
                  is_active: 1
                }
              ];
              console.log('Using hardcoded products:', hardcodedProducts.length);
              setProducts(hardcodedProducts);
              setFilteredProducts(hardcodedProducts);
            }
          } else {
            setProducts([]);
            setFilteredProducts([]);
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          setProducts([]);
          setFilteredProducts([]);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllParts = async () => {
    console.log('🔄 Loading All Parts...');
    try {
      const response = await api.products.getParts();
      console.log('📡 Parts API Response:', response);

      if (response.success) {
        const partsData = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Parts Loaded Successfully:', partsData.length, 'parts');
        setAllParts(partsData);
        setFilteredParts(partsData);
      } else {
        console.log('❌ Parts API Failed:', response.error);
        setAllParts([]);
        setFilteredParts([]);
      }
    } catch (error) {
      console.error('❌ Error loading parts:', error);
      setAllParts([]);
      setFilteredParts([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle COD type change and update value accordingly
  const handleCodTypeChange = (type) => {
    setCodType(type);
    // Reset COD value when changing type
    setFormData(prev => ({
      ...prev,
      new_order_cod: 0
    }));
  };

  // Handle COD value change with type consideration
  const handleCodValueChange = (value) => {
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      new_order_cod: codType === 'client' ? -Math.abs(numericValue) : Math.abs(numericValue)
    }));
  };

  // Calculate automatic COD based on selected products and shipping
  const calculateAutomaticCOD = () => {
    if (!formData.selected_products || formData.selected_products.length === 0) return 0;

    const subtotal = calculateSubtotal();
    const shippingCost = shippingEnabled ? 0 : manualShippingCost; // Free when enabled, manual cost when disabled
    const totalCost = subtotal + shippingCost;

    // Default to client refund (negative) for automatic calculation
    return -totalCost;
  };

  // Set automatic COD calculation
  const setAutomaticCOD = () => {
    const autoCOD = calculateAutomaticCOD();
    setFormData(prev => ({
      ...prev,
      new_order_cod: autoCOD
    }));
    // Set type to client for automatic calculation
    setCodType('client');
  };

  // Auto-update COD when products change (if it's currently automatic)
  useEffect(() => {
    if (formData.selected_products && formData.selected_products.length > 0) {
      const currentCOD = Math.abs(formData.new_order_cod);
      const autoCOD = Math.abs(calculateAutomaticCOD());

      // If current COD matches automatic calculation, update it
      if (Math.abs(currentCOD - autoCOD) < 0.01) {
        setAutomaticCOD();
      }
    }
  }, [formData.selected_products, shippingEnabled]);

  const handleOrderSelect = (order) => {
    setCurrentSelectedOrder(order);
    setFormData(prev => ({
      ...prev,
      follow_up_order_id: order.id,
      tracking_number: order.tracking_number || '',
      product_name: order.product_name || '',
      cod: order.cod || 0
    }));
    setShowOrderSelection(false);
  };

  const handleProductSelect = async (product) => {
    // If user is in full replacement modal, add to replacement_new_products
    if (modalType === 'service' && replacementType === 'full') {
      const idx = formData.replacement_new_products.findIndex(p => p.sku === product.sku);
      if (idx >= 0) {
        const updated = [...formData.replacement_new_products];
        updated[idx].quantity = (updated[idx].quantity || 1) + 1;
        setFormData(prev => ({ ...prev, replacement_new_products: updated }));
      } else {
        setFormData(prev => ({
          ...prev,
          replacement_new_products: [...prev.replacement_new_products, {
            sku: product.sku,
            name_ar: product.name_ar,
            quantity: 1,
            product_id: product.product_id,
            selling_price: product.selling_price,
            category: product.category
          }]
        }));
      }
      return;
    }

    // Default product selection behavior
    if (modalType === 'service') {
      setSelectedProduct(product);
      setFormData(prev => ({
        ...prev,
        product_name: product.name_ar,
        cod: product.selling_price || 0
      }));
    } else if (modalType === 'new-order') {
      const existingProductIndex = formData.selected_products.findIndex(p => p.sku === product.sku);
      if (existingProductIndex >= 0) {
        const updatedProducts = [...formData.selected_products];
        updatedProducts[existingProductIndex].quantity += 1;
        setFormData(prev => ({ ...prev, selected_products: updatedProducts }));
      } else {
        setFormData(prev => ({
          ...prev,
          selected_products: [...prev.selected_products, { ...product, quantity: 1 }]
        }));
      }
    }
  };

  const handlePartSelect = (part) => {
    console.log('🎯 Part Selection Triggered');
    console.log('📦 Selected Part:', part);
    console.log('📊 Current Parts:', formData.parts_required);

    if (replacementType === 'full') {
      // For full replacement, add to replacement_old_products
      const existingProductIndex = formData.replacement_old_products.findIndex(p => p.sku === part.part_sku);
      if (existingProductIndex >= 0) {
        const updated = [...formData.replacement_old_products];
        updated[existingProductIndex].quantity += 1;
        setFormData(prev => ({ ...prev, replacement_old_products: updated }));
      } else {
        setFormData(prev => ({
          ...prev,
          replacement_old_products: [...prev.replacement_old_products, {
            sku: part.part_sku,
            name_ar: part.part_name,
            quantity: 1,
            part_type: part.part_type,
            replacement_type: 'full'
          }]
        }));
      }
    } else {
      // For partial replacement, add to parts_required
      const existingPartIndex = formData.parts_required.findIndex(p => p.part_sku === part.part_sku);
      if (existingPartIndex >= 0) {
        console.log('🔄 Updating Existing Part Quantity');
        const updatedParts = [...formData.parts_required];
        updatedParts[existingPartIndex].quantity += 1;
        setFormData(prev => ({ ...prev, parts_required: updatedParts }));
        console.log('✅ Part Quantity Updated');
      } else {
        console.log('➕ Adding New Part');
        setFormData(prev => ({
          ...prev,
          parts_required: [...prev.parts_required, {
            sku: part.part_sku,
            quantity: 1,
            part_name: part.part_name,
            part_type: part.part_type,
            replacement_type: 'partial'
          }]
        }));
        console.log('✅ New Part Added');
      }
    }

    console.log('🔄 Closing Modal and Resetting State');
    setShowPartSearch(false);
    setReplacementType(null);
    setPartSearchTerm('');
    console.log('✅ Modal State Reset Complete');
  };

  const updatePart = (index, field, value) => {
    const updatedParts = [...formData.parts_required];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    setFormData(prev => ({ ...prev, parts_required: updatedParts }));
  };

  const removePart = (index) => {
    setFormData(prev => ({
      ...prev,
      parts_required: prev.parts_required.filter((_, i) => i !== index)
    }));
  };

  // Replacement products management functions
  const removeReplacementNewProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      replacement_new_products: prev.replacement_new_products.filter((_, i) => i !== index)
    }));
  };

  const removeReplacementOldProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      replacement_old_products: prev.replacement_old_products.filter((_, i) => i !== index)
    }));
  };

  const updateReplacementNewProductQuantity = (index, quantity) => {
    const updatedProducts = [...formData.replacement_new_products];
    updatedProducts[index].quantity = Math.max(1, quantity);
    setFormData(prev => ({ ...prev, replacement_new_products: updatedProducts }));
  };

  const updateReplacementOldProductQuantity = (index, quantity) => {
    const updatedProducts = [...formData.replacement_old_products];
    updatedProducts[index].quantity = Math.max(1, quantity);
    setFormData(prev => ({ ...prev, replacement_old_products: updatedProducts }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (modalType === 'service') {
      if (!formData.receiver_phone) {
        newErrors.receiver_phone = 'رقم الهاتف مطلوب';
      }

      if (!formData.product_name) {
        newErrors.product_name = 'اسم المنتج مطلوب';
      }
    } else if (modalType === 'new-order') {
      if (!formData.selected_products || formData.selected_products.length === 0) {
        newErrors.selected_products = 'يجب اختيار منتج واحد على الأقل';
      }
    } else if (modalType === 'follow-up') {
      if (!formData.follow_up_type) {
        newErrors.follow_up_type = 'نوع المتابعة مطلوب';
      }
      if (!formData.follow_up_date) {
        newErrors.follow_up_date = 'تاريخ المتابعة مطلوب';
      }
      if (!formData.follow_up_priority) {
        newErrors.follow_up_priority = 'مستوى الأولوية مطلوب';
      }
      if (!formData.agent_name) {
        newErrors.agent_name = 'اسم الموظف المسؤول مطلوب';
      }
      if (!formData.follow_up_notes) {
        newErrors.follow_up_notes = 'ملاحظات المتابعة مطلوبة';
      }
      // Note: follow_up_time is optional as per requirements
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      let response;

      if (modalType === 'new-order') {
        // Create one minimal order per selected product via unified command endpoint
        const orderPromises = formData.selected_products.map((product) => {
          const data = {
            receiver_phone: customer?.phone || '',
            receiver_name: customer?.full_name || customer?.name || undefined,
            product_name: product.name_ar,
            cod: formData.new_order_cod,
            notes: formData.new_order_notes,
            sku: product.sku,
            quantity: product.quantity,
            dropoff_city_name: customer?.primary_city || undefined,
            dropoff_zone_name: customer?.primary_zone || undefined,
            dropoff_district_name: customer?.primary_district || undefined,
            dropoff_first_line: customer?.primary_address || undefined,
          };
          return api.unifiedCustomerService.command({ command: 'create_new_order_minimal', data });
        });

        const results = await Promise.all(orderPromises);
        const allSuccessful = results.every((r) => r.success);
        response = allSuccessful
          ? { success: true, data: results.map((r) => r.data), message: `تم إنشاء ${results.length} طلب بنجاح` }
          : { success: false, error: 'حدث خطأ في إنشاء بعض الطلبات', data: results };
      } else if (modalType === 'follow-up') {
        // Enhanced follow-up data structure for the new API endpoint
        const followUpData = {
          // Required fields
          customer_phone: customer?.phone || '',
          follow_up_type: formData.follow_up_type,
          follow_up_date: formData.follow_up_date,
          follow_up_priority: formData.follow_up_priority,
          agent_name: formData.agent_name || 'System Agent', // Get from user session or form
          follow_up_notes: formData.follow_up_notes,

          // Optional fields
          follow_up_time: formData.follow_up_time,
          tracking_number: formData.tracking_number,
          follow_up_order_id: formData.follow_up_order_id,
          action_id: formData.action_id // Link to service action if exists
        };

        // Use unified command endpoint
        response = await api.unifiedCustomerService.command({ command: 'schedule_follow_up', data: followUpData });
      } else {
        // Service action - MANUAL CREATION ONLY
        const actionData = {
          receiver_phone: formData.receiver_phone,
          tracking_number: formData.tracking_number,
          product_name: formData.product_name,
          action_type: formData.action_type,
          priority: formData.priority,
          service_notes: formData.service_notes,
          cod: formData.cod,
          parts_required: formData.parts_required,
          // Replacement data
          replacement_new_products: formData.replacement_new_products,
          replacement_old_products: formData.replacement_old_products,
          // Enforce manual creation
          requires_service_action: true,
          manual_creation: true,
          manual_processing: true,
          creation_type: 'manual'
        };
        response = await api.unifiedCustomerService.command({ command: 'create_action', data: actionData });
      }

      if (response.success) {
        onSubmit(response.data);
        onClose();
      } else {
        setErrors({ submit: response.error || `خطأ في إنشاء ${modalType === 'new-order' ? 'الطلب' : modalType === 'follow-up' ? 'المتابعة' : 'إجراء الخدمة اليدوي'}` });
      }
    } catch (error) {
      console.error('Error creating:', error);
      setErrors({ submit: 'خطأ في الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  const getProductIcon = (category) => {
    const iconMap = {
      'كبه': '🥘',
      'عجان': '🍞',
      'فرن هفار كهربائي': '🔥',
      'هاند بلندر': '🥤',
      'مكنسة': '🧹',
      'خلاط': '🍹',
      'ميكروويف': '📡',
      'غسالة': '👕',
      'ثلاجة': '❄️',
      'مكيف': '❄️',
      'تلفاز': '📺',
      'جوال': '📱',
      'لابتوب': '💻',
      'طابعة': '🖨️',
      'سماعات': '🎧',
      'ساعة': '⌚',
      'حقيبة': '👜',
      'أحذية': '👟',
      'ملابس': '👕',
      'كتب': '📚',
      'ألعاب': '🎮',
      'رياضة': '⚽',
      'جمال': '💄',
      'صحة': '💊',
      'طعام': '🍎'
    };
    return iconMap[category] || '📦';
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'كبه': 'from-orange-500 to-orange-600',
      'عجان': 'from-yellow-500 to-yellow-600',
      'فرن هفار كهربائي': 'from-red-500 to-red-600',
      'هاند بلندر': 'from-blue-500 to-blue-600',
      'مكنسة': 'from-purple-500 to-purple-600',
      'خلاط': 'from-green-500 to-green-600',
      'ميكروويف': 'from-indigo-500 to-indigo-600',
      'غسالة': 'from-cyan-500 to-cyan-600',
      'ثلاجة': 'from-sky-500 to-sky-600',
      'مكيف': 'from-teal-500 to-teal-600'
    };
    return colorMap[category] || 'from-gray-500 to-gray-600';
  };

  const getStockStatus = (availableQuantity, alertQuantity) => {
    if (availableQuantity === 0) {
      return { status: 'غير متوفر', color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30' };
    } else if (availableQuantity <= alertQuantity) {
      return { status: 'كمية محدودة', color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30' };
    } else if (availableQuantity > 1000) {
      return { status: 'متوفر بكثرة', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' };
    } else {
      return { status: 'متوفر', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' };
    }
  };

  const formatQuantity = (quantity) => {
    if (quantity >= 1000) {
      return `${(quantity / 1000).toFixed(1)}K`;
    }
    return quantity.toString();
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      'low': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      'medium': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
      'high': 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
      'urgent': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
    };
    return colorMap[priority] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'delivered': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      'in_transit': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      'pending': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
      'cancelled': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
  };

  const updateSelectedProductQuantity = (index, quantity) => {
    const updatedProducts = [...formData.selected_products];
    updatedProducts[index].quantity = Math.max(1, quantity);
    setFormData(prev => ({ ...prev, selected_products: updatedProducts }));
  };

  const removeSelectedProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      selected_products: prev.selected_products.filter((_, i) => i !== index)
    }));
  };

  const calculateSubtotal = () => {
    if (!formData.selected_products || formData.selected_products.length === 0) return '0.00';
    return formData.selected_products.reduce((total, product) => total + (product.selling_price * product.quantity), 0).toFixed(2);
  };

  const calculateTotal = () => {
    if (!formData.selected_products || formData.selected_products.length === 0) return '0.00';
    return formData.selected_products.reduce((total, product) => total + (product.selling_price * product.quantity), 0).toFixed(2);
  };

  const getAvailabilityStatus = (availableQuantity, alertQuantity) => {
    if (availableQuantity === 0) {
      return {
        status: 'غير متوفر',
        color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800'
      };
    } else if (availableQuantity <= alertQuantity) {
      return {
        status: 'كمية محدودة',
        color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800'
      };
    } else if (availableQuantity > 1000) {
      return {
        status: 'متوفر بكثرة',
        color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800'
      };
    } else {
      return {
        status: 'متوفر',
        color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800'
      };
    }
  };

  const getCategoryStyle = (category) => {
    const styleMap = {
      'كبه': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
      'عجان': 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
      'فرن هفار كهربائي': 'bg-gradient-to-r from-red-500 to-red-600 text-white',
      'هاند بلندر': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      'مكنسة': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
      'خلاط': 'bg-gradient-to-r from-green-500 to-green-600 text-white',
      'ميكروويف': 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white',
      'غسالة': 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white',
      'ثلاجة': 'bg-gradient-to-r from-sky-500 to-sky-600 text-white',
      'مكيف': 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
    };
    return styleMap[category] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'غير محدد';
    return `${price.toLocaleString('ar-EG')} ج.م`;
  };

  // Calculate days from now with creative formatting
  const getDaysFromNow = (dateString) => {
    if (!dateString) return '';

    const orderDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - orderDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays === 2) return 'قبل يومين';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `منذ ${weeks} أسبوع`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `منذ ${months} شهر`;
    }

    const years = Math.floor(diffDays / 365);
    return `منذ ${years} سنة`;
  };

  // Get creative time icon based on days
  const getTimeIcon = (dateString) => {
    if (!dateString) return <Clock className="w-3 h-3" />;

    const orderDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - orderDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return <CheckCircle className="w-3 h-3 text-green-500" />;
    if (diffDays <= 1) return <Clock className="w-3 h-3 text-blue-500" />;
    if (diffDays <= 3) return <Clock className="w-3 h-3 text-orange-500" />;
    return <Clock className="w-3 h-3 text-gray-400" />;
  };

  // Get relative date for display
  const getRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    if (date.toDateString() === today.toDateString()) return 'اليوم';
    if (date.toDateString() === tomorrow.toDateString()) return 'غداً';
    if (date.toDateString() === dayAfter.toDateString()) return 'بعد غد';
    if (date > today && date <= nextWeek) return 'هذا الأسبوع';
    if (date < today) return 'تاريخ سابق';
    return 'تاريخ قادم';
  };

  // Handle quick date selection
  const handleQuickDate = (type) => {
    const today = new Date();
    let targetDate = new Date();

    switch (type) {
      case 'today':
        targetDate = today;
        break;
      case 'tomorrow':
        targetDate.setDate(today.getDate() + 1);
        break;
      case 'day_after':
        targetDate.setDate(today.getDate() + 2);
        break;
      case 'next_week':
        targetDate.setDate(today.getDate() + 7);
        break;
      default:
        return;
    }

    const formattedDate = targetDate.toISOString().split('T')[0];
    handleInputChange('follow_up_date', formattedDate);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-4xl h-[90vh] overflow-hidden">
        {/* Content */}
        <div className="overflow-y-auto scrollbar-hide h-full p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Manual Creation Notice */}
            {modalType === 'service' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      إنشاء يدوي مطلوب
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      تم إيقاف الإنشاء التلقائي لإجراءات الخدمة. يجب إنشاء جميع إجراءات الخدمة يدوياً من خلال هذه النافذة.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Service Action Form */}
            {modalType === 'service' && (
              <>
                {/* Order Selection Section */}
                {orders && orders.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div
                      className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer"
                      onClick={() => toggleSection('order')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <List className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">اختيار الطلب</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">اختر الطلب المطلوب خدمته</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {expandedSections.order ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {expandedSections.order && (
                      <div className="p-4 space-y-4">
                        {currentSelectedOrder ? (
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-4">
                              <div className="text-3xl">📦</div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                  #{currentSelectedOrder.tracking_number}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {currentSelectedOrder.product_name}
                                </p>
                                <div className="flex items-center gap-3">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentSelectedOrder.status)}`}>
                                    {currentSelectedOrder.status}
                                  </span>
                                  <span className="text-lg font-bold text-green-600">
                                    {currentSelectedOrder.cod} ج.م
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  تاريخ الطلب: {formatDate(currentSelectedOrder.created_at)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowOrderSelection(true)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                              >
                                تغيير الطلب
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-xl inline-block mb-4">
                              <List className="w-16 h-16 text-gray-300" />
                            </div>
                            <p className="text-lg font-medium text-gray-500">لم يتم اختيار طلب بعد</p>
                            <button
                              type="button"
                              onClick={() => setShowOrderSelection(true)}
                              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                              اختيار طلب
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Product Selection Section - Separated Available & Selected */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div
                    className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer"
                    onClick={() => toggleSection('product')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">إدارة المنتجات</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">اختيار وإدارة المنتجات المطلوبة</div>
                        </div>
                      </div>
                      {expandedSections.product ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {expandedSections.product && (
                    <div className="p-4 space-y-6">
                      {/* Available Products Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            المنتجات المتوفرة
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {products.length} منتج
                          </span>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="البحث في المنتجات..."
                            className="w-full pr-10 pl-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                            aria-label="البحث في المنتجات"
                          />
                        </div>

                        {/* Available Products Grid */}
                        <div
                          className="max-h-64 overflow-y-auto space-y-2"
                          role="region"
                          aria-label="المنتجات المتوفرة"
                          aria-live="polite"
                        >
                          {isSearching ? (
                            <div className="text-center py-4" role="status" aria-live="polite">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto" aria-hidden="true"></div>
                              <p className="text-xs text-gray-500 mt-2">جاري البحث...</p>
                            </div>
                          ) : filteredProducts.length > 0 ? (
                            <div role="list" aria-label="قائمة المنتجات المتوفرة">
                              {filteredProducts.map((product) => (
                                <div
                                  key={product.id}
                                  role="listitem"
                                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                                      <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {product.name_ar || product.name_en}
                                      </h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {product.sku} • {product.category}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      {product.selling_price} ج.م
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => addProductToSelection(product)}
                                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors font-medium"
                                      aria-label={`إضافة ${product.name_ar || product.name_en} إلى الطلب`}
                                    >
                                      إضافة
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : searchTerm.trim() ? (
                            <div className="text-center py-4" role="status" aria-live="polite">
                              <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                              <p className="text-sm text-gray-500">لم يتم العثور على منتجات</p>
                              <p className="text-xs text-gray-400">جرب مصطلحات بحث مختلفة</p>
                            </div>
                          ) : (
                            <div className="text-center py-4" role="status" aria-live="polite">
                              <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                              <p className="text-sm text-gray-500">لا توجد منتجات متوفرة</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Products Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            المنتجات المختارة
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                            {formData.selected_products?.length || 0} منتج
                          </span>
                        </div>

                        {/* Selected Products List */}
                        <div
                          className="space-y-2"
                          role="region"
                          aria-label="المنتجات المختارة"
                          aria-live="polite"
                        >
                          {formData.selected_products && formData.selected_products.length > 0 ? (
                            <div role="list" aria-label="قائمة المنتجات المختارة">
                              {formData.selected_products.map((selectedProduct, index) => (
                                <div
                                  key={`${selectedProduct.id}-${index}`}
                                  role="listitem"
                                  className="flex items-center justify-between p-3 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {selectedProduct.name_ar || selectedProduct.name_en}
                                      </h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {selectedProduct.sku} • الكمية: {selectedProduct.quantity}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                                      <button
                                        type="button"
                                        onClick={() => adjustProductQuantity(index, -1)}
                                        disabled={selectedProduct.quantity <= 1}
                                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
                                        aria-label="تقليل الكمية"
                                      >
                                        <span className="text-sm font-bold">-</span>
                                      </button>
                                      <span className="w-8 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {selectedProduct.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => adjustProductQuantity(index, 1)}
                                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        aria-label="زيادة الكمية"
                                      >
                                        <span className="text-sm font-bold">+</span>
                                      </button>
                                    </div>

                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400 min-w-[60px] text-left">
                                      {(selectedProduct.selling_price * selectedProduct.quantity).toFixed(2)} ج.م
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => removeProductFromSelection(index)}
                                      className="px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                      aria-label={`إزالة ${selectedProduct.name_ar || selectedProduct.name_en} من الطلب`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                              <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">لم يتم اختيار منتجات بعد</p>
                              <p className="text-xs text-gray-400">اختر المنتجات من القائمة أعلاه</p>
                            </div>
                          )}
                        </div>

                        {/* Quick Actions */}
                        {formData.selected_products && formData.selected_products.length > 0 && (
                          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              المجموع: <span className="font-semibold text-green-600 dark:text-green-400">
                                {calculateSubtotal()} ج.م
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={clearAllProducts}
                              className="px-3 py-1.5 text-red-600 dark:text-red-400 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              aria-label="إزالة جميع المنتجات"
                            >
                              إزالة الكل
                            </button>
                          </div>
                        )}

                        {/* WCAG 3 Live Region for Product Updates */}
                        <div
                          className="sr-only"
                          aria-live="assertive"
                          aria-atomic="true"
                          aria-label="تحديثات المنتجات"
                        >
                          {formData.selected_products && formData.selected_products.length > 0
                            ? `تم اختيار ${formData.selected_products.length} منتج. المجموع: ${calculateSubtotal()} ج.م`
                            : 'لم يتم اختيار منتجات بعد'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Service Configuration Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div
                    className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer"
                    onClick={() => toggleSection('service')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-red-500 to-brand-red-600 rounded-xl flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {formData.action_type ?
                              serviceActionTypes.find(type => type.type === formData.action_type)?.label || 'إعداد الخدمة'
                              : 'إعداد الخدمة'
                            }
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formData.action_type ?
                              serviceActionTypes.find(type => type.type === formData.action_type)?.description || 'تكوين تفاصيل الخدمة المطلوبة'
                              : 'تكوين تفاصيل الخدمة المطلوبة'
                            }
                          </div>
                        </div>
                      </div>
                      {expandedSections.service ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {expandedSections.service && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Selected Action Type Display */}
                        {formData.action_type && (
                          <div className="col-span-2 mb-4">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                              نوع الخدمة المحدد
                            </label>
                            <div className="p-4 border border-brand-red-200 dark:border-brand-red-800 rounded-lg bg-brand-red-50 dark:bg-brand-red-900/20">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-red-100 dark:bg-brand-red-800 rounded-lg">
                                  {serviceActionTypes.find(type => type.type === formData.action_type)?.icon || <Wrench className="w-4 h-4" />}
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-sm text-brand-red-700 dark:text-brand-red-300">
                                    {serviceActionTypes.find(type => type.type === formData.action_type)?.label || 'خدمة'}
                                  </div>
                                  <div className="text-xs text-brand-red-600 dark:text-brand-red-400">
                                    {serviceActionTypes.find(type => type.type === formData.action_type)?.description || 'تفاصيل الخدمة'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Priority */}
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            الأولوية
                          </label>
                          <select
                            value={formData.priority}
                            onChange={(e) => handleInputChange('priority', e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-brand-red-500 focus:ring-1 focus:ring-brand-red-500"
                          >
                            <option value="low">منخفضة</option>
                            <option value="medium">متوسطة</option>
                            <option value="high">عالية</option>
                            <option value="urgent">عاجلة</option>
                          </select>
                        </div>

                        {/* COD Amount */}
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            مبلغ الدفع عند الاستلام
                          </label>
                          <input
                            type="number"
                            value={formData.cod}
                            onChange={(e) => handleInputChange('cod', parseFloat(e.target.value) || 0)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-brand-red-500 focus:ring-1 focus:ring-brand-red-500"
                            placeholder="0"
                          />
                        </div>

                        {/* Assigned Technician */}
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            متابعه صيانه المسؤول
                          </label>
                          <input
                            type="text"
                            value={formData.assigned_technician}
                            onChange={(e) => handleInputChange('assigned_technician', e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-brand-red-500 focus:ring-1 focus:ring-brand-red-500"
                            placeholder="اسم متابعه صيانه"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Parts Selection Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div
                    className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer"
                    onClick={() => toggleSection('parts')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                          <Settings className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">قطع الغيار</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">اختيار قطع الغيار المطلوبة</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {formData.parts_required.length > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {formData.parts_required.length}
                          </span>
                        )}
                        {expandedSections.parts ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {expandedSections.parts && (
                    <div className="p-4 space-y-4">
                      {/* Replacement Type Selection Cards */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">نوع الاستبدال</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-slide-in-bottom">
                          {/* Full Replacement Card */}
                          <button
                            type="button"
                            onClick={() => {
                              console.log('🔄 Full Replacement Card Clicked');
                              console.log('📊 Current State:', {
                                showPartSearch: false,
                                replacementType: null,
                                partsRequired: formData.parts_required.length,
                                expandedSections: expandedSections
                              });

                              setShowPartSearch(true);
                              setReplacementType('full');

                              console.log('✅ State Updated - showPartSearch: true, replacementType: full');
                            }}
                            className="group relative p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-300 text-center overflow-hidden"
                          >
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/5 dark:to-orange-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Content */}
                            <div className="relative z-10 space-y-3">
                              {/* Icon */}
                              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                                <Package className="w-6 h-6 text-white" />
                              </div>

                              {/* Text */}
                              <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">استبدال كلي</h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400">استبدال المنتج بآخر جديد</p>
                              </div>

                              {/* Badge */}
                              <span className="inline-block px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">
                                جديد
                              </span>
                            </div>

                            {/* Hover Effect */}
                            <div className="absolute inset-0 border-2 border-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </button>

                          {/* Partial Replacement Card */}
                          <button
                            type="button"
                            onClick={() => {
                              console.log('🔄 Partial Replacement Card Clicked');
                              console.log('📊 Current State:', {
                                showPartSearch: false,
                                replacementType: null,
                                partsRequired: formData.parts_required.length,
                                expandedSections: expandedSections
                              });

                              setShowPartSearch(true);
                              setReplacementType('partial');

                              console.log('✅ State Updated - showPartSearch: true, replacementType: partial');
                            }}
                            className="group relative p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all duration-300 text-center overflow-hidden"
                          >
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/5 dark:to-yellow-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Content */}
                            <div className="relative z-10 space-y-3">
                              {/* Icon */}
                              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                                <Settings className="w-6 h-6 text-white" />
                              </div>

                              {/* Text */}
                              <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">استبدال جزئي</h5>
                                <p className="text-xs text-gray-600 dark:text-gray-400">استبدال أجزاء معينة</p>
                              </div>

                              {/* Badge */}
                              <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs font-medium">
                                أجزاء
                              </span>
                            </div>

                            {/* Hover Effect */}
                            <div className="absolute inset-0 border-2 border-orange-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </button>
                        </div>
                      </div>

                      {/* Empty State for No Selection */}
                      {!showPartSearch && formData.parts_required.length === 0 && (
                        <div className="animate-fade-in">
                          <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Settings className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لم يتم اختيار نوع الاستبدال</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">اختر نوع الاستبدال المطلوب للبدء في إضافة قطع الغيار</p>

                            {/* Quick Action Buttons */}
                            <div className="flex items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPartSearch(true);
                                  setReplacementType('full');
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
                              >
                                <Package className="w-4 h-4" />
                                استبدال كلي
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPartSearch(true);
                                  setReplacementType('partial');
                                }}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center gap-2"
                              >
                                <Settings className="w-4 h-4" />
                                استبدال جزئي
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Selected Parts Display */}
                      {formData.parts_required.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">القطع المختارة</h4>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                              {formData.parts_required.length} قطعة
                            </span>
                          </div>

                          <div className="space-y-2">
                            {formData.parts_required.map((part, index) => (
                              <div key={index} className="group relative p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">🔧</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{part.part_name}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{part.part_sku}</p>
                                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full mt-1 inline-block">
                                        {part.part_type}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-1">
                                      <button
                                        type="button"
                                        onClick={() => updatePart(index, 'quantity', Math.max(1, part.quantity - 1))}
                                        className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                      >
                                        <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">-</span>
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        value={part.quantity}
                                        onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 1)}
                                        className="w-12 p-1 border-0 bg-transparent text-center text-sm font-medium text-gray-900 dark:text-white focus:ring-0 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updatePart(index, 'quantity', part.quantity + 1)}
                                        className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                      >
                                        <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">+</span>
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removePart(index)}
                                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full Replacement Products Display */}
                      {formData.replacement_new_products.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">المنتجات الجديدة للاستبدال</h4>
                            </div>
                            <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">
                              {formData.replacement_new_products.length} منتج
                            </span>
                          </div>

                          <div className="space-y-2">
                            {formData.replacement_new_products.map((product, index) => (
                              <div key={index} className="group relative p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">📦</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name_ar}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</p>
                                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full mt-1 inline-block">
                                        {product.category}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-1">
                                      <button
                                        type="button"
                                        onClick={() => updateReplacementNewProductQuantity(index, Math.max(1, product.quantity - 1))}
                                        className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                      >
                                        <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">-</span>
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        value={product.quantity}
                                        onChange={(e) => updateReplacementNewProductQuantity(index, parseInt(e.target.value) || 1)}
                                        className="w-12 p-1 border-0 bg-transparent text-center text-sm font-medium text-gray-900 dark:text-white focus:ring-0 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateReplacementNewProductQuantity(index, product.quantity + 1)}
                                        className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                      >
                                        <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">+</span>
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeReplacementNewProduct(index)}
                                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Old Products for Full Replacement Display */}
                      {formData.replacement_old_products.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"></div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">المنتجات القديمة للاستبدال</h4>
                            </div>
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs font-medium">
                              {formData.replacement_old_products.length} منتج
                            </span>
                          </div>

                          <div className="space-y-2">
                            {formData.replacement_old_products.map((product, index) => (
                              <div key={index} className="group relative p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">🔄</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name_ar}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</p>
                                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full mt-1 inline-block">
                                        {product.part_type}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-1">
                                      <button
                                        type="button"
                                        onClick={() => updateReplacementOldProductQuantity(index, Math.max(1, product.quantity - 1))}
                                        className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                      >
                                        <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">-</span>
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        value={product.quantity}
                                        onChange={(e) => updateReplacementOldProductQuantity(index, parseInt(e.target.value) || 1)}
                                        className="w-12 p-1 border-0 bg-transparent text-center text-sm font-medium text-gray-900 dark:text-white focus:ring-0 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateReplacementOldProductQuantity(index, product.quantity + 1)}
                                        className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                      >
                                        <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">+</span>
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeReplacementOldProduct(index)}
                                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div
                    className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer"
                    onClick={() => toggleSection('notes')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">ملاحظات إضافية</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">تفاصيل إضافية عن الخدمة</div>
                        </div>
                      </div>
                      {expandedSections.notes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {expandedSections.notes && (
                    <div className="p-4">
                      <textarea
                        value={formData.service_notes}
                        onChange={(e) => handleInputChange('service_notes', e.target.value)}
                        rows={4}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-brand-red-500 focus:ring-1 focus:ring-brand-red-500 resize-none"
                        placeholder="أدخل تفاصيل الخدمة المطلوبة والملاحظات الإضافية..."
                      />
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {(errors.submit || errors.follow_up_type || errors.follow_up_date || errors.follow_up_priority || errors.agent_name || errors.follow_up_notes) && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" role="alert" aria-live="polite">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-red-700 dark:text-red-300 text-sm font-medium">يرجى تصحيح الأخطاء التالية:</p>
                        <ul className="text-red-600 dark:text-red-400 text-sm space-y-1">
                          {errors.submit && <li>• {errors.submit}</li>}
                          {errors.follow_up_type && <li>• {errors.follow_up_type}</li>}
                          {errors.follow_up_date && <li>• {errors.follow_up_date}</li>}
                          {errors.follow_up_priority && <li>• {errors.follow_up_priority}</li>}
                          {errors.agent_name && <li>• {errors.agent_name}</li>}
                          {errors.follow_up_notes && <li>• {errors.follow_up_notes}</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm ${modalType === 'new-order' ? 'bg-green-600 hover:bg-green-700' :
                      modalType === 'follow-up' ? 'bg-purple-600 hover:bg-purple-700' :
                        'bg-brand-red-600 hover:bg-brand-red-700'
                      }`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري الإنشاء...
                      </div>
                    ) : (
                      modalType === 'new-order' ? 'إنشاء الطلب' :
                        modalType === 'follow-up' ? 'جدولة المتابعة' :
                          'إنشاء إجراء الخدمة'
                    )}
                  </button>
                </div>
              </>
            )}

            {/* New Order Form */}
            {modalType === 'new-order' && (
              <>
                {/* Product Selection Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">اختيار المنتجات</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">ابحث واختر المنتجات المطلوبة</div>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Enhanced Product Search */}
                    <div className="space-y-4">
                      {/* Search Input with Auto-Search */}
                      <div className="relative search-container">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            // No need to manage showSearchResults anymore
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              // Search is handled by the useEffect
                            }
                          }}
                          onFocus={() => {
                            // Focus behavior is handled by the useEffect
                          }}
                          placeholder="ابحث في المنتجات المتوفرة بالاسم أو الكود أو الفئة..."
                          className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSearchTerm('');
                              // No need to manage showSearchResults anymore
                            }}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Product Search Results - REMOVED - Now filtering happens in browse section */}

                      {/* Browse Products Section */}
                      {products.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <Package className="w-4 h-4 text-green-500" />
                              {searchTerm.trim() ? 'نتائج البحث' : 'المنتجات المتوفرة'}
                            </h4>
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {(() => {
                                if (searchTerm.trim()) {
                                  return filteredProducts.length;
                                } else if (formData.selectedCategory) {
                                  return products.filter(product => product.category === formData.selectedCategory).length;
                                } else {
                                  return products.length;
                                }
                              })()} منتج
                            </span>
                          </div>

                          {/* Category Badges */}
                          {!searchTerm.trim() && (
                            <div className="relative mb-3 mt-0">
                              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {/* All Products Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, selectedCategory: null }));
                                  }}
                                  className={`text-xs px-3 py-1 rounded-full transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0 ${!formData.selectedCategory
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                    }`}
                                >
                                  الكل ({products.length})
                                </button>

                                {/* Get unique categories from products */}
                                {Array.from(new Set(products.map(product => product.category).filter(Boolean))).map((category, index, array) => {
                                  const categoryCount = products.filter(product => product.category === category).length;
                                  const isSelected = formData.selectedCategory === category;
                                  const isLast = index === array.length - 1;

                                  return (
                                    <button
                                      key={category}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          // Clear category filter
                                          setFormData(prev => ({ ...prev, selectedCategory: null }));
                                        } else {
                                          // Set category filter
                                          setFormData(prev => ({ ...prev, selectedCategory: category }));
                                        }
                                      }}
                                      onMouseEnter={(e) => {
                                        if (isLast) {
                                          // Auto-scroll to show the last item fully
                                          const container = e.target.parentElement;
                                          const scrollLeft = container.scrollLeft;
                                          const containerWidth = container.clientWidth;
                                          const itemWidth = e.target.offsetWidth;
                                          const itemLeft = e.target.offsetLeft;

                                          if (itemLeft + itemWidth > scrollLeft + containerWidth) {
                                            container.scrollTo({
                                              left: itemLeft + itemWidth - containerWidth + 16, // 16px padding
                                              behavior: 'smooth'
                                            });
                                          }
                                        }
                                      }}
                                      className={`text-xs px-3 py-1 rounded-full transition-all duration-200 font-medium whitespace-nowrap flex-shrink-0 ${isSelected
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                        }`}
                                    >
                                      {category} ({categoryCount})
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {isSearching ? (
                            <div className="text-center py-8">
                              <div className="flex items-center justify-center mb-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3"></div>
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">جاري البحث في المنتجات المتوفرة...</p>
                            </div>
                          ) : (searchTerm.trim() ? filteredProducts : products).filter(product => {
                            // Apply category filter if selected
                            if (formData.selectedCategory && !searchTerm.trim()) {
                              return product.category === formData.selectedCategory;
                            }
                            return true;
                          }).length === 0 ? (
                            <div className="text-center py-8">
                              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                                {searchTerm.trim() ? 'لم يتم العثور على منتجات' :
                                  formData.selectedCategory ? `لا توجد منتجات في فئة "${formData.selectedCategory}"` :
                                    'لا توجد منتجات متوفرة'}
                              </p>
                              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                                {searchTerm.trim() ? 'جرب البحث بكلمات مختلفة' :
                                  formData.selectedCategory ? 'جرب اختيار فئة أخرى' :
                                    'لم يتم العثور على منتجات في النظام'}
                              </p>
                              {(searchTerm.trim() || formData.selectedCategory) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchTerm('');
                                    setFormData(prev => ({ ...prev, selectedCategory: null }));
                                  }}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                  مسح الفلتر
                                </button>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {(searchTerm.trim() ? filteredProducts : products).filter(product => {
                                  // Apply category filter if selected
                                  if (formData.selectedCategory && !searchTerm.trim()) {
                                    return product.category === formData.selectedCategory;
                                  }
                                  return true;
                                }).map((product) => (
                                  <button
                                    key={product.sku}
                                    data-product="true"
                                    onClick={() => handleProductSelect(product)}
                                    className="p-4 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-right"
                                  >
                                    <div className="space-y-2">
                                      <div className="text-right">
                                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                                          {product.name_ar}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          {product.sku}
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between">
                                        {product.warranty_period_months > 0 && (
                                          <div className="text-xs text-blue-600 dark:text-blue-400">
                                            ضمان {product.warranty_period_months} شهر
                                          </div>
                                        )}
                                        <div className="font-bold text-green-600 dark:text-green-400">
                                          {formatPrice(product.selling_price)}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>

                              {/* Show More Button - REMOVED - Now showing all products by default */}
                            </>
                          )}
                        </div>
                      )}

                      {/* Selected Products List */}
                      {formData.selected_products && formData.selected_products.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              المنتجات المختارة
                            </h4>
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {formData.selected_products.length} منتج
                            </span>
                          </div>

                          <div className="space-y-2">
                            {formData.selected_products.map((selectedProduct, index) => (
                              <div key={selectedProduct.sku} className="bg-green-50 dark:bg-green-900/20 rounded p-3 border border-green-200 dark:border-green-800">
                                <div className="flex items-center justify-between">
                                  <div className="text-right">
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                      {selectedProduct.name_ar}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {selectedProduct.sku}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="text-left">
                                      <div className="font-bold text-green-600 dark:text-green-400">
                                        {formatPrice(selectedProduct.selling_price * selectedProduct.quantity)}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {selectedProduct.quantity} × {formatPrice(selectedProduct.selling_price)}
                                      </div>
                                    </div>

                                    {/* Quantity Control */}
                                    <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 p-1">
                                      <button
                                        type="button"
                                        onClick={() => updateSelectedProductQuantity(index, Math.max(1, selectedProduct.quantity - 1))}
                                        className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                      >
                                        <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">-</span>
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        value={selectedProduct.quantity}
                                        onChange={(e) => updateSelectedProductQuantity(index, parseInt(e.target.value) || 1)}
                                        className="w-10 p-1 border-0 bg-transparent text-center text-sm font-medium text-gray-900 dark:text-white focus:ring-0 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateSelectedProductQuantity(index, selectedProduct.quantity + 1)}
                                        className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                      >
                                        <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">+</span>
                                      </button>
                                    </div>

                                    {/* Remove Product */}
                                    <button
                                      type="button"
                                      onClick={() => removeSelectedProduct(index)}
                                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty State */}
                      {(!formData.selected_products || formData.selected_products.length === 0) && !searchTerm.trim() && (
                        <div className="text-center py-8">
                          {loading ? (
                            <>
                              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                              </div>
                              <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">جاري تحميل المنتجات...</p>
                              <p className="text-sm text-gray-400 dark:text-gray-500">يرجى الانتظار</p>
                            </>
                          ) : products.length === 0 ? (
                            <>
                              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">لا توجد منتجات متوفرة</p>
                              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">لم يتم العثور على منتجات في النظام</p>
                              <button
                                type="button"
                                onClick={loadProducts}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                إعادة المحاولة
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">لم يتم اختيار منتجات بعد</p>
                              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">ابدأ بالبحث عن المنتجات المطلوبة</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Summary Section */}
                {formData.selected_products && formData.selected_products.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">ملخص الطلب</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">تفاصيل الطلب والخصومات</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* Coupon Section */}
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">%</span>
                          </div>
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">كوبون الخصم</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={formData.couponType || 'percent'}
                            onChange={(e) => setFormData(prev => ({ ...prev, couponType: e.target.value }))}
                            className="text-xs px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="percent">نسبة مئوية</option>
                            <option value="fixed">مبلغ ثابت</option>
                          </select>
                          <input
                            type="number"
                            value={formData.couponValue || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, couponValue: parseFloat(e.target.value) || 0 }))}
                            placeholder="0"
                            className="text-xs px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 w-20 text-center"
                          />
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                            {formData.couponType === 'fixed' ? 'ج.م' : '%'}
                          </span>
                          {formData.couponValue > 0 && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, couponValue: 0 }))}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Summary Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400">عدد المنتجات:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formData.selected_products.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400">إجمالي الكمية:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formData.selected_products.reduce((total, product) => total + product.quantity, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400">المجموع الفرعي:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {calculateSubtotal()} ج.م
                          </span>
                        </div>

                        {/* Coupon Discount */}
                        {formData.couponValue > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-purple-600 dark:text-purple-400 font-medium">خصم الكوبون:</span>
                            <span className="font-medium text-purple-600 dark:text-purple-400">
                              -{formData.couponType === 'fixed'
                                ? `${formData.couponValue.toFixed(2)} ج.م`
                                : `${((parseFloat(calculateSubtotal()) * formData.couponValue) / 100).toFixed(2)} ج.م`
                              }
                            </span>
                          </div>
                        )}

                        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                          <div className="flex justify-between items-center text-base font-bold">
                            <span className="text-gray-900 dark:text-white">إجمالي الطلب:</span>
                            <span className="text-green-600 dark:text-green-400">
                              {(() => {
                                const subtotal = parseFloat(calculateSubtotal());
                                let discount = 0;

                                if (formData.couponValue > 0) {
                                  if (formData.couponType === 'fixed') {
                                    discount = formData.couponValue;
                                  } else {
                                    discount = (subtotal * formData.couponValue) / 100;
                                  }
                                }

                                return `${Math.max(0, subtotal - discount).toFixed(2)} ج.م`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Order Details Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">تفاصيل إضافية</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">معلومات إضافية للطلب</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      {/* Compact COD Input with Inline Toggle */}
                      <div className="space-y-3">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          مبلغ الدفع عند الاستلام
                        </label>

                        {/* COD Input Row */}
                        <div className="flex items-center gap-3">
                          {/* COD Input Field - Not Full Width */}
                          <div className="relative max-w-xs">
                            {/* Inline Toggle Buttons */}
                            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 z-10">
                              <button
                                type="button"
                                onClick={() => handleCodTypeChange('client')}
                                className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${codType === 'client'
                                  ? 'border-green-500 bg-green-500 text-white shadow-sm'
                                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-400 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                  }`}
                                title="استرداد للعميل"
                              >
                                <span className="text-xs font-bold">-</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCodTypeChange('us')}
                                className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${codType === 'us'
                                  ? 'border-red-500 bg-red-500 text-white shadow-sm'
                                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-400 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                  }`}
                                title="نحن نجمع"
                              >
                                <span className="text-xs font-bold">+</span>
                              </button>
                            </div>

                            {/* COD Input Field */}
                            <input
                              type="number"
                              value={Math.abs(formData.new_order_cod)}
                              onChange={(e) => handleCodValueChange(e.target.value)}
                              className="w-full pl-20 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all duration-200"
                              placeholder="0"
                              min="0"
                              step="0.01"
                            />

                            {/* Currency and Type Indicator */}
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                              <span className="text-xs text-gray-400 dark:text-gray-500">ج.م</span>
                              <div className={`w-2 h-2 rounded-full ${codType === 'client' ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                            </div>
                          </div>

                          {/* Compact Shipping Toggle - Clean Business Design */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-600 dark:text-gray-400">الشحن:</span>

                            {/* Clean Toggle Switch - No Stroke, No Hover */}
                            <div className="relative">
                              {/* Toggle Track */}
                              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-all duration-200 relative overflow-hidden">
                                {/* Free Shipping Label (Left) - Green */}
                                <div
                                  className={`absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-medium transition-all duration-200 pointer-events-none
                                    ${shippingEnabled
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-gray-500 dark:text-gray-400'}
                                  `}
                                  style={{
                                    opacity: shippingEnabled ? 1 : 0,
                                    transition: 'opacity 0.2s',
                                  }}
                                >
                                  مجاني
                                </div>

                                {/* Manual Shipping Label (Right) - Red */}
                                <div
                                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium transition-all duration-200 pointer-events-none
                                    ${!shippingEnabled
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-gray-500 dark:text-gray-400'}
                                  `}
                                  style={{
                                    opacity: !shippingEnabled ? 1 : 0,
                                    transition: 'opacity 0.2s',
                                  }}
                                >
                                  يدوي
                                </div>

                                {/* Toggle Handle - Clean, No Stroke, No Hover */}
                                <div
                                  className={`w-6 h-6 bg-white dark:bg-gray-800 rounded-full transform transition-all duration-200 flex items-center justify-center
                                    ${shippingEnabled ? 'translate-x-0' : '-translate-x-12'}
                                  `}
                                  style={{
                                    border: 'none',
                                    boxShadow: 'none',
                                    zIndex: 20,
                                  }}
                                >
                                  <span className={`text-xs font-bold transition-colors duration-200 ${shippingEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {shippingEnabled ? '✓' : '✗'}
                                  </span>
                                </div>
                              </div>

                              {/* Toggle Button - No Focus Ring, No Hover Effects */}
                              <button
                                type="button"
                                onClick={() => setShippingEnabled((prev) => !prev)}
                                className="absolute inset-0 w-full h-full rounded-full cursor-pointer focus:outline-none"
                                title={shippingEnabled ? 'الشحن المجاني مفعل' : 'تفعيل رسوم الشحن'}
                                aria-pressed={shippingEnabled}
                              />
                            </div>

                            {/* Manual Cost Input - Matching COD Style */}
                            {!shippingEnabled && (
                              <div className="relative">
                                <input
                                  type="number"
                                  value={manualShippingCost}
                                  onChange={(e) => setManualShippingCost(parseFloat(e.target.value) || 0)}
                                  className="w-24 pl-3 pr-8 py-2.5 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-700 text-red-700 dark:text-red-300 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-200"
                                  placeholder="0"
                                  min="0"
                                  step="0.01"
                                />
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-red-500 font-medium">
                                  ج.م
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Automatic Calculation and Summary */}
                        <div className="space-y-2">
                          {/* Auto Calculate Button */}
                          {formData.selected_products && formData.selected_products.length > 0 && (
                            <button
                              type="button"
                              onClick={setAutomaticCOD}
                              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors text-xs"
                            >
                              حساب تلقائي: {calculateAutomaticCOD().toFixed(2)} ج.م
                            </button>
                          )}

                          {/* Manual COD Summary */}
                          {formData.new_order_cod !== 0 && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <span>
                                {codType === 'client' ? 'خصم من العميل' : 'تحصيل من العميل'}
                              </span>
                              <span className={`font-medium ${codType === 'client' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                {codType === 'client' ? '-' : '+'}{Math.abs(formData.new_order_cod).toFixed(2)} ج.م
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Notes */}
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          ملاحظات الطلب
                        </label>
                        <textarea
                          value={formData.new_order_notes}
                          onChange={(e) => handleInputChange('new_order_notes', e.target.value)}
                          rows={2}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none transition-all duration-200"
                          placeholder="ملاحظات إضافية للطلب..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {(errors.submit || errors.selected_products) && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-red-700 dark:text-red-300 text-sm">
                        {errors.submit || errors.selected_products}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.selected_products || formData.selected_products.length === 0}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري الإنشاء...
                      </div>
                    ) : (
                      <span>إنشاء الطلب</span>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Follow-up Form */}
            {modalType === 'follow-up' && (
              <>
                {/* Follow-up Configuration Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <CalendarCheck className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">تفاصيل المتابعة</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">إعداد جدولة المتابعة</div>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">

                    {/* Follow-up Type Selection - Responsive Design */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        نوع المتابعة
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {followUpTypes.map((type) => {
                          const isSelected = formData.follow_up_type === type.type;
                          return (
                            <button
                              key={type.type}
                              type="button"
                              onClick={() => handleInputChange('follow_up_type', type.type)}
                              aria-pressed={isSelected}
                              aria-describedby={`followup-type-${type.type}-desc`}
                              className={`relative p-2 sm:p-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 ${isSelected
                                ? 'border-purple-500 bg-purple-600 text-white'
                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
                                <div className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center ${isSelected
                                  ? 'text-white'
                                  : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                  {type.icon}
                                </div>
                                <div className="text-center sm:text-right flex-1">
                                  <div className={`font-medium text-xs ${isSelected
                                    ? 'text-white'
                                    : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {type.label}
                                  </div>
                                  <div className={`text-xs mt-0.5 hidden sm:block ${isSelected
                                    ? 'text-white/80'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {type.description}
                                  </div>
                                </div>
                              </div>

                              {/* Simple Selection Indicator */}
                              {isSelected && (
                                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-purple-600" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* WCAG 3 Live Region */}
                      <div className="sr-only" aria-live="assertive" aria-atomic="true">
                        {formData.follow_up_type &&
                          `تم اختيار نوع متابعة ${followUpTypes.find(type => type.type === formData.follow_up_type)?.label}`
                        }
                      </div>
                    </div>

                    {/* Time Selection - Responsive Design */}
                    {/* Clean Date & Time Selection */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        موعد المتابعة
                      </label>

                      {/* Quick Selection */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          { key: 'today', label: 'اليوم' },
                          { key: 'tomorrow', label: 'غداً' },
                          { key: 'day_after', label: 'بعد غد' },
                          { key: 'next_week', label: 'بعد أسبوع' }
                        ].map((option) => {
                          const isSelected = formData.follow_up_date &&
                            (option.key === 'today' && getRelativeDate(formData.follow_up_date) === 'اليوم') ||
                            (option.key === 'tomorrow' && getRelativeDate(formData.follow_up_date) === 'غداً') ||
                            (option.key === 'day_after' && getRelativeDate(formData.follow_up_date) === 'بعد غد') ||
                            (option.key === 'next_week' && getRelativeDate(formData.follow_up_date) === 'هذا الأسبوع');

                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => handleQuickDate(option.key)}
                              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${isSelected
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Date & Time Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-slide-in-bottom">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            التاريخ
                          </label>
                          <input
                            type="date"
                            value={formData.follow_up_date}
                            onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            الوقت
                          </label>
                          <input
                            type="time"
                            value={formData.follow_up_time}
                            onChange={(e) => handleInputChange('follow_up_time', e.target.value)}
                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Priority Selection - Responsive Design */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        مستوى الأولوية
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          {
                            value: 'low',
                            label: 'منخفضة',
                            description: 'متابعة عادية',
                            color: 'bg-green-500',
                            icon: <AlertCircle className="w-3 h-3" />
                          },
                          {
                            value: 'medium',
                            label: 'متوسطة',
                            description: 'متابعة متوسطة',
                            color: 'bg-yellow-500',
                            icon: <AlertCircle className="w-3 h-3" />
                          },
                          {
                            value: 'high',
                            label: 'عالية',
                            description: 'متابعة مهمة',
                            color: 'bg-orange-500',
                            icon: <AlertCircle className="w-3 h-3" />
                          },
                          {
                            value: 'urgent',
                            label: 'عاجلة',
                            description: 'متابعة فورية',
                            color: 'bg-red-500',
                            icon: <AlertCircle className="w-3 h-3" />
                          }
                        ].map((priority) => {
                          const isSelected = formData.follow_up_priority === priority.value;
                          return (
                            <button
                              key={priority.value}
                              type="button"
                              onClick={() => handleInputChange('follow_up_priority', priority.value)}
                              aria-pressed={isSelected}
                              aria-describedby={`priority-${priority.value}-desc`}
                              className={`relative p-2 sm:p-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 ${isSelected
                                ? `border-transparent ${priority.color} text-white`
                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
                                <div className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center ${isSelected
                                  ? 'text-white'
                                  : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                  {priority.icon}
                                </div>
                                <div className="text-center sm:text-right flex-1">
                                  <div className={`font-medium text-xs ${isSelected
                                    ? 'text-white'
                                    : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {priority.label}
                                  </div>
                                  <div className={`text-xs mt-0.5 hidden sm:block ${isSelected
                                    ? 'text-white/80'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {priority.description}
                                  </div>
                                </div>
                              </div>

                              {/* Simple Selection Indicator */}
                              {isSelected && (
                                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-purple-600" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* WCAG 3 Live Region */}
                      <div className="sr-only" aria-live="assertive" aria-atomic="true">
                        {formData.follow_up_priority &&
                          `تم اختيار أولوية ${formData.follow_up_priority === 'low' ? 'منخفضة' :
                            formData.follow_up_priority === 'medium' ? 'متوسطة' :
                              formData.follow_up_priority === 'high' ? 'عالية' : 'عاجلة'}`
                        }
                      </div>
                    </div>

                    {/* Agent Information Section */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        اسم الموظف المسؤول
                      </label>
                      <input
                        type="text"
                        value={formData.agent_name}
                        onChange={(e) => handleInputChange('agent_name', e.target.value)}
                        placeholder="أدخل اسم الموظف المسؤول عن المتابعة..."
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        required
                      />
                      {errors.agent_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.agent_name}</p>
                      )}
                    </div>

                    {/* Order Selection Section - Inline */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          ربط الطلب (اختياري)
                        </label>
                        <div className="flex items-center gap-2">
                          {!formData.follow_up_order_id && (
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {orders.length} طلب متاح
                            </span>
                          )}
                          {formData.follow_up_order_id && (
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              طلب محدد
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected Order Display - Enhanced with Customer Info */}
                      {formData.follow_up_order_id && (
                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              {(() => {
                                const selectedOrder = orders.find(o => o.id == formData.follow_up_order_id);
                                const customerKey = selectedOrder?.customer_phone || selectedOrder?.receiver_phone || selectedOrder?.customer_name || selectedOrder?.receiver_name || 'unknown';
                                return (
                                  <>
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getCustomerColor(customerKey)} flex items-center justify-center text-white text-sm font-bold`}>
                                      {getCustomerInitials(selectedOrder?.customer_name || selectedOrder?.receiver_name || 'غير محدد')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                                          #{selectedOrder?.tracking_number}
                                        </span>
                                        {(selectedOrder?.notes || selectedOrder?.product_description || selectedOrder?.product_details) && (
                                          <>
                                            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                              {selectedOrder?.notes || selectedOrder?.product_description || selectedOrder?.product_details}
                                            </span>
                                          </>
                                        )}
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedOrder?.status)}`}>
                                          {selectedOrder?.status}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-3 text-gray-500">
                                          <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span className="truncate">{selectedOrder?.customer_name || selectedOrder?.receiver_name || 'غير محدد'}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            <span className="truncate">{selectedOrder?.customer_phone || selectedOrder?.receiver_phone || 'غير محدد'}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-500">
                                            {selectedOrder?.quantity}
                                          </span>
                                          <span className="font-medium text-green-600 dark:text-green-400">
                                            {selectedOrder?.cod} ج.م
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-2.5 h-2.5" />
                                          <span className="truncate">{selectedOrder?.dropoff_city_name || 'غير محدد'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          {getTimeIcon(selectedOrder?.created_at)}
                                          <span>{getDaysFromNow(selectedOrder?.created_at)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleInputChange('follow_up_order_id', '')}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              aria-label="إزالة الطلب المحدد"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Orders List - Inline */}
                      {!formData.follow_up_order_id && (
                        <div className="space-y-2">
                          {/* Search Bar */}
                          <div className="relative">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              value={orderSearchTerm}
                              onChange={(e) => setOrderSearchTerm(e.target.value)}
                              placeholder="البحث بالاسم، رقم الهاتف، رقم التتبع، المنتج..."
                              className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                            />
                            {orderSearchTerm && (
                              <button
                                type="button"
                                onClick={() => setOrderSearchTerm('')}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Enhanced Orders Display with Customer Grouping */}
                          <div className="max-h-72 overflow-y-auto scrollbar-hide">
                            {groupedOrders.length > 0 ? (
                              <div className="space-y-3">
                                {groupedOrders.map((customerGroup) => (
                                  <div key={customerGroup.customerKey} className="space-y-2">
                                    {/* Customer Header */}
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getCustomerColor(customerGroup.customerKey)} flex items-center justify-center text-white text-sm font-bold`}>
                                        {getCustomerInitials(customerGroup.customerName)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                            {customerGroup.customerName}
                                          </span>
                                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                            {customerGroup.orderCount} طلب
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                          {customerGroup.customerPhone}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Customer Orders Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-4">
                                      {customerGroup.orders.map((order) => (
                                        <button
                                          key={order.id}
                                          onClick={() => handleOrderSelect(order)}
                                          className="group relative p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all duration-200 text-right overflow-hidden"
                                        >
                                          {/* Order Header with Customer Color Indicator */}
                                          <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${getCustomerColor(customerGroup.customerKey)} flex items-center justify-center flex-shrink-0`}>
                                                <Package className="w-3 h-3 text-white" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1 mb-0.5">
                                                  <span className="font-semibold text-xs text-gray-900 dark:text-white">
                                                    #{order.tracking_number}
                                                  </span>
                                                  <div className="flex items-center gap-0.5">
                                                    <div className={`w-1 h-1 rounded-full bg-gradient-to-r ${getCustomerColor(customerGroup.customerKey)}`}></div>
                                                  </div>
                                                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                    {order.notes || order.product_description || order.product_details || `${order.product_name}`}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                  <MapPin className="w-2.5 h-2.5" />
                                                  <span className="truncate">{order.dropoff_city_name || 'غير محدد'}</span>
                                                </div>
                                              </div>
                                            </div>
                                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(order.status)}`}>
                                              {order.status}
                                            </span>
                                          </div>

                                          {/* Product Info */}
                                          <div className="mb-1.5">
                                            <h4 className="font-medium text-xs text-gray-900 dark:text-white mb-0.5 line-clamp-1">
                                              {order.product_name}
                                            </h4>
                                          </div>

                                          {/* Order Details */}
                                          <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                              {getTimeIcon(order.created_at)}
                                              <span className="truncate">{getDaysFromNow(order.created_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span className="text-gray-500 dark:text-gray-400 text-xs">
                                                {order.quantity}
                                              </span>
                                              <span className="font-semibold text-green-600 dark:text-green-400 text-xs">
                                                {order.cod} ج.م
                                              </span>
                                            </div>
                                          </div>

                                          {/* Customer Color Border on Hover */}
                                          <div className={`absolute inset-0 border-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 bg-gradient-to-r ${getCustomerColor(customerGroup.customerKey)}`} style={{ opacity: 0.1 }} />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                  {orderSearchTerm ? 'لا توجد نتائج' : 'لا توجد طلبات'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                  {orderSearchTerm ? 'لم يتم العثور على طلبات تطابق البحث' : 'لم يتم العثور على طلبات لهذا العميل'}
                                </p>

                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes Section - Consistent with Form Theme */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        ملاحظات المتابعة
                      </label>
                      <div className="relative">
                        <textarea
                          value={formData.follow_up_notes}
                          onChange={(e) => {
                            handleInputChange('follow_up_notes', e.target.value);
                            // Auto-resize functionality
                            const textarea = e.target;
                            textarea.style.height = 'auto';
                            const minHeight = 120; // 5 lines minimum (24px per line)
                            const maxHeight = 300; // Maximum height
                            const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
                            textarea.style.height = `${newHeight}px`;
                          }}
                          rows={5}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                          placeholder="أدخل تفاصيل المتابعة والملاحظات الإضافية..."
                          style={{
                            minHeight: '120px', // 5 lines minimum
                            maxHeight: '300px'  // Maximum height
                          }}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
                          {formData.follow_up_notes?.length || 0}/500
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {errors.submit && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-red-700 dark:text-red-300 text-sm">{errors.submit}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.follow_up_type || !formData.follow_up_date || !formData.follow_up_priority || !formData.agent_name || !formData.follow_up_notes}
                    aria-describedby={loading ? "loading-description" : "submit-description"}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                        <span>جاري الجدولة...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4" />
                        <span>جدولة المتابعة</span>
                      </div>
                    )}
                  </button>

                  {/* WCAG 3 Live Regions */}
                  <div id="loading-description" className="sr-only" aria-live="assertive" aria-atomic="true">
                    جاري معالجة طلب جدولة المتابعة، يرجى الانتظار
                  </div>
                  <div id="submit-description" className="sr-only" aria-live="polite" aria-atomic="true">
                    انقر لجدولة المتابعة مع الإعدادات المحددة
                  </div>
                </div>
              </>
            )}
          </form>
        </div>



        {/* Enhanced Parts Search Modal with Empty Views */}
        {showPartSearch && (
          (() => {
            console.log('🎯 Modal Render Triggered');
            console.log('📋 Modal State:', {
              showPartSearch,
              replacementType,
              partSearchTerm,
              filteredParts: filteredParts.length,
              allParts: allParts.length
            });
            return true;
          })() && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${replacementType === 'full'
                      ? 'bg-gradient-to-r from-red-500 to-orange-500'
                      : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                      }`}>
                      {replacementType === 'full' ? (
                        <Package className="w-5 h-5 text-white" />
                      ) : (
                        <Settings className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {replacementType === 'full' ? 'استبدال كلي' : 'استبدال جزئي'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {replacementType === 'full'
                          ? 'اختر المنتج الجديد للاستبدال'
                          : 'اختر قطع الغيار المطلوبة'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      console.log('❌ Modal Close Button Clicked');
                      setShowPartSearch(false);
                      setReplacementType(null);
                      setPartSearchTerm('');
                      console.log('✅ Modal State Reset');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={partSearchTerm}
                        onChange={(e) => setPartSearchTerm(e.target.value)}
                        placeholder={replacementType === 'full'
                          ? "البحث في المنتجات المتوفرة..."
                          : "البحث في قطع الغيار..."
                        }
                        className="w-full pl-12 pr-12 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                      />
                      {partSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setPartSearchTerm('')}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Empty State - Initial View */}
                  {!partSearchTerm.trim() && (
                    (() => {
                      console.log('🎨 Empty State Render Triggered');
                      console.log('📊 Empty State Conditions:', {
                        partSearchTerm: partSearchTerm,
                        trimmed: partSearchTerm.trim(),
                        replacementType: replacementType
                      });
                      return true;
                    })() && (
                      <div className="text-center py-16">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${replacementType === 'full'
                          ? 'bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20'
                          : 'bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20'
                          }`}>
                          {replacementType === 'full' ? (
                            <Package className="w-12 h-12 text-red-500" />
                          ) : (
                            <Settings className="w-12 h-12 text-orange-500" />
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                          {replacementType === 'full'
                            ? 'ابدأ بالبحث عن المنتج الجديد'
                            : 'ابدأ بالبحث عن قطع الغيار'
                          }
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                          {replacementType === 'full'
                            ? 'اكتب اسم المنتج أو الكود للعثور على المنتج المناسب للاستبدال'
                            : 'اكتب اسم القطعة أو الكود للعثور على قطع الغيار المطلوبة'
                          }
                        </p>

                        {/* Quick Search Suggestions */}
                        <div className="flex flex-wrap justify-center gap-2">
                          {replacementType === 'full' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  console.log('🔍 Quick Search: هاند بلندر');
                                  setPartSearchTerm('هاند بلندر');
                                }}
                                className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                              >
                                هاند بلندر
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  console.log('🔍 Quick Search: مكنسة');
                                  setPartSearchTerm('مكنسة');
                                }}
                                className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                              >
                                مكنسة
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  console.log('🔍 Quick Search: خلاط');
                                  setPartSearchTerm('خلاط');
                                }}
                                className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
                              >
                                خلاط
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  console.log('🔍 Quick Search: بطارية');
                                  setPartSearchTerm('بطارية');
                                }}
                                className="px-4 py-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-sm"
                              >
                                بطارية
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  console.log('🔍 Quick Search: محرك');
                                  setPartSearchTerm('محرك');
                                }}
                                className="px-4 py-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-sm"
                              >
                                محرك
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  console.log('🔍 Quick Search: شاشة');
                                  setPartSearchTerm('شاشة');
                                }}
                                className="px-4 py-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-sm"
                              >
                                شاشة
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {/* Search Results */}
                  {partSearchTerm.trim() && (
                    (() => {
                      console.log('🔍 Search Results Render Triggered');
                      console.log('📊 Search State:', {
                        partSearchTerm: partSearchTerm,
                        filteredParts: filteredParts.length,
                        replacementType: replacementType
                      });
                      return true;
                    })() && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            نتائج البحث
                          </h4>
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {replacementType === 'full' ? filteredProducts.length : filteredParts.length} نتيجة
                          </span>
                        </div>

                        {replacementType === 'full' ? (
                          // Show products for full replacement
                          filteredProducts.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لم يتم العثور على منتجات</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                جرب البحث بكلمات مختلفة أو تحقق من الإملاء
                              </p>
                              <button
                                type="button"
                                onClick={() => setPartSearchTerm('')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                              >
                                مسح البحث
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredProducts.map((product) => (
                                <button
                                  key={product.sku}
                                  onClick={() => handleProductSelect(product)}
                                  className="group relative p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-red-300 dark:hover:border-red-600 hover:shadow-lg transition-all duration-200 text-right overflow-hidden"
                                >
                                  {/* Background Pattern */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/5 dark:to-orange-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                  {/* Content */}
                                  <div className="relative z-10 space-y-3">
                                    {/* Icon */}
                                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                                      <span className="text-white text-lg">📦</span>
                                    </div>

                                    {/* Text */}
                                    <div>
                                      <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{product.name_ar}</h5>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</p>
                                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full mt-1 inline-block">
                                        {product.category}
                                      </span>
                                    </div>

                                    {/* Stock Info */}
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500 dark:text-gray-400">المتوفر:</span>
                                      <span className={`font-medium ${product.available_quantity > 10
                                        ? 'text-green-600 dark:text-green-400'
                                        : product.available_quantity > 0
                                          ? 'text-orange-600 dark:text-orange-400'
                                          : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {product.available_quantity} قطعة
                                      </span>
                                    </div>
                                  </div>

                                  {/* Hover Effect */}
                                  <div className="absolute inset-0 border-2 border-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </button>
                              ))}
                            </div>
                          )
                        ) : (
                          // Show parts for partial replacement
                          filteredParts.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لم يتم العثور على قطع غيار</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                جرب البحث بكلمات مختلفة أو تحقق من الإملاء
                              </p>
                              <button
                                type="button"
                                onClick={() => setPartSearchTerm('')}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                              >
                                مسح البحث
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredParts.map((part) => (
                                <button
                                  key={part.part_sku}
                                  onClick={() => handlePartSelect(part)}
                                  className="group relative p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-lg transition-all duration-200 text-right overflow-hidden"
                                >
                                  {/* Background Pattern */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/5 dark:to-yellow-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                  {/* Content */}
                                  <div className="relative z-10 space-y-3">
                                    {/* Icon */}
                                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                                      <span className="text-white text-lg">🔧</span>
                                    </div>

                                    {/* Text */}
                                    <div>
                                      <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{part.part_name}</h5>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{part.part_sku}</p>
                                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full mt-1 inline-block">
                                        {part.part_type}
                                      </span>
                                    </div>

                                    {/* Stock Info */}
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500 dark:text-gray-400">المتوفر:</span>
                                      <span className={`font-medium ${part.stock_quantity > 10
                                        ? 'text-green-600 dark:text-green-400'
                                        : part.stock_quantity > 0
                                          ? 'text-orange-600 dark:text-orange-400'
                                          : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {part.stock_quantity} قطعة
                                      </span>
                                    </div>
                                  </div>

                                  {/* Hover Effect */}
                                  <div className="absolute inset-0 border-2 border-orange-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </button>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )
        )}

      </div>
    </div>
  );
};

export default NewServiceActionForm; 