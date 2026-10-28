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
export type AuthResponse = { token: string; user: User };
