describe('Listings Page', () => {
  beforeEach(() => {
    // Visit the listings page before each test
    cy.visit('/listings');
    
    // Wait for page to load
    cy.get('h1').should('contain', 'Property Listings');
  });
  
  it('should display listings when the page loads', () => {
    // Check if listings are displayed
    cy.get('[data-testid="listing-card"]').should('exist');
    
    // Check that at least one listing has content
    cy.get('[data-testid="listing-card"]')
      .first()
      .within(() => {
        cy.get('h3').should('exist');
        cy.get('span').contains('bed').should('exist');
      });
  });
  
  it('should filter listings when search filters are applied', () => {
    // Click the filter button
    cy.contains('button', 'Show Filters').click();
    
    // Select property type
    cy.get('select[name="type"]').select('apartment');
    
    // Set min price
    cy.get('input[name="minPrice"]').type('100000');
    
    // Apply filters
    cy.contains('Apply Filters').click();
    
    // Verify URL includes query parameters
    cy.url().should('include', 'type=apartment');
    cy.url().should('include', 'minPrice=100000');
    
    // Check that listings are updated
    cy.get('[data-testid="listing-card"]').should('exist');
  });
  
  it('should navigate to listing detail page when clicking on a listing', () => {
    // Click on the first listing
    cy.get('[data-testid="listing-card"]')
      .first()
      .click();
    
    // Verify we've navigated to a detail page
    cy.url().should('include', '/listings/');
    
    // Verify listing detail content is displayed
    cy.get('h1').should('exist');
    cy.contains('Price').should('exist');
  });
  
  it('should handle pagination correctly', () => {
    // Verify pagination exists
    cy.get('[data-testid="pagination"]').should('exist');
    
    // Click next page if it exists
    cy.get('[data-testid="pagination"]').then(($pagination) => {
      if ($pagination.find('[aria-label="Next page"]').length) {
        cy.get('[aria-label="Next page"]').click();
        
        // Verify URL includes page parameter
        cy.url().should('include', 'page=2');
        
        // Verify listings are updated
        cy.get('[data-testid="listing-card"]').should('exist');
      }
    });
  });
});
