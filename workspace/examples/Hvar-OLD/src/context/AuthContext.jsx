import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Authentication Context
 */
const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

/**
 * Authentication Provider Component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);
  
  /**
   * Check if user is authenticated
   */
  const checkAuth = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      const storedTeam = localStorage.getItem('hvar_team');
      const storedUserData = localStorage.getItem('hvar_user_data');
      
      if (token && storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
        } catch (e) {
          // Fallback to mock user if parsing fails
          const mockUser = {
            id: '1',
            name: 'محمد علي',
            email: 'admin@example.com',
            role: localStorage.getItem('hvar_user_role') || 'operator',
            avatar: null,
            team: storedTeam || null
          };
          setUser(mockUser);
        }
      }
      
      // In a real app, you would validate the token with your API
      // const response = await api.auth.me();
      // setUser(response.data.user);
    } catch (error) {
      // If token is invalid, clear it
      localStorage.removeItem('token');
      localStorage.removeItem('hvar_user_data');
      localStorage.removeItem('hvar_user_role');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Login user with flexible identifier (username/phone/email) and role
   */
  const login = async (identifier, password, role = 'operator', team = null) => {
    try {
      // Demo credentials for different roles
      const demoCredentials = {
        'call-center': [
          { identifier: 'callcenter@example.com', password: 'password123', name: 'أحمد محمد', phone: '01012345678' },
          { identifier: '01012345678', password: 'password123', name: 'فاطمة علي', phone: '01012345678' },
          { identifier: 'callcenter1', password: 'password123', name: 'سارة أحمد', phone: '01087654321' },
        ],
        'operator': [
          { identifier: 'operator@example.com', password: 'password123', name: 'محمد محمود', phone: '01011111111' },
          { identifier: '01011111111', password: 'password123', name: 'علي حسن', phone: '01011111111' },
          { identifier: 'operator1', password: 'password123', name: 'خالد إبراهيم', phone: '01022222222' },
        ],
        'manager': [
          { identifier: 'manager@example.com', password: 'password123', name: 'أحمد السيد', phone: '01099999999' },
          { identifier: 'admin@example.com', password: 'password123', name: 'محمد علي', phone: '01000000000' },
          { identifier: 'manager1', password: 'password123', name: 'علي المدير', phone: '01088888888' },
        ],
      };

      // Normalize identifier (remove spaces, handle phone formats)
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const cleanPhone = normalizedIdentifier.replace(/\s/g, '');

      // Check demo credentials for the selected role
      const roleCredentials = demoCredentials[role] || demoCredentials['operator'];
      const matchedCredential = roleCredentials.find(
        (cred) =>
          cred.identifier.toLowerCase() === normalizedIdentifier ||
          cred.identifier.toLowerCase() === cleanPhone ||
          cred.phone === cleanPhone
      );

      if (matchedCredential && matchedCredential.password === password) {
        const mockUser = {
          id: `${role}-${Date.now()}`,
          name: matchedCredential.name,
          email: matchedCredential.identifier.includes('@') ? matchedCredential.identifier : `${matchedCredential.identifier}@example.com`,
          phone: matchedCredential.phone,
          role: role,
          avatar: null,
          team: team || null,
          identifier: matchedCredential.identifier,
        };
        
        // Store token and user data in localStorage
        localStorage.setItem('token', `demo-token-${role}-${Date.now()}`);
        localStorage.setItem('hvar_user_role', role);
        if (team) {
          localStorage.setItem('hvar_team', team);
        }
        localStorage.setItem('hvar_user_data', JSON.stringify(mockUser));
        
        // Set user
        setUser(mockUser);
        
        return { success: true };
      }
      
      // In a real app, you would call your API
      // const response = await api.auth.login({ identifier, password, role });
      // localStorage.setItem('token', response.data.token);
      // localStorage.setItem('hvar_user_role', response.data.user.role);
      // setUser(response.data.user);
      // return { success: true };
      
      return {
        success: false,
        error: 'بيانات الاعتماد غير صالحة. يرجى التحقق من اسم المستخدم وكلمة المرور.'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'فشل تسجيل الدخول'
      };
    }
  };
  
  /**
   * Logout user
   */
  const logout = () => {
    // Remove all auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('hvar_team');
    localStorage.removeItem('hvar_user_data');
    localStorage.removeItem('hvar_user_role');
    
    // Clear user state
    setUser(null);
  };
  
  // Context value
  const value = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    loading,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook for using the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 