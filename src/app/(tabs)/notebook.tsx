import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, LockKeyhole, Pencil, Trash2, X } from 'lucide-react-native';
import { ActionButton, BookInput, EmptyState, ErrorText, Screen, SectionLabel } from '../../components/Ui';
import { api } from '../../lib/api';
import { useSession } from '../../lib/session';
import { common, font, palette, pageNumber } from '../../lib/theme';
import type { Bookmark as BookmarkEntry } from '../../lib/types';

export default function NotebookScreen() {
  const { token, user, loading: sessionLoading } = useSession();
  const [entries, setEntries] = useState<BookmarkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BookmarkEntry | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const { width } = useWindowDimensions();

  const load = useCallback(async (currentToken: string) => {
    setLoading(true); setError(null);
    try { setEntries(await api.notebook(currentToken)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось открыть блокнот.'); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { if (token) void load(token); else setEntries([]); }, [token, load]));

  function edit(entry: BookmarkEntry) { setEditing(entry); setNote(entry.note); }

  async function save() {
    if (!token || !editing) return;
    setSaving(true); setError(null);
    try { await api.saveBookmark(token, editing.pageNumber, note); setEditing(null); await load(token); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось сохранить заметку.'); }
    finally { setSaving(false); }
  }

  async function remove(entry: BookmarkEntry) {
    if (!token) return;
    try { await api.removeBookmark(token, entry.pageNumber); await load(token); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось удалить страницу.'); }
  }

  return <Screen>
    <View style={styles.head}>
      <Text style={common.eyebrow}>ЛИЧНАЯ КАРТОТЕКА</Text>
      <Text style={styles.heading}>Мой блокнот<Text style={styles.dot}>.</Text></Text>
      <Text style={styles.subtitle}>Особенные страницы, к которым хочется возвращаться. Только вы видите свои заметки.</Text>
      <View style={styles.privateBadge}><LockKeyhole size={14} color={palette.forest} /><Text style={styles.privateText}>ДОСТУПЕН ТОЛЬКО ВАМ</Text></View>
    </View>
    {sessionLoading ? <ActivityIndicator color={palette.forest} /> : !user ?
      <EmptyState privatePage title="Здесь будет ваш блокнот" message="Сохраняйте страницы интересных авторов и личные мысли о них. Никто другой не увидит ваши заметки." action="Войти в библиотеку" onAction={() => router.push('/auth')} /> :
      <View>
        <SectionLabel text="Сохранённые страницы" trailing={`${entries.length} в картотеке`} />
        <ErrorText message={error} />
        {loading ? <ActivityIndicator color={palette.forest} style={{ marginTop: 30 }} /> : entries.length === 0 ?
          <EmptyState title="Пока ни одной закладки" message="Откройте случайную страницу в каталоге и сохраните автора, чьи тексты вам близки." action="Пойти исследовать" onAction={() => router.push('/')} /> :
          <View style={[styles.list, width > 780 && styles.listWide]}>
            {entries.map((entry, index) => <View key={entry.pageNumber} style={[styles.entry, width > 780 && { width: '48.8%' }]}>
              <View style={styles.entryMeta}><Text style={styles.entryNumber}>{pageNumber(entry.pageNumber)}</Text><Text style={styles.entryIndex}>КАРТОЧКА {String(index + 1).padStart(2, '0')}</Text></View>
              <Text style={styles.entryName}>{entry.displayName}</Text>
              <Text style={styles.entryBio} numberOfLines={2}>{entry.bio}</Text>
              <View style={styles.noteBox}><Text style={styles.noteLabel}>МОЯ ЗАМЕТКА</Text><Text style={styles.noteText}>{entry.note || 'Пока без заметки. Добавьте пару слов, чтобы не забыть, почему сохранили страницу.'}</Text></View>
              <View style={styles.entryActions}>
                <Pressable onPress={() => router.push({ pathname: '/page/[number]', params: { number: String(entry.pageNumber) } })} style={styles.entryAction}><ArrowRight size={16} color={palette.forest} /><Text style={styles.entryActionLabel}>Читать</Text></Pressable>
                <Pressable onPress={() => edit(entry)} style={styles.entryAction}><Pencil size={14} color={palette.forest} /><Text style={styles.entryActionLabel}>Заметка</Text></Pressable>
                <Pressable onPress={() => remove(entry)} style={styles.entryAction} accessibilityLabel="Удалить из блокнота"><Trash2 size={15} color={palette.muted} /></Pressable>
              </View>
            </View>)}
          </View>}
      </View>}
    <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalTop}><View><Text style={common.eyebrow}>ЛИЧНАЯ ЗАМЕТКА</Text><Text style={styles.modalTitle}>{editing && pageNumber(editing.pageNumber)}</Text></View><Pressable onPress={() => setEditing(null)}><X size={23} color={palette.ink} /></Pressable></View>
          <Text style={styles.modalDescription}>Эту запись видите только вы. Что важного вы нашли на этой странице?</Text>
          <BookInput multiline value={note} onChangeText={setNote} placeholder="Например: пишет о старых городах и хороших книгах..." style={{ minHeight: 135 }} />
          <ErrorText message={error} />
          <View style={styles.modalActions}><ActionButton title="Отмена" variant="quiet" onPress={() => setEditing(null)} /><ActionButton title="Сохранить заметку" loading={saving} onPress={save} /></View>
        </View>
      </View>
    </Modal>
  </Screen>;
}

const styles = StyleSheet.create({
  head: { borderBottomColor: palette.border, borderBottomWidth: 1, paddingTop: 10, paddingBottom: 36, marginBottom: 28 },
  heading: { fontFamily: font.serif, fontSize: 45, lineHeight: 57, color: palette.ink, marginTop: 12 },
  dot: { color: palette.accent },
  subtitle: { fontSize: 14.5, lineHeight: 25, color: palette.inkSoft, marginTop: 11, maxWidth: 540 },
  privateBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: palette.sage, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 8, marginTop: 21 },
  privateText: { color: palette.forest, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  list: { gap: 14 },
  listWide: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  entry: { backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 15, padding: 22, minWidth: 0 },
  entryMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryNumber: { color: palette.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  entryIndex: { color: palette.muted, fontSize: 9, letterSpacing: 1.4 },
  entryName: { fontFamily: font.serif, color: palette.ink, fontSize: 25, marginTop: 15 },
  entryBio: { color: palette.inkSoft, lineHeight: 21, fontSize: 13, marginTop: 6, minHeight: 42 },
  noteBox: { backgroundColor: palette.paper, borderRadius: 10, padding: 14, marginTop: 19, minHeight: 99 },
  noteLabel: { color: palette.accent, fontSize: 9, letterSpacing: 1.3, fontWeight: '800' },
  noteText: { color: palette.inkSoft, fontSize: 12.5, lineHeight: 20, marginTop: 8 },
  entryActions: { flexDirection: 'row', gap: 18, marginTop: 17, alignItems: 'center', flexWrap: 'wrap' },
  entryAction: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 5 },
  entryActionLabel: { color: palette.forest, fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,37,31,0.52)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: palette.paper, borderRadius: 17, padding: 24, maxWidth: 520, width: '100%', alignSelf: 'center' },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontFamily: font.serif, color: palette.ink, fontSize: 26, marginTop: 7 },
  modalDescription: { color: palette.inkSoft, fontSize: 13, lineHeight: 22, marginVertical: 20 },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
});
