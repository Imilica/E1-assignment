import { faker } from '@faker-js/faker';

export interface TestCaseData {
  title: string;
  description: string;
  expectedResult: string;
  steps: string[];
  automated: boolean;
}

/** Distinct, non-repeating steps so ordering assertions are meaningful. */
export function stepsFactory(count: number): string[] {
  const steps: string[] = [];
  for (let i = 0; i < count; i += 1) {
    steps.push(`Step ${i + 1}: ${faker.lorem.words(3)} ${faker.string.alphanumeric(4)}`);
  }
  return steps;
}

/**
 * Valid test case. `suffix` keeps the title unique within the shared list
 * (derive it with `shortSuffix` from the seed and test title).
 */
export function testCaseFactory(
  suffix: string,
  overrides: Partial<TestCaseData> = {},
): TestCaseData {
  return {
    title: `${faker.lorem.words(3)} [${suffix}]`,
    description: faker.lorem.sentence(),
    expectedResult: faker.lorem.sentence(),
    steps: stepsFactory(3),
    automated: false,
    ...overrides,
  };
}
