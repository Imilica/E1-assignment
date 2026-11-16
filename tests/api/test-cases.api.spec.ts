import { test, expect } from '@fixtures';
import { stepsFactory } from '@data/factories/test-case.factory';

interface TestCaseResponse {
  id: number;
  title: string;
  description: string;
  expectedResult: string;
  steps: string[];
  automated: boolean;
}

function covers(requirement: string): void {
  test.info().annotations.push({ type: 'requirement', description: requirement });
}

test.describe('API: test cases', () => {
  test('API-TC-01: all endpoints return 401 when logged out', async ({ api, makeTestCase }) => {
    covers('New Test Case: only logged-in users can use test cases');
    expect((await api.listTestCases()).status()).toBe(401);
    expect((await api.createTestCase(makeTestCase())).status()).toBe(401);
    expect((await api.deleteTestCase(1)).status()).toBe(401);
  });

  test('API-TC-02: a valid test case is created and listed', async ({ userApi, makeTestCase }) => {
    covers('New Test Case: Submit saves in the list; steps ordered and preserved');
    const data = makeTestCase({ automated: true, steps: stepsFactory(4) });
    const created = await userApi.createTestCase(data);

    expect(created.status()).toBe(201);
    const body = (await created.json()) as TestCaseResponse;
    expect(body).toMatchObject({
      title: data.title,
      description: data.description,
      expectedResult: data.expectedResult,
      steps: data.steps,
      automated: true,
    });
    expect(body.id).toEqual(expect.any(Number));

    const list = (await (await userApi.listTestCases()).json()) as TestCaseResponse[];
    expect(list.filter((c) => c.title === data.title)).toEqual([body]);
  });

  test.describe('API-TC-03: invalid payloads are rejected with 400 and not saved', () => {
    const TITLE = 'Title is required.';
    const EXPECTED = 'Expected Result is required.';
    const STEPS = 'At least one test step is required.';
    const cases = [
      { name: 'missing title', override: { title: undefined }, errors: { title: TITLE } },
      { name: 'blank title', override: { title: '   ' }, errors: { title: TITLE } },
      {
        name: 'missing expected result',
        override: { expectedResult: undefined },
        errors: { expectedResult: EXPECTED },
      },
      {
        name: 'blank expected result',
        override: { expectedResult: ' ' },
        errors: { expectedResult: EXPECTED },
      },
      { name: 'missing steps', override: { steps: undefined }, errors: { steps: STEPS } },
      { name: 'empty steps list', override: { steps: [] }, errors: { steps: STEPS } },
      { name: 'only blank steps', override: { steps: ['', '  '] }, errors: { steps: STEPS } },
      { name: 'steps is not a list', override: { steps: 'one step' }, errors: { steps: STEPS } },
      {
        name: 'everything missing',
        override: { title: undefined, expectedResult: undefined, steps: undefined },
        errors: { title: TITLE, expectedResult: EXPECTED, steps: STEPS },
      },
    ];

    for (const c of cases) {
      test(c.name, async ({ userApi, makeTestCase }) => {
        covers('New Test Case: Title, Expected Result and Test Steps are mandatory');
        const marker = makeTestCase();
        const response = await userApi.createTestCaseRaw({ ...marker, ...c.override });

        expect(response.status()).toBe(400);
        expect(await response.json()).toEqual({ errors: c.errors });
        const list = (await (await userApi.listTestCases()).json()) as TestCaseResponse[];
        expect(list.filter((item) => item.title === marker.title)).toHaveLength(0);
      });
    }
  });

  test('API-TC-04: optional fields default and blank steps are dropped', async ({
    userApi,
    makeTestCase,
  }) => {
    covers('New Test Case: Description optional; Automated defaults to off');
    const { title, expectedResult } = makeTestCase();
    const response = await userApi.createTestCaseRaw({
      title: `  ${title}  `,
      expectedResult,
      steps: ['  first  ', '', 'second'],
    });

    expect(response.status()).toBe(201);
    expect(await response.json()).toMatchObject({
      title,
      description: '',
      expectedResult,
      steps: ['first', 'second'],
      automated: false,
    });
  });

  test.describe('API-TC-05: delete', () => {
    test('removes the test case from the list', async ({ userApi, makeTestCase }) => {
      covers('New Test Case: list reflects saved test cases');
      const data = makeTestCase();
      const { id } = (await (await userApi.createTestCase(data)).json()) as TestCaseResponse;

      const deleted = await userApi.deleteTestCase(id);
      expect(deleted.status()).toBe(200);
      expect(await deleted.json()).toEqual({ ok: true });

      const list = (await (await userApi.listTestCases()).json()) as TestCaseResponse[];
      expect(list.filter((c) => c.id === id)).toHaveLength(0);
    });

    test('deleting an unknown id still returns 200 (observed behaviour)', async ({ userApi }) => {
      covers('New Test Case: list reflects saved test cases');
      const response = await userApi.deleteTestCase(999_999_999);

      expect(response.status()).toBe(200);
    });
  });
});
