import { demo } from './demo';
import type { AuthResponse, Bookmark, CatalogAuthor, CatalogStats, LibraryPage, MessageDetails, MessagePreferences, MessageRecipientOptions, MessageSummary, Post, SearchHit, SendMessageInput, User } from './types';

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
  catalogAuthors: (): Promise<CatalogAuthor[]> => isDemoMode ? demo.catalogAuthors() : request('/api/catalog/authors'),
  search: (query: string): Promise<SearchHit[]> => isDemoMode ? demo.search(query) : request(`/api/search?q=${encodeURIComponent(query)}`),
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
  messageOptions: (number: number): Promise<MessageRecipientOptions> =>
    isDemoMode ? demo.messageOptions(number) : request(`/api/pages/${number}/message-options`),
  messagePreferences: (token: string): Promise<MessagePreferences> =>
    isDemoMode ? demo.messagePreferences(token) : request('/api/me/message-preferences', token),
  updateMessagePreferences: (token: string, preferences: MessagePreferences): Promise<MessagePreferences> =>
    isDemoMode ? demo.updateMessagePreferences(token, preferences) : request('/api/me/message-preferences', token, { method: 'PUT', body: JSON.stringify(preferences) }),
  inbox: (token: string): Promise<MessageSummary[]> =>
    isDemoMode ? demo.inbox(token) : request('/api/messages/inbox', token),
  sent: (token: string): Promise<MessageSummary[]> =>
    isDemoMode ? demo.sent(token) : request('/api/messages/sent', token),
  getMessage: (token: string, id: number): Promise<MessageDetails> =>
    isDemoMode ? demo.getMessage(token, id) : request(`/api/messages/${id}`, token),
  sendMessage: (token: string, input: SendMessageInput): Promise<MessageDetails> =>
    isDemoMode ? demo.sendMessage(token, input) : request('/api/messages', token, { method: 'POST', body: JSON.stringify(input) }),
  markMessageRead: (token: string, id: number): Promise<void> =>
    isDemoMode ? demo.markMessageRead(token, id) : request(`/api/messages/${id}/read`, token, { method: 'POST' }),
};
