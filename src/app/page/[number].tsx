import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Bookmark, BookmarkCheck, BookOpen, Feather, Mail } from 'lucide-react-native';
import { ActionButton, EmptyState, ErrorText, Screen, SectionLabel } from '../../components/Ui';
import { PostCard } from '../../components/PostCard';
import { api } from '../../lib/api';
import { recordPageOpen } from '../../lib/recentPages';
import { useSession } from '../../lib/session';
import { font, palette, pageNumber } from '../../lib/theme';
import type { LibraryPage } from '../../lib/types';

export default function ReaderScreen() {
  const { number, post } = useLocalSearchParams<{ number: string; post?: string }>();
  const pageId = Number(number);
  const selectedPostId = post ? Number(post) : null;
  const { token, user } = useSession();
  const [page, setPage] = useState<LibraryPage | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    setBusy(true); setError(null);
    api.getPage(pageId).then((result) => {
      if (active) {
        setPage(result);
        void recordPageOpen(result);
      }
    }).catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
    if (token) api.notebook(token).then((list) => { if (active) setSaved(list.some((item) => item.pageNumber === pageId)); }).catch(() => {});
    return () => { active = false; };
  }, [pageId, token]));

  async function toggleSave() {
    if (!token) { router.push('/auth'); return; }
    setSaving(true); setError(null);
    try {
      if (saved) await api.removeBookmark(token, pageId);
      else await api.saveBookmark(token, pageId, '');
      setSaved(!saved);
    } catch (e) { setError(e instanceof Error ? e.message : 'Не получилось сохранить.'); }
    finally { setSaving(false); }
  }

  const displayPosts = page ? [...page.posts].sort((a, b) =>
    Number(b.id === selectedPostId) - Number(a.id === selectedPostId)) : [];
  const hasSelectedPost = !!page?.posts.some((item) => item.id === selectedPostId);

  return <Screen>
    <ActionButton title="Назад" icon={ArrowLeft} variant="quiet" onPress={() => router.back()} style={styles.back} />
    {busy ? <ActivityIndicator color={palette.forest} style={{ marginTop: 70 }} /> : !page ? <EmptyState title="Страница не найдена" message={error || 'Возможно, её номер ещё не появился в каталоге.'} action="Вернуться к поиску" onAction={() => router.replace('/')} /> : <>
      <View style={styles.topBanner}>
        <View style={styles.bannerLeft}><BookOpen size={20} color={palette.moss} strokeWidth={1.45} /><Text style={styles.bannerText}>ЛИЧНАЯ СТРАНИЦА</Text></View>
        <Text style={styles.bannerVolume}>ТОМ {String(page.user.pageNumber).padStart(4, '0')}</Text>
      </View>
      <View style={styles.profile}>
        <View style={styles.numberBadge}><Text style={styles.numberText}>{pageNumber(page.user.pageNumber)}</Text></View>
        <Text style={styles.name}>{page.user.displayName}</Text>
        <Text style={styles.bio}>{page.user.bio}</Text>
        <View style={styles.actions}>
          {user?.id === page.user.id ? <ActionButton title="Написать текст" icon={Feather} onPress={() => router.push('/write')} /> :
            <ActionButton title={saved ? 'В моём блокноте' : 'Сохранить в блокнот'} icon={saved ? BookmarkCheck : Bookmark} variant={saved ? 'secondary' : 'primary'} loading={saving} onPress={toggleSave} />}
          <ActionButton title={user?.id === page.user.id ? 'Написать себе' : 'Написать автору'}
            icon={Mail} variant="secondary"
            onPress={() => router.push({ pathname: '/message/compose', params: { to: String(page.user.pageNumber) } })} />
        </View>
      </View>
      <View style={styles.posts}>
        <SectionLabel text="Заметки автора" trailing={`${page.posts.length} публикаций`} />
        {hasSelectedPost && <Text style={styles.searchNote}>Найденная публикация показана первой.</Text>}
        {page.posts.length === 0 ? <EmptyState title="Публикаций пока нет" message="Автор ещё ничего не опубликовал." /> : displayPosts.map((item) => <PostCard key={item.id} post={item} onEdit={user?.id === page.user.id ? () => router.push({ pathname: '/write', params: { id: String(item.id) } }) : undefined} />)}
      </View>
      <ErrorText message={page && error} />
    </>}
  </Screen>;
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: -8, marginBottom: 8 },
  topBanner: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: palette.border, paddingTop: 19, alignItems: 'center', gap: 10 },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  bannerText: { fontSize: 10, letterSpacing: 1.8, color: palette.muted, fontWeight: '700' },
  bannerVolume: { fontSize: 10, letterSpacing: 1.8, color: palette.accent, fontWeight: '700' },
  profile: { alignItems: 'flex-start', paddingVertical: 23 },
  numberBadge: { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 30 },
  numberText: { fontFamily: font.serif, color: palette.forest, fontSize: 14 },
  name: { fontFamily: font.serif, fontSize: 34, lineHeight: 43, color: palette.ink, marginTop: 12 },
  bio: { maxWidth: 620, fontSize: 14, lineHeight: 23, color: palette.inkSoft, marginTop: 8 },
  actions: { marginTop: 17, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 10 },
  posts: { maxWidth: 670, width: '100%', alignSelf: 'center', borderTopWidth: 1, borderColor: palette.border, paddingTop: 26 },
  searchNote: { color: palette.forest, fontSize: 12, marginTop: 12, fontWeight: '600' },
});
