import type { AuthResponse, Bookmark, CatalogStats, LibraryPage, Post, User } from './types';

const now = new Date('2026-10-18T13:00:00.000Z').toISOString();

const sampleUsers: User[] = [
  { id: 1, pageNumber: 56, displayName: 'Ева Белая', bio: 'Записываю маленькие происшествия, города и тишину между словами.', isDemo: true },
  { id: 2, pageNumber: 207, displayName: 'Марк Ясный', bio: 'Наблюдения из поездов, старые книги и разговоры с незнакомцами.', isDemo: true },
  { id: 3, pageNumber: 314, displayName: 'Ася Гордеева', bio: 'Ботаника, мокрые улицы и попытки замечать хорошее.', isDemo: true },
  { id: 4, pageNumber: 721, displayName: 'Никита Северин', bio: 'Несколько заметок о музыке, архитектуре и памяти.', isDemo: true },
  { id: 5, pageNumber: 1128, displayName: 'Лия Рейн', bio: 'Живу у моря. Сохраняю слова, которые не хочется терять.', isDemo: true },
];

const samplePosts: Record<number, Post[]> = {
  56: [
    {
      id: 101, title: 'О вещах, которые остаются', createdAt: '2026-10-17T16:00:00Z', updatedAt: '2026-10-17T16:00:00Z',
      content: 'Вчера я нашла в кармане старого пальто билет на поезд. Станция отправления давно закрыта, а поезд, наверное, больше не ходит.\n\nМне кажется, память похожа на маленький вокзал. Некоторые люди приезжают ненадолго, другие остаются ждать на скамейке. И есть те, чьи имена мы узнаём только по выцветшим билетам.\n\nЯ оставила билет между страниц книги. Не потому что он важен. Просто иногда хочется, чтобы у вещей было место, куда возвращаться.',
    },
    {
      id: 102, title: 'Тихая среда', createdAt: '2026-10-11T09:00:00Z', updatedAt: '2026-10-11T09:00:00Z',
      content: 'Сегодня весь город будто говорил вполголоса. В кофейне не играла музыка. Улицы пахли дождём и хлебом.\n\nХороший день для того, чтобы никуда не спешить.',
    },
  ],
  207: [
    {
      id: 201, title: 'География случайных встреч', createdAt: '2026-10-14T09:00:00Z', updatedAt: '2026-10-14T09:00:00Z',
      content: 'В ночном поезде сосед по купе рассказал, что всю жизнь восстанавливает старые радиоприёмники. Он говорил о них так, как обычно говорят о близких друзьях.\n\nИногда несколько часов рядом с незнакомцем позволяют увидеть больше, чем месяцы привычных разговоров.\n\nНа прощание он сказал: «У каждой частоты есть свой человек. Главное — не переставать настраиваться».',
    },
  ],
  314: [
    {
      id: 301, title: 'Сад без адреса', createdAt: '2026-10-13T12:20:00Z', updatedAt: '2026-10-13T12:20:00Z',
      content: 'Мне нравится находить растения в самых неподходящих местах: между плитами старого двора, у заборов, в трещинах асфальта.\n\nНикто не просил их расти именно здесь. И всё же каждое утро они продолжают свою тихую работу.\n\nВозможно, стойкость — это не громкое слово, а маленький зелёный лист.',
    },
  ],
  721: [
    {
      id: 401, title: 'Город в миноре', createdAt: '2026-10-10T19:35:00Z', updatedAt: '2026-10-10T19:35:00Z',
      content: 'Есть здания, мимо которых мы проходим каждый день и никогда не поднимаем голову.\n\nОднажды я остановился под старым балконом и вдруг увидел на камне маленькую вырезанную звезду. Ниже кто-то написал дату — 1926.\n\nС тех пор этот угол города больше не кажется мне безымянным.',
    },
  ],
  1128: [
    {
      id: 501, title: 'Море ещё спит', createdAt: '2026-10-09T06:10:00Z', updatedAt: '2026-10-09T06:10:00Z',
      content: 'В шесть утра на берегу почти никого нет. Вода кажется темнее неба, а чайки делают вид, что город принадлежит только им.\n\nЯ хожу сюда без телефона. Это очень маленькое изменение, но от него утро становится длиннее.',
    },
  ],
};

const demoAccounts = new Map<string, { password: string; user: User }>();
const demoNotebooks = new Map<number, Map<number, Bookmark>>();
let nextUserId = 100;
let nextPostId = 1000;

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 180));
}

function currentUser(token: string | null): User {
  const id = Number(token?.replace('demo:', ''));
  const user = sampleUsers.find((item) => item.id === id);
  if (!token?.startsWith('demo:') || !user || user.isDemo) throw new Error('Войдите, чтобы продолжить.');
  return user;
}

function getNotebook(userId: number): Map<number, Bookmark> {
  let entries = demoNotebooks.get(userId);
  if (!entries) {
    entries = new Map<number, Bookmark>();
    demoNotebooks.set(userId, entries);
  }
  return entries;
}

export const demo = {
  async stats(): Promise<CatalogStats> {
    await wait();
    return { pages: sampleUsers.length, posts: Object.values(samplePosts).reduce((acc, posts) => acc + posts.length, 0) };
  },
  async getPage(number: number): Promise<LibraryPage> {
    await wait();
    const user = sampleUsers.find((item) => item.pageNumber === number);
    if (!user) throw new Error('Такой страницы пока нет в библиотеке.');
    return { user, posts: [...(samplePosts[number] ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  },
  async randomPage(): Promise<LibraryPage> {
    await wait();
    const choices = sampleUsers.filter((item) => (samplePosts[item.pageNumber] ?? []).length > 0);
    const user = choices[Math.floor(Math.random() * choices.length)];
    return { user, posts: [...(samplePosts[user.pageNumber] ?? [])] };
  },
  async register(input: { displayName: string; email: string; password: string }): Promise<AuthResponse> {
    await wait();
    const email = input.email.trim().toLowerCase();
    if (!email.includes('@') || input.password.length < 8 || input.displayName.trim().length < 2) throw new Error('Проверьте имя, email и пароль (не менее 8 символов).');
    if (demoAccounts.has(email)) throw new Error('Этот email уже зарегистрирован.');
    const user: User = { id: nextUserId++, pageNumber: 1300 + nextUserId, displayName: input.displayName.trim(), bio: 'Новая история в библиотеке.', isDemo: false };
    sampleUsers.push(user);
    demoAccounts.set(email, { password: input.password, user });
    samplePosts[user.pageNumber] = [];
    return { token: `demo:${user.id}`, user };
  },
  async login(input: { email: string; password: string }): Promise<AuthResponse> {
    await wait();
    const record = demoAccounts.get(input.email.trim().toLowerCase());
    if (!record || record.password !== input.password) throw new Error('Неверный email или пароль.');
    return { token: `demo:${record.user.id}`, user: record.user };
  },
  async me(token: string): Promise<User> {
    await wait();
    return currentUser(token);
  },
  async notebook(token: string): Promise<Bookmark[]> {
    await wait();
    return [...getNotebook(currentUser(token).id).values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  },
  async saveBookmark(token: string, number: number, note: string): Promise<Bookmark> {
    const user = currentUser(token);
    const target = sampleUsers.find((item) => item.pageNumber === number);
    if (!target) throw new Error('Страница не найдена.');
    const existing = getNotebook(user.id).get(number);
    const entry: Bookmark = { pageNumber: number, displayName: target.displayName, bio: target.bio, note, savedAt: existing?.savedAt ?? now };
    getNotebook(user.id).set(number, entry);
    return entry;
  },
  async removeBookmark(token: string, number: number): Promise<void> {
    getNotebook(currentUser(token).id).delete(number);
  },
  async createPost(token: string, title: string, content: string): Promise<Post> {
    const user = currentUser(token);
    if (!title.trim() || !content.trim()) throw new Error('Укажите заголовок и текст.');
    const post: Post = { id: nextPostId++, title: title.trim(), content: content.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    samplePosts[user.pageNumber].unshift(post);
    return post;
  },
  async updatePost(token: string, id: number, title: string, content: string): Promise<Post> {
    const user = currentUser(token);
    const post = (samplePosts[user.pageNumber] ?? []).find((item) => item.id === id);
    if (!post) throw new Error('Публикация не найдена.');
    post.title = title.trim();
    post.content = content.trim();
    post.updatedAt = new Date().toISOString();
    return post;
  },
  async deletePost(token: string, id: number): Promise<void> {
    const user = currentUser(token);
    samplePosts[user.pageNumber] = (samplePosts[user.pageNumber] ?? []).filter((item) => item.id !== id);
  },
};
