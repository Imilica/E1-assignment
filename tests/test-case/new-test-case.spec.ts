import { test, expect } from '@fixtures';
import type { TestCaseData } from '@data/factories/test-case.factory';
import { stepsFactory } from '@data/factories/test-case.factory';

function covers(requirement: string): void {
  test.info().annotations.push({ type: 'requirement', description: requirement });
}

const LIST_URL = /\/test-cases$/;
const NEW_URL = /\/test-cases\/new$/;

test.describe('New Test Case', () => {
  test.beforeEach(async ({ newTestCasePage }) => {
    await newTestCasePage.goto();
  });

  test('TC-NTC-01: create a test case with all fields and see it in the list @smoke', async ({
    newTestCasePage,
    testCaseListPage,
    buildTestCase,
    page,
  }) => {
    covers('New Test Case: create, Submit saves in the list');
    const data = buildTestCase({ automated: true });
    await newTestCasePage.createTestCase(data);

    await expect(page).toHaveURL(LIST_URL);
    const row = testCaseListPage.rowByTitle(data.title);
    await expect(row).toHaveCount(1);
    await expect(testCaseListPage.titleOf(row)).toContainText(data.title);
    await expect(testCaseListPage.titleOf(row)).toContainText(data.description);
    await expect(testCaseListPage.expectedOf(row)).toHaveText(data.expectedResult);
    await expect(testCaseListPage.stepsOf(row)).toHaveText(data.steps);
    await expect(testCaseListPage.automatedOf(row)).toHaveText('Yes');
  });

  test('TC-NTC-02: create a test case with required fields only @smoke', async ({
    newTestCasePage,
    testCaseListPage,
    buildTestCase,
    page,
  }) => {
    covers('New Test Case: Description is optional');
    const data = buildTestCase({ description: '', steps: stepsFactory(1) });
    await newTestCasePage.createTestCase(data);

    await expect(page).toHaveURL(LIST_URL);
    const row = testCaseListPage.rowByTitle(data.title);
    await expect(row).toHaveCount(1);
    await expect(testCaseListPage.expectedOf(row)).toHaveText(data.expectedResult);
    await expect(testCaseListPage.stepsOf(row)).toHaveText(data.steps);
  });

  test.describe('TC-NTC-03: required fields empty show errors and nothing is saved', () => {
    const TITLE_ERROR = 'Title is required.';
    const EXPECTED_ERROR = 'Expected Result is required.';
    const STEPS_ERROR = 'At least one test step is required.';
    // An empty expected error means the field must show no error.
    const cases: readonly {
      name: string;
      override: Partial<TestCaseData>;
      titleError: string;
      expectedError: string;
      stepsError: string;
    }[] = [
      {
        name: 'empty Title',
        override: { title: '' },
        titleError: TITLE_ERROR,
        expectedError: '',
        stepsError: '',
      },
      {
        name: 'empty Expected Result',
        override: { expectedResult: '' },
        titleError: '',
        expectedError: EXPECTED_ERROR,
        stepsError: '',
      },
      {
        name: 'empty Title and Expected Result',
        override: { title: '', expectedResult: '' },
        titleError: TITLE_ERROR,
        expectedError: EXPECTED_ERROR,
        stepsError: '',
      },
      {
        name: 'all required fields empty',
        override: { title: '', expectedResult: '', steps: [''] },
        titleError: TITLE_ERROR,
        expectedError: EXPECTED_ERROR,
        stepsError: STEPS_ERROR,
      },
    ];

    for (const c of cases) {
      test(c.name, async ({ newTestCasePage, buildTestCase, page }) => {
        covers('New Test Case: Title, Expected Result and Test Steps are mandatory');
        await newTestCasePage.createTestCase(buildTestCase(c.override));

        await expect(newTestCasePage.titleError).toHaveText(c.titleError);
        await expect(newTestCasePage.expectedResultError).toHaveText(c.expectedError);
        await expect(newTestCasePage.stepsError).toHaveText(c.stepsError);
        await expect(page).toHaveURL(NEW_URL);
        expect(newTestCasePage.saveRequestCount, 'nothing may be saved').toBe(0);
      });
    }
  });

  test('TC-NTC-04: at least one test step is required', async ({
    newTestCasePage,
    buildTestCase,
    page,
  }) => {
    covers('New Test Case: Test Steps required (at least one)');
    await newTestCasePage.createTestCase(buildTestCase({ steps: [''] }));

    await expect(newTestCasePage.stepsError).toHaveText('At least one test step is required.');
    await expect(newTestCasePage.titleError).toBeEmpty();
    await expect(newTestCasePage.expectedResultError).toBeEmpty();
    await expect(page).toHaveURL(NEW_URL);
    expect(newTestCasePage.saveRequestCount, 'nothing may be saved').toBe(0);
  });

  test('TC-NTC-05: multiple steps keep their order @smoke', async ({
    newTestCasePage,
    testCaseListPage,
    buildTestCase,
    page,
  }) => {
    covers('New Test Case: Add Test Step; steps are ordered and preserved');
    const data = buildTestCase({ steps: stepsFactory(5) });
    await newTestCasePage.fillForm(data);

    await expect(newTestCasePage.stepInputs).toHaveCount(5);
    for (const [index, step] of data.steps.entries()) {
      await expect(newTestCasePage.stepInputs.nth(index)).toHaveValue(step);
    }

    await newTestCasePage.submit();
    await expect(page).toHaveURL(LIST_URL);
    const row = testCaseListPage.rowByTitle(data.title);
    await expect(testCaseListPage.stepsOf(row)).toHaveText(data.steps);
  });

  test.describe('TC-NTC-06: Automated toggle', () => {
    test('is off by default and saves as not automated', async ({
      newTestCasePage,
      testCaseListPage,
      buildTestCase,
      page,
    }) => {
      covers('New Test Case: Automated toggle (default off)');
      await expect(
        newTestCasePage.automatedToggle,
        'Automated must be off by default',
      ).not.toBeChecked();
      const data = buildTestCase({ automated: false });
      await newTestCasePage.createTestCase(data);

      await expect(page).toHaveURL(LIST_URL);
      await expect(
        testCaseListPage.automatedOf(testCaseListPage.rowByTitle(data.title)),
      ).toHaveText('No');
    });

    test('saves as automated when turned on', async ({
      newTestCasePage,
      testCaseListPage,
      buildTestCase,
      page,
    }) => {
      covers('New Test Case: Automated toggle');
      const data = buildTestCase({ automated: true });
      await newTestCasePage.fillForm(data);
      await expect(newTestCasePage.automatedToggle).toBeChecked();
      await newTestCasePage.submit();

      await expect(page).toHaveURL(LIST_URL);
      await expect(
        testCaseListPage.automatedOf(testCaseListPage.rowByTitle(data.title)),
      ).toHaveText('Yes');
    });
  });

  test.describe('TC-NTC-07: Enter key', () => {
    test('does not submit an invalid form from the Title field', async ({
      newTestCasePage,
      buildTestCase,
      page,
    }) => {
      covers('New Test Case: Enter must not accidentally submit an invalid form');
      await newTestCasePage.fillForm({ title: buildTestCase().title });
      await newTestCasePage.titleInput.press('Enter');

      await expect(newTestCasePage.expectedResultError).toHaveText('Expected Result is required.');
      await expect(page).toHaveURL(NEW_URL);
      await expect(newTestCasePage.stepInputs).toHaveCount(1);
      expect(newTestCasePage.saveRequestCount, 'nothing may be saved').toBe(0);
    });

    test('does not submit an invalid form from a step field', async ({
      newTestCasePage,
      buildTestCase,
      page,
    }) => {
      covers('New Test Case: Enter must not accidentally submit an invalid form');
      const data = buildTestCase();
      await newTestCasePage.fillForm({ title: data.title, steps: data.steps.slice(0, 1) });
      await newTestCasePage.stepInputs.first().press('Enter');

      await expect(newTestCasePage.expectedResultError).toHaveText('Expected Result is required.');
      await expect(page).toHaveURL(NEW_URL);
      await expect(newTestCasePage.stepInputs).toHaveCount(1);
      expect(newTestCasePage.saveRequestCount, 'nothing may be saved').toBe(0);
    });

    test('submits a fully valid form (observed behaviour)', async ({
      newTestCasePage,
      testCaseListPage,
      buildTestCase,
      page,
    }) => {
      covers('New Test Case: Enter submits only when the form is valid');
      const data = buildTestCase();
      await newTestCasePage.fillForm(data);
      await newTestCasePage.titleInput.press('Enter');

      await expect(page).toHaveURL(LIST_URL);
      await expect(testCaseListPage.rowByTitle(data.title)).toHaveCount(1);
    });
  });

  test('TC-NTC-08: back arrow returns to the list without saving', async ({
    newTestCasePage,
    testCaseListPage,
    buildTestCase,
    page,
  }) => {
    covers('New Test Case: Back arrow returns to the Test Case List');
    const data = buildTestCase();
    await newTestCasePage.fillForm({ title: data.title, expectedResult: data.expectedResult });
    await newTestCasePage.goBack();

    await expect(page).toHaveURL(LIST_URL);
    await expect(testCaseListPage.newTestCaseLink).toBeVisible();
    await expect(testCaseListPage.rowByTitle(data.title)).toHaveCount(0);
    expect(newTestCasePage.saveRequestCount, 'nothing may be saved').toBe(0);
  });

  test('TC-NTC-09: placeholders are correct', async ({ newTestCasePage }) => {
    covers('New Test Case: placeholders "Title", "Description", "Expected Result", "Test step"');
    await expect.soft(newTestCasePage.titleInput).toHaveAttribute('placeholder', 'Title');
    await expect
      .soft(newTestCasePage.descriptionInput)
      .toHaveAttribute('placeholder', 'Description');
    await expect
      .soft(newTestCasePage.expectedResultInput)
      .toHaveAttribute('placeholder', 'Expected Result');
    await expect
      .soft(newTestCasePage.stepInputs.first())
      .toHaveAttribute('placeholder', 'Test step');
  });

  test('TC-NTC-10: all created test cases are listed @smoke', async ({
    newTestCasePage,
    testCaseListPage,
    buildTestCase,
    page,
  }) => {
    covers('New Test Case: all test cases are listed');
    const created = [buildTestCase(), buildTestCase(), buildTestCase()];
    for (const data of created) {
      await newTestCasePage.goto();
      await newTestCasePage.createTestCase(data);
      await expect(page).toHaveURL(LIST_URL);
    }

    // Each title appears exactly once. A global row count is not asserted: tests run in
    // parallel against one shared list, so the total is not deterministic.
    for (const data of created) {
      await expect(testCaseListPage.rowByTitle(data.title)).toHaveCount(1);
    }
  });
});
