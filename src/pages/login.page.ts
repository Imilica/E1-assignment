import type { Locator, Page } from '@playwright/test';
import { TopMenu } from './components/top-menu.component';

export class LoginPage {
  static readonly path = '/login';

  readonly topMenu: TopMenu;
  readonly emailInput: Locator;
  readonly emailError: Locator;
  readonly passwordInput: Locator;
  readonly passwordError: Locator;
  readonly rememberMeToggle: Locator;
  readonly rememberMeSlider: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  private loginRequests = 0;

  constructor(private readonly page: Page) {
    this.topMenu = new TopMenu(page);
    this.emailInput = page.getByTestId('email');
    this.emailError = page.getByTestId('email-error');
    this.passwordInput = page.getByTestId('password');
    this.passwordError = page.getByTestId('password-error');
    this.rememberMeToggle = page.getByTestId('remember-me');
    this.rememberMeSlider = page.getByTestId('remember-me-slider');
    this.submitButton = page.getByTestId('login-submit');
    this.errorMessage = page.getByTestId('login-error');
    this.forgotPasswordLink = page.getByTestId('forgot-password-link');

    // Counts calls to the login API so specs can prove none was made.
    page.on('request', (request) => {
      if (request.method() === 'POST' && /\/api\/(admin\/)?login$/.test(request.url())) {
        this.loginRequests += 1;
      }
    });
  }

  get loginRequestCount(): number {
    return this.loginRequests;
  }

  async goto(): Promise<void> {
    await this.page.goto(LoginPage.path);
    await this.submitButton.waitFor();
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(email: string, password: string, rememberMe = false): Promise<void> {
    await this.fillCredentials(email, password);
    if (rememberMe) await this.rememberMeSlider.click();
    await this.submit();
  }
}
