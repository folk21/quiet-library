import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Hash, Mail, PenLine } from 'lucide-react-native';
import { ActionButton, BookInput, ErrorText, Screen } from '../../components/Ui';
import { api } from '../../lib/api';
import { characterCount, MESSAGE_KINDS, messageKind } from '../../lib/messageKinds';
import { useSession } from '../../lib/session';
import { common, font, palette, pageNumber } from '../../lib/theme';
import type { MessageKind, MessageRecipientOptions } from '../../lib/types';

export default function ComposeMessageScreen() {
  const { to } = useLocalSearchParams<{ to?: string }>();
  const { token, user, loading: sessionLoading } = useSession();
  const [number, setNumber] = useState(to ?? '');
  const [recipient, setRecipient] = useState<MessageRecipientOptions | null>(null);
  const [kind, setKind] = useState<MessageKind>('simple');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!to) return;
    let active = true;
    api.messageOptions(Number(to))
      .then((result) => { if (active) { setRecipient(result); setError(null); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Автор не найден.'); });
    return () => { active = false; };
  }, [to]);

  async function lookupRecipient() {
    const value = number.trim();
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
      setRecipient(null); setError('Введите номер страницы цифрами.'); return;
    }
    setLookupBusy(true); setError(null); setRecipient(null);
    try { setRecipient(await api.messageOptions(Number(value))); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Автор не найден.'); }
    finally { setLookupBusy(false); }
  }

  const self = !!user && recipient?.pageNumber === user.pageNumber;
  const permitted = !!recipient && (self || recipient.acceptedTypes[kind]);
  const minimum = messageKind(kind).minimum;
  const length = characterCount(content);
  const canSend = !!token && permitted && length >= minimum && length <= 30000 && (kind !== 'letter' || subject.length <= 140);

  async function send() {
    if (!token || !recipient || !canSend || busy) return;
    setBusy(true); setError(null);
    try {
      const result = await api.sendMessage(token, {
        recipientPageNumber: recipient.pageNumber,
        kind,
        subject: kind === 'letter' ? subject : '',
        content,
      });
      router.replace({ pathname: '/message/[id]', params: { id: String(result.id) } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось отправить сообщение.');
    } finally { setBusy(false); }
  }

  if (sessionLoading) return <Screen><ActivityIndicator color={palette.forest} /></Screen>;
  if (!user) return <Screen>
    <ActionButton title="Назад" icon={ArrowLeft} variant="quiet" onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
    <Text style={styles.heading}>Написать сообщение</Text>
    <Text style={styles.description}>Для отправки личных сообщений нужен аккаунт.</Text>
    <ActionButton title="Войти" icon={ArrowRight} onPress={() => router.push({ pathname: '/auth', params: to ? { to } : {} })} style={{ alignSelf: 'flex-start', marginTop: 20 }} />
  </Screen>;

  return <Screen>
    <View style={styles.container}>
      <ActionButton title="Вернуться" icon={ArrowLeft} variant="quiet" onPress={() => router.back()} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
      <View style={styles.eyebrowRow}><PenLine size={18} color={palette.accent} /><Text style={common.eyebrow}>ЛИЧНОЕ СООБЩЕНИЕ</Text></View>
      <Text style={styles.heading}>Новое сообщение</Text>
      <Text style={styles.description}>Сообщения видны только отправителю и адресату. Можно написать самому себе.</Text>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>НОМЕР СТРАНИЦЫ АДРЕСАТА</Text>
        <View style={styles.recipientRow}>
          <View style={styles.numberInput}><Hash size={18} color={palette.moss} />
            <BookInput value={number} onChangeText={(value) => { setNumber(value); setRecipient(null); setError(null); }} placeholder="Например, 0056"
              keyboardType="numeric" onSubmitEditing={() => void lookupRecipient()} returnKeyType="search"
              submitBehavior="blurAndSubmit" style={styles.inputText} />
          </View>
          <ActionButton title="Найти" variant="secondary" loading={lookupBusy} onPress={() => void lookupRecipient()} />
        </View>
        {recipient && <View style={styles.recipientCard}>
          <Mail size={17} color={palette.forest} />
          <View style={{ flex: 1 }}>
            <Text style={styles.recipientName}>{recipient.displayName} · {pageNumber(recipient.pageNumber)}</Text>
            <Text style={styles.recipientCaption}>{self ? 'Сообщение самому себе' : recipient.isDemo ? 'Демонстрационный автор не сможет ответить' : 'Адресат найден'}</Text>
          </View>
        </View>}
        <ErrorText message={error} />
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>ТИП СООБЩЕНИЯ</Text>
        <View style={styles.types}>
          {MESSAGE_KINDS.map((item) => {
            const allowed = !recipient || self || recipient.acceptedTypes[item.kind];
            return <Pressable key={item.kind} disabled={!allowed}
              onPress={() => setKind(item.kind)} accessibilityRole="button"
              style={[styles.typeItem, kind === item.kind && styles.typeSelected, !allowed && styles.typeDisabled]}>
              <Text style={[styles.typeTitle, kind === item.kind && styles.typeTitleSelected]}>{item.title}</Text>
              <Text style={[styles.typeHint, kind === item.kind && styles.typeHintSelected]}>От {item.minimum} символов</Text>
              {!allowed && <Text style={styles.typeBlocked}>Не принимает</Text>}
            </Pressable>;
          })}
        </View>
        {recipient && !self && !Object.values(recipient.acceptedTypes).some(Boolean) &&
          <Text style={styles.warning}>Этот автор сейчас не принимает личные сообщения.</Text>}
        {kind === 'letter' && <View style={styles.subjectBlock}>
          <Text style={styles.fieldLabel}>ТЕМА ПИСЬМА (НЕОБЯЗАТЕЛЬНО)</Text>
          <BookInput value={subject} onChangeText={setSubject} placeholder="Тема письма" style={styles.subjectInput} />
        </View>}
        <View style={styles.contentBlock}>
          <Text style={styles.fieldLabel}>ВАШ ТЕКСТ</Text>
          <BookInput value={content} onChangeText={setContent} multiline
            placeholder={kind === 'letter' ? 'Напишите письмо...' : kind === 'thought' ? 'Опишите свою мысль...' : 'Напишите сообщение...'}
            style={styles.contentInput} />
          <View style={styles.counterRow}>
            <Text style={styles.counterHint}>Минимум {minimum} символов. Максимум 30 000.</Text>
            <Text style={[styles.counter, length >= minimum ? styles.counterReady : styles.counterShort]}>{length} / {minimum}</Text>
          </View>
          {!permitted && recipient && <Text style={styles.warning}>Адресат не принимает выбранный тип сообщения.</Text>}
        </View>
        <View style={styles.actions}>
          <ActionButton title="Отправить сообщение" icon={ArrowRight} onPress={() => void send()} disabled={!canSend} loading={busy} />
        </View>
      </View>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 800, alignSelf: 'center' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 25 },
  heading: { fontFamily: font.serif, fontSize: 41, color: palette.ink, marginTop: 15 },
  description: { color: palette.inkSoft, fontSize: 14, lineHeight: 23, marginTop: 12, marginBottom: 24 },
  card: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 23, marginBottom: 16 },
  fieldLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '800', color: palette.moss, marginBottom: 12 },
  recipientRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  numberInput: { flex: 1, minWidth: 175, borderWidth: 1, borderColor: palette.border, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingLeft: 13, backgroundColor: palette.paper },
  inputText: { flex: 1, borderWidth: 0, backgroundColor: 'transparent' },
  recipientCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 11, backgroundColor: palette.sage, marginTop: 14 },
  recipientName: { color: palette.ink, fontWeight: '700', fontSize: 14 },
  recipientCaption: { color: palette.forest, fontSize: 12, marginTop: 5 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  typeItem: { flex: 1, minWidth: 155, borderWidth: 1, borderColor: palette.border, borderRadius: 11, padding: 15, backgroundColor: palette.paper },
  typeSelected: { backgroundColor: palette.forest, borderColor: palette.forest },
  typeDisabled: { opacity: 0.38 },
  typeTitle: { fontFamily: font.serif, fontSize: 18, color: palette.ink },
  typeTitleSelected: { color: palette.white },
  typeHint: { color: palette.moss, fontSize: 11, marginTop: 8 },
  typeHintSelected: { color: palette.card },
  typeBlocked: { color: palette.inkSoft, marginTop: 6, fontSize: 10 },
  subjectBlock: { marginTop: 24 },
  subjectInput: { borderColor: palette.border },
  contentBlock: { marginTop: 27 },
  contentInput: { fontFamily: font.serif, fontSize: 16, lineHeight: 27, minHeight: 310, textAlignVertical: 'top' },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 12 },
  counterHint: { color: palette.muted, fontSize: 11.5 },
  counter: { fontSize: 12, fontWeight: '700' },
  counterReady: { color: palette.forest },
  counterShort: { color: palette.accent },
  warning: { color: palette.accent, fontSize: 12.5, marginTop: 14 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 23 },
});
