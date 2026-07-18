import type { AuthResponse, LoginInput, PublicUser, RegisterInput } from '@gymcrush/shared';
import { api } from '@/lib/api';

export const authApi = {
  register: (input: RegisterInput) =>
    api<AuthResponse>('/api/auth/register', { method: 'POST', body: input, auth: false }),

  login: (input: LoginInput) =>
    api<AuthResponse>('/api/auth/login', { method: 'POST', body: input, auth: false }),

  logout: (refreshToken: string) =>
    api<void>('/api/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }),

  /** The current user (uses the stored access token, refreshing if needed). */
  me: () => api<{ user: PublicUser }>('/api/auth/me'),
};
