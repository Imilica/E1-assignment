import type { Locator, Page } from '@playwright/test';

export class TopMenu {
  readonly loginLink: Locator;
  readonly adminLink: Locator;
  readonly dashboardLink: Locator;
  readonly testCasesLink: Locator;
  readonly userLabel: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.loginLink = page.getByTestId('nav-login');
    this.adminLink = page.getByTestId('nav-admin');
    this.dashboardLink = page.getByTestId('nav-dashboard');
    this.testCasesLink = page.getByTestId('nav-test-cases');
    this.userLabel = page.getByTestId('nav-user');
    this.logoutButton = page.getByTestId('nav-logout');
  }

  async openLogin(): Promise<void> {
    await this.loginLink.click();
  }

  async openAdminLogin(): Promise<void> {
    await this.adminLink.click();
  }
}
