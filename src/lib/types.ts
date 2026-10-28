export type User = {
  id: number;
  pageNumber: number;
  displayName: string;
  bio: string;
  isDemo?: boolean;
};

export type Post = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryPage = {
  user: User;
  posts: Post[];
};

export type Bookmark = {
  pageNumber: number;
  displayName: string;
  bio: string;
  note: string;
  savedAt: string;
};

export type CatalogStats = { pages: number; posts: number };
export type CatalogAuthor = { pageNumber: number; displayName: string; postCount: number };
export type SearchHit = {
  pageNumber: number;
  displayName: string;
  postId: number;
  title: string;
  excerpt: string;
};
export type AuthResponse = { token: string; user: User };

export type MessageKind = 'simple' | 'thought' | 'letter';
export type MessagePreferences = Record<MessageKind, boolean>;

export type MessageRecipientOptions = {
  pageNumber: number;
  displayName: string;
  isDemo: boolean;
  acceptedTypes: MessagePreferences;
};

export type MessageSummary = {
  id: number;
  senderPageNumber: number;
  senderName: string;
  recipientPageNumber: number;
  recipientName: string;
  kind: MessageKind;
  subject: string;
  preview: string;
  createdAt: string;
  readAt: string | null;
};

export type MessageDetails = Omit<MessageSummary, 'preview'> & { content: string };

export type SendMessageInput = {
  recipientPageNumber: number;
  kind: MessageKind;
  subject: string;
  content: string;
};
