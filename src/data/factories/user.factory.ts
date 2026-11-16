import { faker } from '@faker-js/faker';

export interface UserCredentials {
  email: string;
  password: string;
}

/** Well-formed credentials that do not exist in the app. */
export function userFactory(overrides: Partial<UserCredentials> = {}): UserCredentials {
  return {
    email: faker.internet.email({ provider: 'example.com' }).toLowerCase(),
    password: faker.internet.password({ length: 12, prefix: 'Aa1!' }),
    ...overrides,
  };
}
