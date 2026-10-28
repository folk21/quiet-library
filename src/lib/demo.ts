import type { AuthResponse, Bookmark, CatalogAuthor, CatalogStats, LibraryPage, MessageDetails, MessagePreferences, MessageRecipientOptions, MessageSummary, Post, SearchHit, SendMessageInput, User } from './types';
import { characterCount, messageKind } from './messageKinds';

const now = new Date('2026-10-18T13:00:00.000Z').toISOString();

const sampleUsers: User[] = [
  { id: 1, pageNumber: 56, displayName: 'Ева Белая', bio: 'Городские прогулки, архивные находки и заметки о повседневности.', isDemo: true },
  { id: 2, pageNumber: 207, displayName: 'Марк Ясный', bio: 'Поезда, география, разговоры в пути и проверенные маршруты.', isDemo: true },
  { id: 3, pageNumber: 314, displayName: 'Ася Гордеева', bio: 'Ботаника в городе, садоводство и наблюдения за растениями.', isDemo: true },
  { id: 4, pageNumber: 721, displayName: 'Никита Северин', bio: 'Городская архитектура, общественные здания и история городских деталей.', isDemo: true },
  { id: 5, pageNumber: 1128, displayName: 'Лия Рейн', bio: 'Жизнь у моря, местная экономика и заметки о береговых городах.', isDemo: true },
  { id: 6, pageNumber: 1450, displayName: 'Антон Громов', bio: 'Разработка программ и ремонт техники.', isDemo: true },
  { id: 7, pageNumber: 1502, displayName: 'Дарья Ким', bio: 'Типографика, книги и работа с текстом.', isDemo: true },
  { id: 8, pageNumber: 1699, displayName: 'Павел Сорокин', bio: 'Пешие маршруты и ориентирование.', isDemo: true },
  { id: 9, pageNumber: 1764, displayName: 'Марина Орлова', bio: 'Рецепты и городские рынки.', isDemo: true },
  { id: 10, pageNumber: 1888, displayName: 'Игорь Воронов', bio: 'Радиотехника и восстановление старых приборов.', isDemo: true },
];

const samplePosts: Record<number, Post[]> = {
  56: [
    {
      id: 101, title: 'О вещах, которые остаются', createdAt: '2026-10-17T16:00:00Z', updatedAt: '2026-10-17T16:00:00Z',
      content: 'Вчера я нашла в кармане старого пальто билет на поезд. Станция отправления давно закрыта, а поезд, наверное, больше не ходит.\n\nНа обороте кто-то карандашом записал время встречи. Я посмотрела на дату и вспомнила, как мы тогда спорили, стоит ли уезжать. Билет не объясняет, чем закончился разговор, но неожиданно точно возвращает его начало.',
    },
    {
      id: 102, title: 'Маршрут через промзону', createdAt: '2026-10-11T09:00:00Z', updatedAt: '2026-10-11T09:00:00Z',
      content: 'Старую фабрику у реки давно закрыли, но дорожка к ней всё ещё используется. Утром там идут люди с собаками, вечером — велосипедисты.\n\nЯ прошла весь маршрут с блокнотом. По одну сторону дороги сохранилась железнодорожная ветка, по другую уже построили офисы. Между ними — маленькая пекарня, открытая бывшим инженером этой фабрики.',
    },
  ],
  207: [
    {
      id: 201, title: 'География случайных встреч', createdAt: '2026-10-14T09:00:00Z', updatedAt: '2026-10-14T09:00:00Z',
      content: 'В ночном поезде сосед по купе рассказал, что всю жизнь восстанавливает старые радиоприёмники. Он начал с аппарата, найденного у родственников на антресоли, а теперь ездит на радиорынки в соседние города.\n\nОн показал фотографии мастерской и объяснил разницу между треском старого динамика и помехами из-за плохого контакта. До этого разговора я не задумывался, сколько терпения требуется для такой работы.',
    },
  ],
  314: [
    {
      id: 301, title: 'Сад без адреса', createdAt: '2026-10-13T12:20:00Z', updatedAt: '2026-10-13T12:20:00Z',
      content: 'Мне нравится находить растения в самых неподходящих местах: между плитами старого двора, у заборов, в трещинах асфальта.\n\nВесной я начала отмечать такие места на карте. Некоторые растения пережили ремонт дороги, другие исчезли после первой жары. Теперь мне интересно не столько их название, сколько условия, которые позволили им появиться.',
    },
  ],
  721: [
    {
      id: 401, title: 'Город в миноре', createdAt: '2026-10-10T19:35:00Z', updatedAt: '2026-10-10T19:35:00Z',
      content: 'Есть здания, мимо которых мы проходим каждый день и никогда не поднимаем голову.\n\nОднажды я остановился под старым балконом и увидел маленькую вырезанную звезду. На фотографиях начала прошлого века она уже была на месте. Я решил узнать, кто проектировал дом и почему именно эту деталь не закрыли во время ремонта.',
    },
  ],
  1128: [
    {
      id: 501, title: 'Море ещё спит', createdAt: '2026-10-09T06:10:00Z', updatedAt: '2026-10-09T06:10:00Z',
      content: 'В шесть утра на берегу почти никого нет. Рыбаки уже вернулись, а кафе ещё не открылись. Я прошла от маяка до старой лестницы и заметила, что после шторма поменялась линия песка.\n\nМестные говорят, что это обычное осеннее явление, но в этом году берег восстанавливается медленнее. В следующую прогулку возьму фотографии с прошлого сезона и попробую сравнить.',
    },
  ],
  1450: [
    { id: 601, title: 'Маленькая программа для архива', content: 'За выходные я написал утилиту для поиска по сканам документов. Самым трудным оказалось решить, что делать с файлами без даты. Я оставил их в отдельной очереди для ручной проверки.', createdAt: now, updatedAt: now },
  ],
  1502: [
    { id: 701, title: 'Неделя в типографии', content: 'Пять дней я проверяла цветопробы и собирала сигнальный экземпляр. Цифровой макет и готовая печатная книга отличаются сильнее, чем кажется на экране.', createdAt: now, updatedAt: now },
  ],
  1699: [
    { id: 801, title: 'Маршрут вдоль канала', content: 'Прошёл восемь километров вдоль старого канала. После дождей тропу размыло, поэтому пришлось свериться с бумажной картой и найти обход через деревню.', createdAt: now, updatedAt: now },
  ],
  1764: [
    { id: 901, title: 'Тетрадь рецептов', content: 'У бабушкиной тетради мягкая обложка и десятки вставленных листков. Рядом с рецептами стоят комментарии после каждой попытки. Переписываю их без исправлений.', createdAt: now, updatedAt: now },
  ],
  1888: [
    { id: 1001, title: 'Три ночи с антенной', content: 'Проверял приём коротковолнового сигнала во дворе. Три вечера сравнивал уровень помех, пока не выяснил, что больше всего мешает блок питания старого светильника.', createdAt: now, updatedAt: now },
  ],
};

const demoAccounts = new Map<string, { password: string; user: User }>();
const demoNotebooks = new Map<number, Map<number, Bookmark>>();
const demoMessagePreferences = new Map<number, MessagePreferences>();
const demoMessages: MessageDetails[] = [];
let nextUserId = 100;
let nextPostId = 2000;
let nextMessageId = 1;

function getPreferences(userId: number): MessagePreferences {
  return demoMessagePreferences.get(userId) ?? { simple: true, thought: true, letter: true };
}

function messageSummary(message: MessageDetails): MessageSummary {
  const { content, ...metadata } = message;
  return { ...metadata, preview: content.slice(0, 180) };
}

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
  async catalogAuthors(): Promise<CatalogAuthor[]> {
    await wait();
    return sampleUsers.slice(0, 40).map((user) => ({
      pageNumber: user.pageNumber,
      displayName: user.displayName,
      postCount: samplePosts[user.pageNumber]?.length ?? 0,
    }));
  },
  async search(query: string): Promise<SearchHit[]> {
    await wait();
    const words = query.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return sampleUsers.flatMap((user) =>
      (samplePosts[user.pageNumber] ?? []).flatMap((post) => {
        const text = `${post.title} ${post.content}`.toLocaleLowerCase('ru');
        if (!words.every((word) => text.includes(word))) return [];
        const position = post.content.toLocaleLowerCase('ru').indexOf(words[0]);
        const from = Math.max(0, position - 40);
        const excerpt = post.content.slice(from, from + 190).replace(/\s+/g, ' ').trim();
        return [{
          pageNumber: user.pageNumber,
          displayName: user.displayName,
          postId: post.id,
          title: post.title,
          excerpt: `${from ? '…' : ''}${excerpt}${from + 190 < post.content.length ? '…' : ''}`,
        }];
      })
    ).slice(0, 25);
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
    const user: User = { id: nextUserId++, pageNumber: 1300 + nextUserId, displayName: input.displayName.trim(), bio: 'Публикации и заметки автора.', isDemo: false };
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
  async messageOptions(number: number): Promise<MessageRecipientOptions> {
    await wait();
    const user = sampleUsers.find((item) => item.pageNumber === number);
    if (!user) throw new Error('Такого автора нет.');
    return { pageNumber: number, displayName: user.displayName, isDemo: !!user.isDemo, acceptedTypes: { ...getPreferences(user.id) } };
  },
  async messagePreferences(token: string): Promise<MessagePreferences> {
    await wait();
    return { ...getPreferences(currentUser(token).id) };
  },
  async updateMessagePreferences(token: string, preferences: MessagePreferences): Promise<MessagePreferences> {
    await wait();
    const user = currentUser(token);
    const saved = { simple: !!preferences.simple, thought: !!preferences.thought, letter: !!preferences.letter };
    demoMessagePreferences.set(user.id, saved);
    return { ...saved };
  },
  async inbox(token: string): Promise<MessageSummary[]> {
    await wait();
    const user = currentUser(token);
    return demoMessages.filter((message) => message.recipientPageNumber === user.pageNumber)
      .sort((a, b) => b.id - a.id).slice(0, 50).map(messageSummary);
  },
  async sent(token: string): Promise<MessageSummary[]> {
    await wait();
    const user = currentUser(token);
    return demoMessages.filter((message) => message.senderPageNumber === user.pageNumber)
      .sort((a, b) => b.id - a.id).slice(0, 50).map(messageSummary);
  },
  async getMessage(token: string, id: number): Promise<MessageDetails> {
    await wait();
    const user = currentUser(token);
    const message = demoMessages.find((item) => item.id === id &&
      (item.senderPageNumber === user.pageNumber || item.recipientPageNumber === user.pageNumber));
    if (!message) throw new Error('Сообщение не найдено.');
    return { ...message };
  },
  async sendMessage(token: string, input: SendMessageInput): Promise<MessageDetails> {
    await wait();
    const sender = currentUser(token);
    const recipient = sampleUsers.find((item) => item.pageNumber === input.recipientPageNumber);
    if (!recipient) throw new Error('Автор не найден.');
    const length = characterCount(input.content);
    if (length < messageKind(input.kind).minimum || length > 30000 || input.subject.length > 140) {
      throw new Error('Проверьте длину сообщения и тему.');
    }
    if (recipient.id !== sender.id && !getPreferences(recipient.id)[input.kind]) {
      throw new Error('Автор не принимает сообщения этого типа.');
    }
    const message: MessageDetails = {
      id: nextMessageId++,
      senderPageNumber: sender.pageNumber,
      senderName: sender.displayName,
      recipientPageNumber: recipient.pageNumber,
      recipientName: recipient.displayName,
      kind: input.kind,
      subject: input.subject.trim(),
      content: input.content.trim(),
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    demoMessages.push(message);
    return { ...message };
  },
  async markMessageRead(token: string, id: number): Promise<void> {
    await wait();
    const user = currentUser(token);
    const message = demoMessages.find((item) => item.id === id && item.recipientPageNumber === user.pageNumber);
    if (!message) throw new Error('Сообщение не найдено.');
    message.readAt ??= new Date().toISOString();
  },
};
