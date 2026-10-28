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
    <View style={{ marginTop: 24 }}><Text style={common.eyebrow}>ЛИЧНЫЙ КАБИНЕТ</Text><Text style={styles.heroTitle}>Моя страница</Text><Text style={styles.intro}>Зарегистрируйтесь, чтобы публиковать тексты под своим постоянным номером.</Text></View>
    <EmptyState title="Аккаунт не создан" message="Войдите или зарегистрируйтесь, чтобы управлять публикациями." action="Создать страницу" onAction={() => router.push('/auth?mode=register')} />
    <ActionButton title="У меня уже есть страница" variant="quiet" onPress={() => router.push('/auth')} style={{ alignSelf: 'center', marginTop: 15 }} />
  </Screen>;

  return <Screen>
    <View style={styles.personalHead}><View><Text style={common.eyebrow}>ЛИЧНЫЙ КАБИНЕТ</Text><Text style={styles.heroTitle}>Моя страница</Text></View>
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
        <EmptyState title="Пока нет публикаций" message="Создайте первую запись, чтобы она появилась на вашей странице." action="Начать писать" onAction={() => router.push('/write')} /> :
        page.posts.map((post) => <PostCard key={post.id} post={post} compact onEdit={() => router.push({ pathname: '/write', params: { id: String(post.id) } })} />)}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  personalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9, marginBottom: 14, flexWrap: 'wrap' },
  heroTitle: { fontFamily: font.serif, fontSize: 33, lineHeight: 42, color: palette.ink, marginTop: 9, marginBottom: 9 },
  intro: { fontSize: 15, lineHeight: 25, color: palette.inkSoft, maxWidth: 570, marginBottom: 30 },
  identity: { backgroundColor: '#E6EAE0', borderRadius: 17, borderWidth: 1, borderColor: '#D4DDD0', padding: 22, alignItems: 'flex-start' },
  bookIcon: { width: 47, height: 47, backgroundColor: palette.forest, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  number: { fontFamily: font.serif, fontSize: 17, color: palette.forest },
  name: { fontFamily: font.serif, fontSize: 30, color: palette.ink, marginTop: 8 },
  bio: { fontSize: 13.5, lineHeight: 22, color: palette.inkSoft, marginTop: 7 },
  identityActions: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 10 },
  posts: { marginTop: 27, width: '100%', maxWidth: 700, alignSelf: 'center' },
});
