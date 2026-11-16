import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { TestCaseData } from '@data/factories/test-case.factory';

/** Thin typed wrapper over the app's JSON API. No assertions: specs decide what to check. */
export class ApiClient {
  private readonly createdIds: number[] = [];

  constructor(private readonly request: APIRequestContext) {}

  login(email: string, password: string, remember?: boolean): Promise<APIResponse> {
    return this.request.post('/api/login', { data: { email, password, remember } });
  }

  adminLogin(email: string, password: string): Promise<APIResponse> {
    return this.request.post('/api/admin/login', { data: { email, password } });
  }

  /** Sends an arbitrary body, for invalid-payload scenarios. */
  loginRaw(data: Record<string, unknown>): Promise<APIResponse> {
    return this.request.post('/api/login', { data });
  }

  logout(): Promise<APIResponse> {
    return this.request.post('/api/logout');
  }

  me(): Promise<APIResponse> {
    return this.request.get('/api/me');
  }

  forgotPassword(email: unknown): Promise<APIResponse> {
    return this.request.post('/api/forgot-password', { data: { email } });
  }

  listTestCases(): Promise<APIResponse> {
    return this.request.get('/api/test-cases');
  }

  /** Posts any payload. Created ids are tracked so `cleanup()` can delete them. */
  async createTestCaseRaw(data: Record<string, unknown>): Promise<APIResponse> {
    const response = await this.request.post('/api/test-cases', { data });
    if (response.status() === 201) {
      const body = (await response.json()) as { id: number };
      this.createdIds.push(body.id);
    }
    return response;
  }

  createTestCase(data: TestCaseData): Promise<APIResponse> {
    return this.createTestCaseRaw({ ...data });
  }

  deleteTestCase(id: number | string): Promise<APIResponse> {
    return this.request.delete(`/api/test-cases/${id}`);
  }

  async cleanup(): Promise<void> {
    for (const id of this.createdIds) {
      const response = await this.deleteTestCase(id);
      if (!response.ok()) {
        throw new Error(`Cleanup failed for test case ${id}: ${response.status()}`);
      }
    }
  }
}
