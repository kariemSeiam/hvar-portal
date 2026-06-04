/**
 * Comprehensive Permissions Utility
 * Handles camera permissions across all devices, browsers, and versions
 */



// Device and browser detection
export const detectDeviceAndBrowser = () => {
  const userAgent = navigator.userAgent;
  
  // Device detection
  const deviceInfo = {
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isAndroid: /Android/i.test(userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(userAgent),
    isTablet: /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent),
    isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    hasCamera: !!navigator.mediaDevices?.getUserMedia,
    hasPermissions: !!navigator.permissions?.query,
    hasSecureContext: window.isSecureContext,
    userAgent
  };

  // Browser detection with version
  const browserInfo = {
    isChrome: /Chrome/i.test(userAgent) && !/Edge/i.test(userAgent),
    isSafari: /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent),
    isFirefox: /Firefox/i.test(userAgent),
    isEdge: /Edge/i.test(userAgent),
    isOpera: /Opera|OPR/i.test(userAgent),
    isIE: /MSIE|Trident/i.test(userAgent),
    version: userAgent.match(/(Chrome|Safari|Firefox|Edge|Opera|OPR|MSIE|Trident)\/(\d+)/)?.[2] || 'unknown',
    isOldVersion: false
  };

  // Check for old browser versions
  const version = parseInt(browserInfo.version);
  if (browserInfo.isChrome && version < 53) browserInfo.isOldVersion = true;
  if (browserInfo.isFirefox && version < 36) browserInfo.isOldVersion = true;
  if (browserInfo.isSafari && version < 11) browserInfo.isOldVersion = true;
  if (browserInfo.isEdge && version < 79) browserInfo.isOldVersion = true;

  const result = { deviceInfo, browserInfo };
  
  return result;
};

// Check current permission status with enhanced detection
export const checkCameraPermission = async () => {
  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices?.getUserMedia) {
      return {
        state: 'not_supported',
        granted: false,
        denied: false,
        prompt: false
      };
    }

    // Check if we're in a secure context
    if (!window.isSecureContext) {
      return {
        state: 'not_secure',
        granted: false,
        denied: false,
        prompt: false
      };
    }

    // Try to get camera stream to check permission
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    
    // Stop the stream immediately
    stream.getTracks().forEach(track => track.stop());
    
    return {
      state: 'granted',
      granted: true,
      denied: false,
      prompt: false
    };
  } catch (error) {
    // If getUserMedia fails, check if it's a permission issue
    if (error.name === 'NotAllowedError') {
      return {
        state: 'denied',
        granted: false,
        denied: true,
        prompt: false
      };
    } else if (error.name === 'NotFoundError') {
      return {
        state: 'not_found',
        granted: false,
        denied: false,
        prompt: false
      };
    } else {
      // For other errors, assume prompt state
      return {
        state: 'prompt',
        granted: false,
        denied: false,
        prompt: true
      };
    }
  }
};

// Request camera permission with comprehensive error handling
export const requestCameraPermission = async (constraints = {}) => {
  const defaultConstraints = {
    video: {
      facingMode: 'environment',
      width: { ideal: 1280, min: 640, max: 1920 },
      height: { ideal: 720, min: 480, max: 1080 },
      frameRate: { ideal: 30, min: 15, max: 60 }
    }
  };

  const finalConstraints = {
    ...defaultConstraints,
    ...constraints
  };

  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia not supported');
    }

    // Check if we're in a secure context (required for camera access)
    if (!window.isSecureContext) {
      throw new Error('Camera access requires HTTPS or localhost');
    }

    const stream = await navigator.mediaDevices.getUserMedia(finalConstraints);
    
    // Stop the test stream immediately
    stream.getTracks().forEach(track => track.stop());
    
    return {
      success: true,
      stream: null, // Already stopped
      error: null
    };
  } catch (error) {
    console.error('Camera permission request failed:', error);
    
    // Enhanced error categorization
    const errorInfo = {
      name: error.name,
      message: error.message,
      type: 'unknown'
    };

    switch (error.name) {
      case 'NotAllowedError':
        errorInfo.type = 'permission_denied';
        errorInfo.userMessage = 'تم رفض إذن الكاميرا من قبل المستخدم';
        break;
      case 'NotFoundError':
        errorInfo.type = 'no_camera';
        errorInfo.userMessage = 'لم يتم العثور على كاميرا متصلة';
        break;
      case 'NotSupportedError':
        errorInfo.type = 'not_supported';
        errorInfo.userMessage = 'المتصفح لا يدعم الوصول للكاميرا';
        break;
      case 'NotReadableError':
        errorInfo.type = 'camera_busy';
        errorInfo.userMessage = 'الكاميرا مشغولة من قبل تطبيق آخر';
        break;
      case 'OverconstrainedError':
        errorInfo.type = 'constraints_error';
        errorInfo.userMessage = 'إعدادات الكاميرا غير متوافقة';
        break;
      case 'SecurityError':
        errorInfo.type = 'security_error';
        errorInfo.userMessage = 'خطأ أمني - تأكد من استخدام HTTPS';
        break;
      default:
        errorInfo.type = 'unknown';
        errorInfo.userMessage = 'خطأ غير معروف في الوصول للكاميرا';
    }

    return {
      success: false,
      stream: null,
      error: errorInfo
    };
  }
};

// Get device-specific camera constraints
export const getDeviceSpecificConstraints = () => {
  const { deviceInfo, browserInfo } = detectDeviceAndBrowser();
  
  const baseConstraints = {
    facingMode: 'environment',
    width: { ideal: 1280, min: 640, max: 1920 },
    height: { ideal: 720, min: 480, max: 1080 },
    frameRate: { ideal: 30, min: 15, max: 60 }
  };

  if (deviceInfo.isAndroid) {
    return {
      ...baseConstraints,
      width: { ideal: 1280, min: 640, max: 1920 },
      height: { ideal: 720, min: 480, max: 1080 },
      frameRate: { ideal: 30, min: 15, max: 60 },
      advanced: [
        { focusMode: 'continuous' },
        { exposureMode: 'continuous' },
        { whiteBalanceMode: 'continuous' }
      ]
    };
  }

  if (deviceInfo.isIOS) {
    return {
      ...baseConstraints,
      width: { ideal: 1920, min: 1280, max: 1920 },
      height: { ideal: 1080, min: 720, max: 1080 },
      frameRate: { ideal: 30, min: 24, max: 60 },
      advanced: [
        { focusMode: 'continuous' },
        { exposureMode: 'continuous' }
      ]
    };
  }

  // Desktop browsers
  return {
    ...baseConstraints,
    width: { ideal: 1920, min: 1280, max: 1920 },
    height: { ideal: 1080, min: 720, max: 1080 },
    frameRate: { ideal: 30, min: 15, max: 60 }
  };
};

// Get browser-specific instructions
export const getBrowserInstructions = () => {
  const { deviceInfo, browserInfo } = detectDeviceAndBrowser();
  
  if (deviceInfo.isAndroid) {
    if (browserInfo.isChrome) {
      return {
        title: 'إعدادات Chrome للأندرويد',
        steps: [
          'اضغط على القائمة (ثلاث نقاط) في شريط العنوان',
          'اختر "إعدادات الموقع"',
          'ابحث عن هذا الموقع في القائمة',
          'غير إعداد الكاميرا إلى "السماح"',
          'أعد تحميل الصفحة'
        ],
        icon: '📱',
        helpUrl: 'https://support.google.com/chrome/answer/2693767'
      };
    }
    
    if (browserInfo.isFirefox) {
      return {
        title: 'إعدادات Firefox للأندرويد',
        steps: [
          'اضغط على القائمة (ثلاث نقاط) في شريط العنوان',
          'اختر "إعدادات الموقع"',
          'ابحث عن هذا الموقع في القائمة',
          'غير إعداد الكاميرا إلى "السماح"',
          'أعد تحميل الصفحة'
        ],
        icon: '📱',
        helpUrl: 'https://support.mozilla.org/en-US/kb/how-manage-camera-permissions-firefox-android'
      };
    }
  }

  if (deviceInfo.isIOS) {
    if (browserInfo.isSafari) {
      return {
        title: 'إعدادات Safari للـ iOS',
        steps: [
          'اذهب إلى إعدادات الجهاز',
          'ابحث عن "Safari" في القائمة',
          'اختر "إعدادات الموقع"',
          'ابحث عن هذا الموقع في القائمة',
          'غير إعداد الكاميرا إلى "السماح"',
          'أعد تحميل الصفحة'
        ],
        icon: '📱',
        helpUrl: 'https://support.apple.com/en-us/HT203033'
      };
    }
  }

  // Desktop instructions
  if (browserInfo.isChrome) {
    return {
      title: 'إعدادات Chrome للكمبيوتر',
      steps: [
        'اضغط على أيقونة القفل في شريط العنوان',
        'ابحث عن "الكاميرا" في القائمة',
        'غير الإعداد إلى "السماح"',
        'أعد تحميل الصفحة'
      ],
      icon: '💻',
      helpUrl: 'https://support.google.com/chrome/answer/2693767'
    };
  }

  if (browserInfo.isFirefox) {
    return {
      title: 'إعدادات Firefox للكمبيوتر',
      steps: [
        'اضغط على أيقونة القفل في شريط العنوان',
        'ابحث عن "الكاميرا" في القائمة',
        'غير الإعداد إلى "السماح"',
        'أعد تحميل الصفحة'
      ],
      icon: '💻',
      helpUrl: 'https://support.mozilla.org/en-US/kb/how-manage-camera-permissions-firefox'
    };
  }

  if (browserInfo.isSafari) {
    return {
      title: 'إعدادات Safari للكمبيوتر',
      steps: [
        'اذهب إلى تفضيلات Safari',
        'اختر "مواقع الويب" من القائمة',
        'ابحث عن "الكاميرا" في القائمة',
        'غير الإعداد إلى "السماح"',
        'أعد تحميل الصفحة'
      ],
      icon: '💻',
      helpUrl: 'https://support.apple.com/en-us/HT203033'
    };
  }

  // Generic instructions
  return {
    title: 'إعدادات المتصفح',
    steps: [
      'ابحث عن أيقونة الكاميرا في شريط العنوان',
      'اضغط على أيقونة الكاميرا',
      'اختر "السماح" من القائمة',
      'أعد تحميل الصفحة'
    ],
    icon: '💻',
    helpUrl: 'https://support.google.com/chrome/answer/2693767'
  };
};

// Check if camera is supported and available
export const checkCameraSupport = () => {
  const { deviceInfo, browserInfo } = detectDeviceAndBrowser();
  
  const support = {
    hasCamera: deviceInfo.hasCamera,
    hasSecureContext: deviceInfo.hasSecureContext,
    hasPermissions: deviceInfo.hasPermissions,
    isOldBrowser: browserInfo.isOldVersion,
    isSupported: true,
    issues: []
  };

  if (!deviceInfo.hasCamera) {
    support.isSupported = false;
    support.issues.push('المتصفح لا يدعم الوصول للكاميرا');
  }

  if (!deviceInfo.hasSecureContext) {
    support.isSupported = false;
    support.issues.push('يجب استخدام HTTPS أو localhost للوصول للكاميرا');
  }

  if (browserInfo.isOldVersion) {
    support.issues.push('إصدار المتصفح قديم - قد لا تعمل جميع الميزات');
  }

  return support;
};

// Aggressive camera permission request with multiple fallback strategies
export const forceCameraPermissionRequest = async () => {
  const { deviceInfo, browserInfo } = detectDeviceAndBrowser();
  
  console.log('Force camera permission request - Device:', deviceInfo);
  console.log('Force camera permission request - Browser:', browserInfo);
  

  
  // Strategy 1: Try multiple constraint variations
  const constraintStrategies = [
    // High quality constraints
    {
      video: {
        facingMode: 'environment',
        width: { ideal: 1920, min: 640 },
        height: { ideal: 1080, min: 480 }
      }
    },
    // Medium quality constraints
    {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280, min: 480 },
        height: { ideal: 720, min: 320 }
      }
    },
    // Basic constraints
    {
      video: {
        facingMode: 'environment',
        width: 640,
        height: 480
      }
    },
    // User-facing camera
    {
      video: {
        facingMode: 'user',
        width: { ideal: 1280, min: 480 },
        height: { ideal: 720, min: 320 }
      }
    },
    // Minimal constraints
    {
      video: {
        width: 320,
        height: 240
      }
    },
    // Most basic - just video
    {
      video: true
    },
    // Try without facingMode
    {
      video: {
        width: { min: 320, ideal: 640 },
        height: { min: 240, ideal: 480 }
      }
    }
  ];

  // Try each strategy
  for (let i = 0; i < constraintStrategies.length; i++) {
    const constraints = constraintStrategies[i];
    console.log(`Trying constraint strategy ${i + 1}:`, constraints);
    
    try {
      // Check if getUserMedia exists
      if (!navigator.mediaDevices?.getUserMedia) {
        console.warn('getUserMedia not supported, trying legacy approach');
        
        // Try legacy getUserMedia
        const legacyGetUserMedia = navigator.getUserMedia || 
                                 navigator.webkitGetUserMedia || 
                                 navigator.mozGetUserMedia || 
                                 navigator.msGetUserMedia;
        
        if (legacyGetUserMedia) {
          return new Promise((resolve, reject) => {
            legacyGetUserMedia.call(navigator, constraints, 
              (stream) => {
                stream.getTracks().forEach(track => track.stop());
                resolve({ success: true, cameraType: 'legacy', strategy: i + 1 });
              },
              (error) => {
                reject(error);
              }
            );
          });
        }
        
        continue; // Try next strategy
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Success! Stop the stream and return
      stream.getTracks().forEach(track => track.stop());
      console.log(`Camera permission granted with strategy ${i + 1}`);
      

      
      return { 
        success: true, 
        cameraType: constraints.video.facingMode || 'unknown',
        strategy: i + 1,
        constraints: constraints
      };
      
    } catch (error) {
      console.warn(`Strategy ${i + 1} failed:`, error.name, error.message);
      
      // If it's a permission error and not the last strategy, continue
      if (error.name === 'NotAllowedError' && i === constraintStrategies.length - 1) {
        // This is the final attempt and user denied permission
        break;
      }
      
      // For other errors, continue to next strategy
      continue;
    }
  }

  // Strategy 2: Try to enumerate devices even without permission
  try {
    console.log('Trying to enumerate media devices...');
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    if (videoDevices.length > 0) {
      console.log('Found video devices:', videoDevices.length);
      
      // Try with specific device ID
      for (const device of videoDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: device.deviceId }
          });
          
          stream.getTracks().forEach(track => track.stop());
          console.log('Camera permission granted with device ID:', device.deviceId);
          
          return { 
            success: true, 
            cameraType: 'device-specific',
            strategy: 'device-enumeration',
            deviceId: device.deviceId
          };
        } catch (error) {
          console.warn('Device-specific request failed:', error.name);
          continue;
        }
      }
    }
  } catch (error) {
    console.warn('Device enumeration failed:', error);
  }

  // Strategy 3: Try WebRTC approach
  try {
    console.log('Trying WebRTC approach...');
    
    const pc = new RTCPeerConnection();
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
      track.stop();
    });
    
    pc.close();
    console.log('Camera permission granted with WebRTC approach');
    
    return { 
      success: true, 
      cameraType: 'webrtc',
      strategy: 'webrtc'
    };
  } catch (error) {
    console.warn('WebRTC approach failed:', error);
  }

  // Strategy 4: Check if it's a security context issue and try workaround
  if (!window.isSecureContext) {
    console.log('Not in secure context, trying alternative approaches...');
    
    // Try to create a temporary secure context iframe
    try {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://localhost:5173'; // Try current host with HTTPS
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Remove after attempt
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
      return {
        success: false,
        error: {
          type: 'security_context_workaround',
          userMessage: 'جاري المحاولة في سياق آمن. قم بإعادة تحميل الصفحة.',
          solution: 'reload_page'
        }
      };
    } catch (error) {
      console.warn('Secure context workaround failed:', error);
    }
  }

  // All strategies failed - return comprehensive error
  const finalError = {
    name: 'AllStrategiesFailed',
    message: 'All camera access strategies failed',
    type: 'comprehensive_failure',
    deviceInfo,
    browserInfo,
    userMessage: 'فشل في الوصول للكاميرا باستخدام جميع الطرق المتاحة.',
    solution: 'comprehensive_fix',
    strategies_tried: constraintStrategies.length,
    secure_context: window.isSecureContext,
    has_media_devices: !!navigator.mediaDevices,
    has_get_user_media: !!navigator.mediaDevices?.getUserMedia
  };

  // Try to provide specific guidance based on the environment
  if (!window.isSecureContext) {
    finalError.userMessage = 'يتطلب الوصول للكاميرا استخدام HTTPS أو localhost. الموقع الحالي غير آمن.';
    finalError.solution = 'use_https';
  } else if (!navigator.mediaDevices) {
    finalError.userMessage = 'المتصفح لا يدعم الوصول للكاميرا. جرب متصفح أحدث.';
    finalError.solution = 'update_browser';
  } else {
    finalError.userMessage = 'تم رفض إذن الكاميرا أو الكاميرا غير متاحة. تحقق من الإعدادات.';
    finalError.solution = 'check_permissions';
  }

  console.error('All camera access strategies failed:', finalError);
  

  
  return {
    success: false,
    error: finalError
  };
};

// Monitor permission changes
export const createPermissionMonitor = (onChange) => {
  if (!navigator.permissions?.query) {
    return null;
  }

  let permission = null;

  const startMonitoring = async () => {
    try {
      permission = await navigator.permissions.query({ name: 'camera' });
      permission.onchange = () => {
        onChange?.(permission.state);
      };
    } catch (error) {
      console.warn('Failed to start permission monitoring:', error);
    }
  };

  const stopMonitoring = () => {
    if (permission) {
      permission.onchange = null;
      permission = null;
    }
  };

  startMonitoring();

  return {
    stop: stopMonitoring
  };
};



export default {
  detectDeviceAndBrowser,
  checkCameraPermission,
  requestCameraPermission,
  forceCameraPermissionRequest,
  getDeviceSpecificConstraints,
  getBrowserInstructions,
  checkCameraSupport,
  createPermissionMonitor
};
 