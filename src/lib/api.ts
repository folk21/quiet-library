import { demo } from './demo';
import type { AuthResponse, Bookmark, CatalogStats, LibraryPage, Post, User } from './types';

export const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';
const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

async function request<T>(path: string, token?: string | null, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('Не удалось связаться с библиотекой. Проверьте адрес API и подключение.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Что-то пошло не так. Попробуйте ещё раз.');
  return body as T;
}

export const api = {
  stats: (): Promise<CatalogStats> => isDemoMode ? demo.stats() : request('/api/catalog/stats'),
  getPage: (number: number): Promise<LibraryPage> => isDemoMode ? demo.getPage(number) : request(`/api/pages/${number}`),
  randomPage: (): Promise<LibraryPage> => isDemoMode ? demo.randomPage() : request('/api/pages/random'),
  register: (input: { displayName: string; email: string; password: string }): Promise<AuthResponse> =>
    isDemoMode ? demo.register(input) : request('/api/auth/register', null, { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }): Promise<AuthResponse> =>
    isDemoMode ? demo.login(input) : request('/api/auth/login', null, { method: 'POST', body: JSON.stringify(input) }),
  me: (token: string): Promise<User> => isDemoMode ? demo.me(token) : request('/api/me', token),
  logout: (token: string): Promise<void> => isDemoMode ? Promise.resolve() : request('/api/auth/logout', token, { method: 'POST' }),
  notebook: (token: string): Promise<Bookmark[]> => isDemoMode ? demo.notebook(token) : request('/api/notebook', token),
  saveBookmark: (token: string, number: number, note: string): Promise<Bookmark> =>
    isDemoMode ? demo.saveBookmark(token, number, note) : request(`/api/notebook/${number}`, token, { method: 'PUT', body: JSON.stringify({ note }) }),
  removeBookmark: (token: string, number: number): Promise<void> =>
    isDemoMode ? demo.removeBookmark(token, number) : request(`/api/notebook/${number}`, token, { method: 'DELETE' }),
  createPost: (token: string, title: string, content: string): Promise<Post> =>
    isDemoMode ? demo.createPost(token, title, content) : request('/api/posts', token, { method: 'POST', body: JSON.stringify({ title, content }) }),
  updatePost: (token: string, id: number, title: string, content: string): Promise<Post> =>
    isDemoMode ? demo.updatePost(token, id, title, content) : request(`/api/posts/${id}`, token, { method: 'PUT', body: JSON.stringify({ title, content }) }),
  deletePost: (token: string, id: number): Promise<void> =>
    isDemoMode ? demo.deletePost(token, id) : request(`/api/posts/${id}`, token, { method: 'DELETE' }),
};
