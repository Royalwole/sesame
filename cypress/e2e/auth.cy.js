describe('Authentication Flow', () => {
  // Define test credentials
  const testUser = {
    email: Cypress.env('TEST_USER_EMAIL') || 'test@example.com',
    password: Cypress.env('TEST_USER_PASSWORD') || 'TestPassword123',
  };
  
  beforeEach(() => {
    // Clear session before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Mock Clerk auth where needed
    cy.intercept(
      { method: 'GET', url: '**/.well-known/openid-configuration**' },
      { fixture: 'clerk/oidc-configuration.json' }
    );
  });
  
  it('should show sign in page when accessing dashboard while logged out', () => {
    // Try to access dashboard
    cy.visit('/dashboard');
    
    // Should be redirected to sign-in
    cy.url().should('include', '/auth/sign-in');
    
    // Should see sign-in form
    cy.contains('Sign In').should('be.visible');
  });
  
  it('should redirect authenticated user to dashboard', () => {
    // Mock successful authentication
    cy.window().then((win) => {
      win.localStorage.setItem('td_user_cache', JSON.stringify({
        _id: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        updatedAt: new Date().toISOString()
      }));
    });
    
    // Mock auth check
    cy.intercept('GET', '/api/users/me', {
      statusCode: 200,
      body: {
        success: true,
        user: {
          _id: 'test-user-id',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          role: 'user'
        }
      }
    }).as('authCheck');
    
    // Visit site
    cy.visit('/');
    
    // Click on dashboard link 
    cy.contains('a', 'Dashboard').click();
    
    // Should be able to access dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome').should('be.visible');
  });
  
  it('should show appropriate error messages for invalid login', () => {
    // Visit sign-in page
    cy.visit('/auth/sign-in');
    
    // Mock failed login attempt
    cy.intercept('POST', '**/clerk/sign-in**', {
      statusCode: 400,
      body: {
        error: 'Invalid email or password'
      }
    }).as('loginAttempt');
    
    // Attempt to login with invalid credentials
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.contains('button', 'Sign In').click();
    
    // Should see error message
    cy.contains('Invalid email or password').should('be.visible');
  });
  
  it('should allow user to sign out', () => {
    // Mock successful authentication
    cy.window().then((win) => {
      win.localStorage.setItem('td_user_cache', JSON.stringify({
        _id: 'test-user-id',
        firstName: 'Test',
        role: 'user',
        updatedAt: new Date().toISOString()
      }));
    });
    
    // Mock auth check
    cy.intercept('GET', '/api/users/me', {
      statusCode: 200,
      body: {
        success: true,
        user: {
          _id: 'test-user-id',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          role: 'user'
        }
      }
    }).as('authCheck');
    
    // Mock sign out
    cy.intercept('POST', '**/clerk/sign-out**', {
      statusCode: 200,
      body: { success: true }
    }).as('signOut');
    
    // Visit dashboard
    cy.visit('/dashboard');
    
    // Click user menu
    cy.get('[data-testid="user-menu"]').click();
    
    // Click sign out
    cy.contains('Sign Out').click();
    
    // Should be redirected to home
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    
    // Should see sign in link
    cy.contains('Sign In').should('be.visible');
  });
});
