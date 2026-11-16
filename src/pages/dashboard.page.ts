import type { Locator, Page } from '@playwright/test';
import { TopMenu } from './components/top-menu.component';

export class DashboardPage {
  static readonly path = '/dashboard';

  readonly topMenu: TopMenu;
  readonly title: Locator;
  readonly welcome: Locator;

  constructor(private readonly page: Page) {
    this.topMenu = new TopMenu(page);
    this.title = page.getByTestId('dashboard-title');
    this.welcome = page.getByTestId('welcome');
  }

  async goto(): Promise<void> {
    await this.page.goto(DashboardPage.path);
    await this.title.waitFor();
  }
}
