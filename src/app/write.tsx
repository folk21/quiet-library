import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Feather, Trash2, X } from 'lucide-react-native';
import { ActionButton, BookInput, ErrorText, Screen } from '../components/Ui';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { common, font, palette } from '../lib/theme';

export default function ComposeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const postId = id ? Number(id) : null;
  const { token, user, loading: sessionLoading } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(!!postId);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!postId || !user) return;
    let active = true;
    api.getPage(user.pageNumber).then((page) => {
      const post = page.posts.find((item) => item.id === postId);
      if (!active) return;
      if (post) { setTitle(post.title); setContent(post.content); }
      else setError('Публикация не найдена.');
    }).catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [postId, user]));

  async function save() {
    if (!token) return;
    if (!title.trim() || !content.trim()) { setError('Добавьте заголовок и текст.'); return; }
    setBusy(true); setError(null);
    try {
      if (postId) await api.updatePost(token, postId, title, content);
      else await api.createPost(token, title, content);
      router.replace('/(tabs)/me');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось сохранить текст.'); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!token || !postId) return;
    setBusy(true);
    try { await api.deletePost(token, postId); setDeleting(false); router.replace('/(tabs)/me'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось удалить.'); }
    finally { setBusy(false); }
  }

  return <Screen>
    <View style={styles.container}>
      <ActionButton title="Вернуться без сохранения" icon={ArrowLeft} variant="quiet" onPress={() => router.back()} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
      {sessionLoading || loading ? <ActivityIndicator color={palette.forest} style={{ marginTop: 50 }} /> : !user ?
        <View style={{ marginTop: 50 }}><Text style={styles.title}>Чтобы писать, нужно войти.</Text><ActionButton title="Войти" onPress={() => router.push('/auth')} style={{ marginTop: 20 }} /></View> : <>
          <View style={styles.top}><Feather size={22} color={palette.accent} strokeWidth={1.4} /><Text style={common.eyebrow}>{postId ? 'РЕДАКТИРОВАНИЕ ЗАПИСИ' : 'НОВАЯ СТРАНИЦА В ВАШЕЙ ИСТОРИИ'}</Text></View>
          <Text style={styles.title}>{postId ? 'Вернуться к словам.' : 'Начните с мысли.'}</Text>
          <Text style={styles.intro}>Текст не должен быть идеальным. Иногда самые важные мысли звучат тихо.</Text>
          <View style={styles.form}>
            <Text style={styles.label}>ЗАГОЛОВОК</Text><BookInput value={title} onChangeText={setTitle} placeholder="О чём эта запись?" style={styles.titleInput} />
            <Text style={[styles.label, { marginTop: 17 }]}>ВАШ ТЕКСТ</Text>
            <BookInput multiline value={content} onChangeText={setContent} placeholder="Здесь можно немного замедлиться и просто писать..." style={styles.contentInput} />
            <Text style={styles.helper}>Обычный текст. Для нового абзаца оставьте пустую строку.</Text>
            <ErrorText message={error} />
            <View style={styles.actions}>
              {postId && <ActionButton title="Удалить" icon={Trash2} variant="quiet" onPress={() => setDeleting(true)} />}
              <ActionButton title="Опубликовать" icon={ArrowRight} loading={busy} onPress={save} />
            </View>
          </View>
        </>}
    </View>
    <Modal visible={deleting} transparent animationType="fade" onRequestClose={() => setDeleting(false)}>
      <View style={styles.modalOverlay}><View style={styles.modalCard}>
        <Pressable style={{ alignSelf: 'flex-end' }} onPress={() => setDeleting(false)}><X size={21} color={palette.ink} /></Pressable>
        <Text style={styles.modalTitle}>Удалить запись?</Text><Text style={styles.modalText}>После удаления этот текст нельзя будет восстановить.</Text>
        <View style={styles.actions}><ActionButton title="Отмена" variant="secondary" onPress={() => setDeleting(false)} /><ActionButton title="Да, удалить" icon={Trash2} loading={busy} onPress={remove} /></View>
      </View></View>
    </Modal>
  </Screen>;
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 730, alignSelf: 'center' },
  top: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 34 },
  title: { fontFamily: font.serif, fontSize: 41, lineHeight: 49, color: palette.ink, marginTop: 15 },
  intro: { fontSize: 14, lineHeight: 23, color: palette.inkSoft, marginTop: 12, marginBottom: 27 },
  form: { backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 16, padding: 26 },
  label: { color: palette.inkSoft, fontWeight: '800', fontSize: 10, letterSpacing: 1.8, marginBottom: 10 },
  titleInput: { fontFamily: font.serif, fontSize: 22, paddingVertical: 16 },
  contentInput: { fontFamily: font.serif, fontSize: 16, lineHeight: 27, minHeight: 330, textAlignVertical: 'top' },
  helper: { color: palette.muted, fontSize: 11.5, marginTop: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,37,31,0.52)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: palette.paper, borderRadius: 16, padding: 24, maxWidth: 430, alignSelf: 'center', width: '100%' },
  modalTitle: { fontFamily: font.serif, fontSize: 26, color: palette.ink },
  modalText: { fontSize: 13.5, color: palette.inkSoft, lineHeight: 22, marginTop: 12 },
});
