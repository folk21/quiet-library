import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, BookOpen, Feather, LogOut } from 'lucide-react-native';
import { ActionButton, EmptyState, ErrorText, Screen, SectionLabel } from '../../components/Ui';
import { PostCard } from '../../components/PostCard';
import { api } from '../../lib/api';
import { useSession } from '../../lib/session';
import { common, font, palette, pageNumber } from '../../lib/theme';
import type { LibraryPage } from '../../lib/types';

export default function MyPageScreen() {
  const { user, loading, signOut } = useSession();
  const [page, setPage] = useState<LibraryPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!user) { setPage(null); return; }
    let active = true;
    api.getPage(user.pageNumber).then((result) => { if (active) setPage(result); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [user]));

  if (loading) return <Screen><ActivityIndicator color={palette.forest} /></Screen>;
  if (!user) return <Screen>
    <View style={{ marginTop: 24 }}><Text style={common.eyebrow}>ВАШ ТОМ ЕЩЁ НЕ НА ПОЛКЕ</Text><Text style={styles.heroTitle}>Каждой истории{ '\n' }нужно место.</Text><Text style={styles.intro}>Создайте собственную страницу и оставьте первые строки. Они будут ждать читателя, который однажды найдёт ваш номер.</Text></View>
    <EmptyState title="Ваша страница ждёт вас" message="Войдите или зарегистрируйтесь, чтобы писать в библиотеке." action="Создать страницу" onAction={() => router.push('/auth?mode=register')} />
    <ActionButton title="У меня уже есть страница" variant="quiet" onPress={() => router.push('/auth')} style={{ alignSelf: 'center', marginTop: 15 }} />
  </Screen>;

  return <Screen>
    <View style={styles.personalHead}><View><Text style={common.eyebrow}>ЛИЧНЫЙ КАБИНЕТ · ВАШ ТОМ</Text><Text style={styles.heroTitle}>Моя страница</Text></View>
      <ActionButton title="Выйти" variant="quiet" icon={LogOut} onPress={async () => { await signOut(); router.replace('/'); }} />
    </View>
    <View style={styles.identity}>
      <View style={styles.bookIcon}><BookOpen size={28} color={palette.card} strokeWidth={1.3} /></View>
      <Text style={styles.number}>{pageNumber(user.pageNumber)}</Text>
      <Text style={styles.name}>{user.displayName}</Text>
      <Text style={styles.bio}>{user.bio}</Text>
      <View style={styles.identityActions}>
        <ActionButton title="Написать заметку" icon={Feather} onPress={() => router.push('/write')} />
        <ActionButton title="Открыть мою страницу" icon={ArrowRight} variant="secondary" onPress={() => router.push({ pathname: '/page/[number]', params: { number: String(user.pageNumber) } })} />
      </View>
    </View>
    <View style={styles.posts}>
      <SectionLabel text="Мои публикации" trailing={`${page?.posts.length ?? 0} записей`} />
      <ErrorText message={error} />
      {!page ? <ActivityIndicator color={palette.forest} style={{ marginTop: 30 }} /> : page.posts.length === 0 ?
        <EmptyState title="Чистая страница" message="Не обязательно писать много. Иногда одной честной заметки достаточно." action="Начать писать" onAction={() => router.push('/write')} /> :
        page.posts.map((post) => <PostCard key={post.id} post={post} compact onEdit={() => router.push({ pathname: '/write', params: { id: String(post.id) } })} />)}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  personalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9, marginBottom: 27, flexWrap: 'wrap' },
  heroTitle: { fontFamily: font.serif, fontSize: 38, lineHeight: 47, color: palette.ink, marginTop: 12, marginBottom: 16 },
  intro: { fontSize: 15, lineHeight: 25, color: palette.inkSoft, maxWidth: 570, marginBottom: 30 },
  identity: { backgroundColor: '#E6EAE0', borderRadius: 17, borderWidth: 1, borderColor: '#D4DDD0', padding: 32, alignItems: 'center' },
  bookIcon: { width: 65, height: 65, backgroundColor: palette.forest, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  number: { fontFamily: font.serif, fontSize: 17, color: palette.forest },
  name: { fontFamily: font.serif, fontSize: 35, color: palette.ink, marginTop: 9 },
  bio: { fontSize: 13.5, lineHeight: 23, color: palette.inkSoft, textAlign: 'center', marginTop: 11 },
  identityActions: { marginTop: 27, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 11 },
  posts: { marginTop: 43, width: '100%', maxWidth: 700, alignSelf: 'center' },
});
