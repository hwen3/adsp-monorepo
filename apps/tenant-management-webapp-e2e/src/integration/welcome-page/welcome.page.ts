/// <reference types="cypress-xpath" />
class WelcomePage {
  signinDiv() {
    return cy.xpath('//a[contains(text(), "Sign In")]');
  }

  getStartedButton() {
    return cy.get('a:contains("Get Started")');
  }

  signoutDiv() {
    return cy.xpath('//a[contains(text(), "Sign Out")]');
  }

  userHasOneTenantMessage() {
    return cy.get('.message');
  }

  createTenantTitle() {
    return cy.get('h1');
  }

  tenantNameField() {
    return cy.get('#name');
  }

  createTenantButton() {
    return cy.get('button:contains("Create Tenant")');
  }

  newTenantCreationMessage() {
    return cy.get('p:contains("successfully created")');
  }

  tenantLoginButton() {
    return cy.get('button:contains("Tenant Login")');
  }
}

export default WelcomePage;
