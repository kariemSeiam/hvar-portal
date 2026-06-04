/**
 * ERP Authentication Handler
 * 
 * Automatically handles login and session management for ERP API access
 * Similar to the Python ERPAutoAccess class
 */

class ERPAuth {
  constructor(baseUrl, username, password) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.username = username;
    this.password = password;
    this.csrfToken = null;
    this.sessionCookie = null;
    this.lastLoginTime = 0;
    this.sessionTimeout = 3600000; // 1 hour in milliseconds
  }

  /**
   * Check if session is expired
   */
  isSessionExpired() {
    if (!this.lastLoginTime) {
      return true;
    }
    return (Date.now() - this.lastLoginTime) >= this.sessionTimeout;
  }

  /**
   * Extract CSRF token from HTML page
   */
  extractCSRFToken(html) {
    // Look for: <input type="hidden" name="_token" value="...">
    const tokenMatch = html.match(/name="_token"\s+value="([^"]+)"/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
    
    // Alternative: Look for meta tag
    const metaMatch = html.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);
    if (metaMatch) {
      return metaMatch[1];
    }
    
    return null;
  }

  /**
   * Login to ERP system
   */
  async login() {
    try {
      const loginUrl = `${this.baseUrl}/login`;
      
      // Step 1: Get login page to extract CSRF token
      const loginPageResponse = await fetch(loginUrl, {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!loginPageResponse.ok) {
        throw new Error(`Failed to load login page: ${loginPageResponse.status}`);
      }

      const loginPageHtml = await loginPageResponse.text();
      const csrfToken = this.extractCSRFToken(loginPageHtml);

      if (!csrfToken) {
        throw new Error('Could not extract CSRF token from login page');
      }

      // Step 2: Perform login
      const formData = new URLSearchParams();
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('_token', csrfToken);

      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData.toString(),
        redirect: 'manual' // Don't follow redirects automatically
      });

      // Check if login was successful (200 or 302 redirect)
      // Cookies are automatically handled by browser with credentials: 'include'
      if (loginResponse.status === 200 || loginResponse.status === 302) {
        this.csrfToken = csrfToken;
        // In browser, cookies are automatically managed, so we just store the token
        // For fetch requests, we'll use credentials: 'include' to send cookies automatically
        this.lastLoginTime = Date.now();
        
        console.log('✅ ERP login successful');
        return true;
      }

      // If redirected to login page again, login failed
      if (loginResponse.status === 302) {
        const location = loginResponse.headers.get('Location');
        if (location && location.includes('login')) {
          throw new Error('Login failed: Invalid credentials or session issue');
        }
      }

      throw new Error(`Login failed. Status: ${loginResponse.status}`);
    } catch (error) {
      console.error('❌ ERP login error:', error);
      throw error;
    }
  }

  /**
   * Get CSRF token for API requests
   * Note: Cookies are automatically sent by browser with credentials: 'include'
   */
  async getAuthHeaders() {
    // Auto-login if expired
    if (this.isSessionExpired()) {
      await this.login();
    }

    return {
      'x-csrf-token': this.csrfToken
      // Cookies are automatically included with credentials: 'include'
    };
  }

  /**
   * Fetch with automatic authentication retry
   */
  async fetchWithAuth(url, options = {}) {
    // Get auth headers
    const authHeaders = await this.getAuthHeaders();

    // Merge headers
    const headers = {
      ...options.headers,
      ...authHeaders,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // First attempt
    let response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers
    });

    // If unauthorized, try login and retry once
    if (response.status === 401 || response.status === 403) {
      console.log('🔄 Session expired, re-authenticating...');
      this.lastLoginTime = 0; // Force re-login
      await this.login();
      
      // Retry with new auth
      const newAuthHeaders = await this.getAuthHeaders();
      headers['x-csrf-token'] = newAuthHeaders['x-csrf-token'];
      headers['cookie'] = newAuthHeaders['cookie'];
      
      response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers
      });
    }

    return response;
  }

  /**
   * Get draft orders with automatic authentication
   * 
   * @param {URLSearchParams|Object} params - Query parameters (URLSearchParams or plain object)
   */
  async getDraftOrders(params = {}) {
    const url = new URL(`${this.baseUrl}/sells/draft-dt`);
    
    // Handle URLSearchParams or plain object
    if (params instanceof URLSearchParams) {
      // If it's already a URLSearchParams, append all entries
      params.forEach((value, key) => {
        url.searchParams.append(key, value);
      });
    } else {
      // If it's a plain object, add all entries
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await this.fetchWithAuth(url.toString(), {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch draft orders: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }
}

export default ERPAuth;
