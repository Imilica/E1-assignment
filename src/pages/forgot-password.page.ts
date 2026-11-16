import type { Locator, Page } from '@playwright/test';

export class ForgotPasswordPage {
  static readonly path = '/forgot-password';

  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly backToLoginLink: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByTestId('email');
    this.submitButton = page.getByTestId('forgot-submit');
    this.backToLoginLink = page.getByTestId('back-to-login');
  }

  async goto(): Promise<void> {
    await this.page.goto(ForgotPasswordPage.path);
    await this.submitButton.waitFor();
  }
}
