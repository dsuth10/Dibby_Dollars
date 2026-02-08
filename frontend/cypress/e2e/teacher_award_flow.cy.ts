/**
 * E2E: Teacher award flow
 * Prerequisites: Backend and frontend running (npm run dev in backend + frontend).
 * Seed data: teacher (teacher/teacher123), student1 (student1/1234).
 *
 * Flow: Login as teacher -> Teacher dashboard -> Select student -> Award 1 DB$ -> Verify success.
 */
describe('Teacher award flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('logs in as teacher, awards 1 DB$ to a student, and shows success', () => {
    cy.get('input[autoComplete="username"]').type('teacher');
    cy.get('input[autoComplete="current-password"]').type('teacher123');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/teacher', { timeout: 10000 });
    cy.contains('Award', { timeout: 10000 }).should('be.visible');

    // Student autocomplete: focus and type to open options
    cy.get('input').filter('[type="text"]').first().click().type('student');
    cy.get('[role="option"]').first().click();

    // Click any focus behavior button (e.g. Helping Others, On Task)
    cy.get('button').contains('Helping Others').click();

    cy.contains(/Awarded 1 DB\$|1 DB\$/, { timeout: 5000 }).should('be.visible');
  });

  it('redirects to login when not authenticated', () => {
    cy.visit('/teacher');
    cy.url().should('include', '/login');
  });
});
