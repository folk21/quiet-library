import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, BookOpen, Bookmark, ChevronRight, Clock3, Feather, Hash, Mail, Search, Shuffle, Trash2 } from 'lucide-react-native';
import { ActionButton, BookInput, ErrorText, Screen, SectionLabel } from '../../components/Ui';
import { api } from '../../lib/api';
import { clearRecentPages, loadRecentPages, type RecentPage } from '../../lib/recentPages';
import { useSession } from '../../lib/session';
import type { CatalogAuthor, CatalogStats, SearchHit } from '../../lib/types';
import { common, font, palette, pageNumber } from '../../lib/theme';

type SearchMode = 'content' | 'number';

function openedAt(value: string): string {
  return new Date(value).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function DiscoverScreen() {
  const [mode, setMode] = useState<SearchMode>('content');
  const [numberQuery, setNumberQuery] = useState('');
  const [textQuery, setTextQuery] = useState('');
  const [results, setResults] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<CatalogAuthor[]>([]);
  const [authorsError, setAuthorsError] = useState<string | null>(null);
  const [showAllAuthors, setShowAllAuthors] = useState(false);
  const [recent, setRecent] = useState<RecentPage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const wide = width > 680;

  useFocusEffect(useCallback(() => {
    let active = true;
    void loadRecentPages()
      .then((items) => { if (active) setRecent(items); })
      .finally(() => { if (active) setLoadingHistory(false); });
    api.stats().then((value) => { if (active) setStats(value); }).catch(() => {});
    api.catalogAuthors()
      .then((value) => { if (active) { setAuthors(value); setAuthorsError(null); } })
      .catch(() => { if (active) setAuthorsError('Не удалось загрузить авторов.'); });
    return () => { active = false; };
  }, []));

  function openPage(number: number, postId?: number) {
    router.push({ pathname: '/page/[number]', params: {
      number: String(number),
      ...(postId ? { post: String(postId) } : {}),
    } });
  }

  function goToNumber() {
    const value = numberQuery.trim();
    const number = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number <= 0) {
      setSearchError('Введите корректный номер страницы.');
      return;
    }
    setSearchError(null);
    openPage(number);
  }

  async function searchText() {
    const query = textQuery.trim();
    if (!query) { setSearchError('Введите слово или тему для поиска.'); return; }
    if (searching) return;
    setSearching(true);
    setSearchError(null);
    try { setResults(await api.search(query)); }
    catch (error) {
      setResults(null);
      setSearchError(error instanceof Error ? error.message : 'Не удалось выполнить поиск.');
    } finally { setSearching(false); }
  }

  async function openRandom() {
    if (busy) return;
    setBusy(true);
    setSearchError(null);
    try {
      const page = await api.randomPage();
      openPage(page.user.pageNumber);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Не удалось открыть страницу.');
    } finally { setBusy(false); }
  }

  async function clearHistory() {
    await clearRecentPages();
    setRecent([]);
    setConfirmClear(false);
  }

  return <Screen>
    <View style={styles.headingRow}>
      <View style={styles.headingCopy}>
        <Text style={common.eyebrow}>ГЛАВНАЯ</Text>
        <Text style={styles.heading}>Тихая библиотека</Text>
        <Text style={styles.headingHint}>Найдите текст, автора или вернитесь к чтению.</Text>
      </View>
      {stats && <View style={styles.statsBadge}>
        <Text style={styles.statsValue}>{stats.pages} <Text style={styles.statsLabel}>авторов</Text></Text>
        <Text style={styles.statsCaption}>{stats.posts} публикаций</Text>
      </View>}
    </View>

    <View style={styles.searchPanel}>
      <View style={styles.searchTop}>
        <Text style={styles.searchLabel}>БЫСТРЫЙ ПОИСК</Text>
        <View style={styles.searchModes}>
          <Pressable accessibilityRole="button" onPress={() => { setMode('content'); setSearchError(null); }}
            style={[styles.modeButton, mode === 'content' && styles.modeSelected]}>
            <Search size={15} color={mode === 'content' ? palette.white : palette.forest} />
            <Text style={[styles.modeText, mode === 'content' && styles.modeTextSelected]}>По текстам</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => { setMode('number'); setSearchError(null); }}
            style={[styles.modeButton, mode === 'number' && styles.modeSelected]}>
            <Hash size={15} color={mode === 'number' ? palette.white : palette.forest} />
            <Text style={[styles.modeText, mode === 'number' && styles.modeTextSelected]}>По номеру</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          {mode === 'content' ? <Search size={19} color={palette.moss} /> : <Hash size={19} color={palette.moss} />}
          {mode === 'content' ?
            <BookInput value={textQuery} onChangeText={(value) => { setTextQuery(value); setResults(null); setSearchError(null); }}
              placeholder="Слово, тема или фраза" onSubmitEditing={() => void searchText()}
              returnKeyType="search" submitBehavior="blurAndSubmit" style={styles.searchInput} /> :
            <BookInput value={numberQuery} onChangeText={(value) => { setNumberQuery(value); setSearchError(null); }}
              placeholder="Номер страницы" keyboardType="numeric" onSubmitEditing={goToNumber}
              returnKeyType="go" submitBehavior="blurAndSubmit" style={styles.searchInput} />}
        </View>
        <ActionButton title={mode === 'content' ? 'Найти' : 'Открыть'} icon={ArrowRight}
          loading={searching && mode === 'content'} onPress={mode === 'content' ? () => void searchText() : goToNumber}
          style={styles.searchAction} />
      </View>
      <ErrorText message={searchError} />
      {mode === 'content' && results !== null && <View style={styles.results}>
        <Text style={styles.resultCount}>{results.length ? `Найдено публикаций: ${results.length}${results.length === 25 ? ' (первые 25)' : ''}` : 'Ничего не найдено. Попробуйте другой запрос.'}</Text>
        {results.map((hit) => <Pressable key={hit.postId}
          onPress={() => openPage(hit.pageNumber, hit.postId)}
          accessibilityRole="button" accessibilityLabel={`Открыть «${hit.title}», автор ${hit.displayName}`}
          style={({ pressed }) => [styles.resultItem, pressed && styles.pressed]}>
          <View style={styles.resultContent}>
            <Text style={styles.resultTitle}>{hit.title}</Text>
            <Text style={styles.resultBy}>{hit.displayName} · {pageNumber(hit.pageNumber)}</Text>
            <Text style={styles.resultExcerpt} numberOfLines={2}>{hit.excerpt}</Text>
          </View>
          <ChevronRight size={20} color={palette.forest} />
        </Pressable>)}
      </View>}
    </View>

    <View style={styles.historySection}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionTitleRow}><Clock3 size={19} color={palette.forest} /><Text style={styles.sectionTitle}>Недавно открытые</Text></View>
        {recent.length > 0 && !confirmClear &&
          <Pressable accessibilityRole="button" onPress={() => setConfirmClear(true)} style={styles.clearButton}>
            <Trash2 size={14} color={palette.muted} /><Text style={styles.clearText}>Очистить</Text>
          </Pressable>}
      </View>
      {confirmClear && <View style={styles.clearPrompt}>
        <Text style={styles.clearPromptText}>Удалить историю на этом устройстве?</Text>
        <Pressable accessibilityRole="button" onPress={() => void clearHistory()}><Text style={styles.confirmText}>Удалить</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setConfirmClear(false)}><Text style={styles.cancelText}>Отмена</Text></Pressable>
      </View>}
      {loadingHistory ? <ActivityIndicator color={palette.forest} style={{ marginVertical: 24 }} /> :
        recent.length === 0 ? <View style={styles.historyEmpty}>
          <BookOpen size={20} color={palette.moss} />
          <Text style={styles.historyEmptyText}>Открытые страницы появятся здесь. История хранится на этом устройстве.</Text>
        </View> :
        <View style={styles.historyList}>
          {recent.map((entry) => <Pressable key={entry.pageNumber}
            accessibilityRole="button" accessibilityLabel={`Открыть страницу ${entry.displayName}`}
            onPress={() => openPage(entry.pageNumber)}
            style={({ pressed }) => [styles.historyItem, pressed && styles.pressed]}>
            <View style={styles.historyNumber}><Text style={styles.historyNumberText}>{String(entry.pageNumber).padStart(4, '0')}</Text></View>
            <View style={styles.historyCopy}>
              <Text style={styles.historyName} numberOfLines={1}>{entry.displayName}</Text>
              <Text style={styles.historyMeta} numberOfLines={1}>{entry.postCount} публикаций · {openedAt(entry.openedAt)}</Text>
            </View>
            <ChevronRight size={20} color={palette.moss} />
          </Pressable>)}
        </View>}
    </View>

    <View style={styles.toolsSection}>
      <SectionLabel text="Быстрые действия" />
      <View style={[styles.tools, !wide && styles.toolsMobile]}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/write')} style={({ pressed }) => [styles.tool, pressed && styles.pressed]}>
          <Feather size={20} color={palette.forest} /><Text style={styles.toolText}>Новый текст</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void openRandom()} style={({ pressed }) => [styles.tool, pressed && styles.pressed]}>
          {busy ? <ActivityIndicator size="small" color={palette.forest} /> : <Shuffle size={20} color={palette.forest} />}
          <Text style={styles.toolText}>Случайная</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/messages')} style={({ pressed }) => [styles.tool, pressed && styles.pressed]}>
          <Mail size={20} color={palette.forest} /><Text style={styles.toolText}>Сообщения</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push(user ? '/(tabs)/me' : '/(tabs)/notebook')} style={({ pressed }) => [styles.tool, pressed && styles.pressed]}>
          <Bookmark size={20} color={palette.forest} /><Text style={styles.toolText}>{user ? 'Моя страница' : 'Блокнот'}</Text>
        </Pressable>
      </View>
    </View>

    <View style={styles.authorsSection}>
      <SectionLabel text="Авторы" trailing={`${authors.length} в подборке`} />
      <Text style={styles.authorsHint}>Выберите имя, чтобы открыть страницу автора.</Text>
      <ErrorText message={authorsError} />
      <View style={styles.authorCloud}>
        {(showAllAuthors ? authors : authors.slice(0, 12)).map((author) => <Pressable
          key={author.pageNumber} onPress={() => openPage(author.pageNumber)}
          accessibilityRole="button" accessibilityLabel={`Автор ${author.displayName}, страница ${author.pageNumber}`}
          style={({ pressed }) => [styles.authorItem, pressed && styles.pressed]}>
          <Text style={styles.authorName}>{author.displayName}</Text>
          <Text style={styles.authorNumber}>{pageNumber(author.pageNumber)}</Text>
        </Pressable>)}
      </View>
      {authors.length > 12 && <ActionButton variant="quiet" title={showAllAuthors ? 'Свернуть список' : `Показать всех (${authors.length})`}
        icon={ArrowRight} onPress={() => setShowAllAuthors((value) => !value)} style={styles.authorsToggle} />}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 25 },
  headingCopy: { flex: 1, minWidth: 210 },
  heading: { fontFamily: font.serif, color: palette.ink, fontSize: 34, lineHeight: 42, marginTop: 7 },
  headingHint: { color: palette.inkSoft, fontSize: 13, marginTop: 6, lineHeight: 20 },
  statsBadge: { backgroundColor: palette.sage, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 12, alignSelf: 'center' },
  statsValue: { fontFamily: font.serif, color: palette.forest, fontSize: 18 },
  statsLabel: { fontFamily: font.sans, fontSize: 12 },
  statsCaption: { color: palette.moss, fontSize: 11, marginTop: 3 },
  searchPanel: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 15, padding: 18 },
  searchTop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 9, marginBottom: 13 },
  searchLabel: { color: palette.moss, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  searchModes: { flexDirection: 'row', borderRadius: 9, backgroundColor: palette.paperAlt, padding: 3, gap: 3 },
  modeButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 7 },
  modeSelected: { backgroundColor: palette.forest },
  modeText: { color: palette.forest, fontSize: 12, fontWeight: '700' },
  modeTextSelected: { color: palette.white },
  searchRow: { flexDirection: 'row', gap: 9, alignItems: 'stretch' },
  searchField: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.paper, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  searchInput: { flex: 1, minWidth: 0, borderWidth: 0, backgroundColor: 'transparent', fontSize: 14, paddingHorizontal: 10 },
  searchAction: { minWidth: 105, paddingHorizontal: 12 },
  results: { marginTop: 17, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 13, gap: 8 },
  resultCount: { fontSize: 12, fontWeight: '700', color: palette.moss, marginBottom: 4 },
  resultItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.paper, borderRadius: 10, padding: 14, gap: 11 },
  resultContent: { flex: 1, minWidth: 0 },
  resultTitle: { fontFamily: font.serif, color: palette.ink, fontSize: 19 },
  resultBy: { color: palette.forest, fontSize: 11, fontWeight: '700', marginTop: 4 },
  resultExcerpt: { color: palette.inkSoft, fontSize: 12, lineHeight: 19, marginTop: 7 },
  historySection: { marginTop: 28 },
  sectionHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 13 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontFamily: font.serif, fontSize: 24, color: palette.ink },
  clearButton: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 7 },
  clearText: { fontSize: 11, color: palette.muted, fontWeight: '700' },
  clearPrompt: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, alignItems: 'center', backgroundColor: palette.accentLight, padding: 12, borderRadius: 9, marginBottom: 10 },
  clearPromptText: { color: palette.inkSoft, fontSize: 12, flex: 1, minWidth: 130 },
  confirmText: { color: palette.danger, fontSize: 12, fontWeight: '800' },
  cancelText: { color: palette.forest, fontSize: 12, fontWeight: '700' },
  historyList: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 13, overflow: 'hidden' },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 13, borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth },
  historyNumber: { minWidth: 70, paddingHorizontal: 7, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.sage, borderRadius: 8 },
  historyNumberText: { fontFamily: font.serif, fontSize: 16, color: palette.forest },
  historyCopy: { flex: 1, minWidth: 0 },
  historyName: { fontFamily: font.serif, fontSize: 19, color: palette.ink },
  historyMeta: { color: palette.muted, fontSize: 11.5, marginTop: 5 },
  historyEmpty: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 12, paddingHorizontal: 17, paddingVertical: 21, flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyEmptyText: { flex: 1, fontSize: 13, color: palette.muted, lineHeight: 20 },
  toolsSection: { marginTop: 33 },
  tools: { flexDirection: 'row', gap: 10 },
  toolsMobile: { flexWrap: 'wrap' },
  tool: { flex: 1, minWidth: 115, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 17, alignItems: 'center', gap: 10 },
  toolText: { color: palette.forest, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  authorsSection: { marginTop: 39, paddingTop: 26, borderTopWidth: 1, borderTopColor: palette.border },
  authorsHint: { color: palette.inkSoft, fontSize: 12.5, marginBottom: 14 },
  authorCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  authorItem: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10 },
  authorName: { color: palette.ink, fontFamily: font.serif, fontSize: 16 },
  authorNumber: { color: palette.muted, fontSize: 10, marginTop: 4 },
  authorsToggle: { alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: 8 },
  pressed: { opacity: 0.68, backgroundColor: palette.sage },
});
