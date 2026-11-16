import type { Locator, Page } from '@playwright/test';
import { TopMenu } from './components/top-menu.component';

export class TestCaseListPage {
  static readonly path = '/test-cases';

  readonly topMenu: TopMenu;
  readonly table: Locator;
  readonly emptyMessage: Locator;
  readonly rows: Locator;
  readonly newTestCaseLink: Locator;

  constructor(private readonly page: Page) {
    this.topMenu = new TopMenu(page);
    this.table = page.getByTestId('test-case-table');
    this.emptyMessage = page.getByTestId('empty-list');
    this.rows = page.getByTestId('test-case-row');
    this.newTestCaseLink = page.getByTestId('new-test-case-link');
  }

  async goto(): Promise<void> {
    await this.page.goto(TestCaseListPage.path);
    await this.newTestCaseLink.waitFor();
  }

  /** Rows whose title contains `title` (titles carry a unique suffix). */
  rowByTitle(title: string): Locator {
    return this.rows.filter({ has: this.page.getByTestId('tc-title').filter({ hasText: title }) });
  }

  titleOf(row: Locator): Locator {
    return row.getByTestId('tc-title');
  }

  expectedOf(row: Locator): Locator {
    return row.getByTestId('tc-expected');
  }

  stepsOf(row: Locator): Locator {
    return row.getByTestId('tc-step');
  }

  automatedOf(row: Locator): Locator {
    return row.getByTestId('tc-automated');
  }

  async openNewTestCase(): Promise<void> {
    await this.newTestCaseLink.click();
  }

  /** Deletes the row with this title if present (fixture cleanup; titles are unique). */
  async deleteByTitle(title: string): Promise<void> {
    const target = this.rowByTitle(title);
    if ((await target.count()) === 0) return;
    await target.first().getByTestId('tc-delete').click();
    await target.first().waitFor({ state: 'detached' });
  }
}
