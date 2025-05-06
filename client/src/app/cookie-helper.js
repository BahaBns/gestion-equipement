// public/cookie-helper.js
(function() {
  function ensureCookies() {
    // Check if token exists in localStorage but not as cookie
    const token = localStorage.getItem('token');
    
    // Parse all cookies into an object for easy access
    const cookies = document.cookie.split(';')
      .map(cookie => cookie.trim())
      .reduce((acc, cookie) => {
        if (cookie) {
          const [key, value] = cookie.split('=');
          acc[key] = value;
        }
        return acc;
      }, {});
    
    const hasCookie = 'token' in cookies;
    
    console.log("Cookie sync check - localStorage token:", !!token);
    console.log("Cookie sync check - cookie exists:", hasCookie);
    
    // If token in localStorage but not in cookie, set cookie
    if (token && !hasCookie) {
      const expires = new Date();
      expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      // Set the cookie with proper attributes
      document.cookie = `token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      
      console.log("Cookie recreated from localStorage");
      
      // Force refresh if on a protected page and cookie was missing
      // This ensures the middleware gets the new cookie
      const isProtectedPath = 
        window.location.pathname.startsWith('/dashboard') ||
        window.location.pathname.startsWith('/categories') ||
        window.location.pathname.startsWith('/actif') ||
        window.location.pathname.startsWith('/employee') ||
        window.location.pathname.startsWith('/parametres') ||
        window.location.pathname.startsWith('/administration');
        
      if (isProtectedPath && !window.location.search.includes('bypassAuth=true')) {
        console.log("Protected page detected with missing cookie - refreshing with bypass flag");
        window.location.href = window.location.pathname + '?bypassAuth=true';
      }
    }
    
    // If on a non-login page with no token, redirect to login
    const isLoginPage = window.location.pathname === '/login';
    const hasToken = token || hasCookie;
    
    if (!isLoginPage && !hasToken) {
      console.log("No token found on protected page - redirecting to login");
      window.location.href = '/login';
    }
  }
  
  // Run immediately
  ensureCookies();
  
  // Then check every 3 seconds
  setInterval(ensureCookies, 3000);
  
  // Also run on page visibility change (when user returns to the tab)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      ensureCookies();
    }
  });
  
  // Intercept navigation and ensure cookies before allowing it
  window.addEventListener('click', function(e) {
    // Only handle link clicks
    const link = e.target.closest('a');
    if (!link) return;
    
    // Skip external links or non-http links
    if (link.host !== window.location.host || 
        !link.href.startsWith('http')) return;
    
    // Check for token in either localStorage or cookie
    const token = localStorage.getItem('token');
    const hasCookie = document.cookie.split(';')
      .some(c => c.trim().startsWith('token='));
      
    // If we have token in localStorage but not in cookie, fix it before navigation
    if (token && !hasCookie) {
      console.log("Setting cookie before navigation");
      const expires = new Date();
      expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
      document.cookie = `token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }
  }, true);
})();
