import { apiGet, apiPost } from './client';

export interface AuthUser {
  userId: string;
  employeeId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', { email, password });
}

export async function logout(): Promise<void> {
  await apiPost('/auth/logout');
}

export async function me(): Promise<{ user: AuthUser }> {
  return apiGet<{ user: AuthUser }>('/auth/me');
}
