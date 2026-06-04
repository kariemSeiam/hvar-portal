import React, { useState } from 'react';
import { User, Phone, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import { cn } from '../../utils/tailwind';

/**
 * LoginForm Component
 * Perfect, clean login form with flexible identifier input (username/phone/email)
 * 
 * @param {Object} props
 * @param {Function} props.onSubmit - Submit handler (identifier, password, role)
 * @param {boolean} [props.isLoading=false] - Loading state
 * @param {string} [props.error] - Error message
 * @param {string} [props.role] - User role (call-center, operator, manager)
 */
const LoginForm = ({
  onSubmit,
  isLoading = false,
  error,
  role = 'operator',
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierType, setIdentifierType] = useState('auto'); // auto, username, phone, email
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Detect identifier type automatically
  const detectIdentifierType = (value) => {
    if (!value) return 'auto';
    
    // Email pattern
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'email';
    }
    
    // Phone pattern (Egyptian numbers)
    if (/^(\+20|0)?1[0125][0-9]{8}$/.test(value.replace(/\s/g, ''))) {
      return 'phone';
    }
    
    // Default to username
    return 'username';
  };

  // Get icon based on detected type
  const getIdentifierIcon = () => {
    const type = identifierType === 'auto' ? detectIdentifierType(identifier) : identifierType;
    
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Get placeholder based on role
  const getPlaceholder = () => {
    switch (role) {
      case 'call-center':
        return 'اسم المستخدم أو رقم الهاتف أو البريد الإلكتروني';
      case 'operator':
        return 'اسم المستخدم أو رقم الهاتف أو البريد الإلكتروني';
      case 'manager':
        return 'اسم المستخدم أو البريد الإلكتروني';
      default:
        return 'اسم المستخدم أو رقم الهاتف أو البريد الإلكتروني';
    }
  };

  // Validation
  const validate = () => {
    let isValid = true;
    setIdentifierError('');
    setPasswordError('');

    // Identifier validation
    if (!identifier.trim()) {
      setIdentifierError('هذا الحقل مطلوب');
      isValid = false;
    } else {
      const detectedType = detectIdentifierType(identifier);
      
      // Email validation
      if (detectedType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        setIdentifierError('يرجى إدخال بريد إلكتروني صحيح');
        isValid = false;
      }
      
      // Phone validation (Egyptian)
      if (detectedType === 'phone') {
        const cleanPhone = identifier.replace(/\s/g, '');
        if (!/^(\+20|0)?1[0125][0-9]{8}$/.test(cleanPhone)) {
          setIdentifierError('يرجى إدخال رقم هاتف مصري صحيح');
          isValid = false;
        }
      }
      
      // Username validation (min 3 chars)
      if (detectedType === 'username' && identifier.trim().length < 3) {
        setIdentifierError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        isValid = false;
      }
    }

    // Password validation
    if (!password) {
      setPasswordError('كلمة المرور مطلوبة');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      isValid = false;
    }

    return isValid;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const detectedType = detectIdentifierType(identifier);
    onSubmit({
      identifier: identifier.trim(),
      password,
      type: detectedType,
      role,
    });
  };

  // Handle identifier change
  const handleIdentifierChange = (e) => {
    const value = e.target.value;
    setIdentifier(value);
    setIdentifierError('');
    
    // Auto-detect type
    if (value) {
      const detected = detectIdentifierType(value);
      setIdentifierType(detected);
    } else {
      setIdentifierType('auto');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Identifier Input */}
      <div>
        <Input
          type="text"
          label="اسم المستخدم / رقم الهاتف / البريد الإلكتروني"
          placeholder={getPlaceholder()}
          value={identifier}
          onChange={handleIdentifierChange}
          error={identifierError}
          required
          leftIcon={getIdentifierIcon()}
          disabled={isLoading}
          autoComplete="username"
          dir="ltr"
          className="text-left"
        />
      </div>

      {/* Password Input */}
      <div>
        <Input
          type={showPassword ? 'text' : 'password'}
          label="كلمة المرور"
          placeholder="أدخل كلمة المرور"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError('');
          }}
          error={passwordError}
          required
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          disabled={isLoading}
          autoComplete="current-password"
          dir="ltr"
          className="text-left"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
        className="mt-6"
      >
        تسجيل الدخول
      </Button>

      {/* General Error Display */}
      {error && !identifierError && !passwordError && (
        <div className="mt-4 rounded-md bg-red-50 p-3 dark:bg-red-900/30">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </form>
  );
};

export default LoginForm;
