import type { Locator, Page } from '@playwright/test';
import { TopMenu } from './components/top-menu.component';
import type { TestCaseData } from '@data/factories/test-case.factory';

export class NewTestCasePage {
  static readonly path = '/test-cases/new';

  readonly topMenu: TopMenu;
  readonly titleInput: Locator;
  readonly titleError: Locator;
  readonly descriptionInput: Locator;
  readonly expectedResultInput: Locator;
  readonly expectedResultError: Locator;
  readonly stepInputs: Locator;
  readonly stepsError: Locator;
  readonly addStepButton: Locator;
  readonly automatedToggle: Locator;
  readonly automatedSlider: Locator;
  readonly submitButton: Locator;
  readonly backButton: Locator;

  private saveRequests = 0;

  constructor(private readonly page: Page) {
    this.topMenu = new TopMenu(page);
    this.titleInput = page.getByTestId('title');
    this.titleError = page.getByTestId('title-error');
    this.descriptionInput = page.getByTestId('description');
    this.expectedResultInput = page.getByTestId('expected-result');
    this.expectedResultError = page.getByTestId('expected-result-error');
    this.stepInputs = page.getByTestId('step-input');
    this.stepsError = page.getByTestId('steps-error');
    this.addStepButton = page.getByTestId('add-step');
    this.automatedToggle = page.getByTestId('automated');
    this.automatedSlider = page.getByTestId('automated-slider');
    this.submitButton = page.getByTestId('submit');
    this.backButton = page.getByTestId('back-button');

    // Counts save calls so specs can prove an invalid form never reached the backend.
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/api/test-cases')) {
        this.saveRequests += 1;
      }
    });
  }

  get saveRequestCount(): number {
    return this.saveRequests;
  }

  async goto(): Promise<void> {
    await this.page.goto(NewTestCasePage.path);
    await this.submitButton.waitFor();
  }

  /** Fills the first (pre-existing) step, then adds a row per remaining step. */
  async fillSteps(steps: readonly string[]): Promise<void> {
    for (const [index, step] of steps.entries()) {
      if (index > 0) await this.addStepButton.click();
      await this.stepInputs.nth(index).fill(step);
    }
  }

  async fillForm(data: Partial<TestCaseData>): Promise<void> {
    if (data.title !== undefined) await this.titleInput.fill(data.title);
    if (data.description !== undefined) await this.descriptionInput.fill(data.description);
    if (data.expectedResult !== undefined) await this.expectedResultInput.fill(data.expectedResult);
    if (data.steps !== undefined) await this.fillSteps(data.steps);
    if (data.automated) await this.automatedSlider.click();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async createTestCase(data: TestCaseData): Promise<void> {
    await this.fillForm(data);
    await this.submit();
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
  }
}
