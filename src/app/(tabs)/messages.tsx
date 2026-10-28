import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, Mail, PenLine } from 'lucide-react-native';
import { ActionButton, EmptyState, ErrorText, Screen, SectionLabel } from '../../components/Ui';
import { api } from '../../lib/api';
import { MESSAGE_KINDS, messageKind } from '../../lib/messageKinds';
import { useSession } from '../../lib/session';
import { common, font, palette, pageNumber, shortDate } from '../../lib/theme';
import type { MessagePreferences, MessageSummary } from '../../lib/types';

type ViewMode = 'inbox' | 'sent' | 'settings';

export default function MessagesScreen() {
  const { token, user, loading: sessionLoading } = useSession();
  const [mode, setMode] = useState<ViewMode>('inbox');
  const [inbox, setInbox] = useState<MessageSummary[]>([]);
  const [sent, setSent] = useState<MessageSummary[]>([]);
  const [preferences, setPreferences] = useState<MessagePreferences>({ simple: true, thought: true, letter: true });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!token) { setInbox([]); setSent([]); return; }
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([api.inbox(token), api.sent(token), api.messagePreferences(token)])
      .then(([incoming, outgoing, settings]) => {
        if (!active) return;
        setInbox(incoming);
        setSent(outgoing);
        setPreferences(settings);
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить сообщения.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]));

  async function savePreferences() {
    if (!token || saving) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      setPreferences(await api.updateMessagePreferences(token, preferences));
      setNotice('Настройки сохранены.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить настройки.');
    } finally { setSaving(false); }
  }

  if (sessionLoading) return <Screen><ActivityIndicator color={palette.forest} /></Screen>;

  if (!user) return <Screen>
    <View style={styles.head}>
      <Text style={common.eyebrow}>ЛИЧНАЯ ПЕРЕПИСКА</Text>
      <Text style={styles.heading}>Сообщения</Text>
      <Text style={styles.subtitle}>Пишите другим авторам или отправляйте сообщения себе. Переписка видна только участникам.</Text>
    </View>
    <EmptyState title="Нужно войти" message="Войдите в аккаунт, чтобы читать и отправлять личные сообщения." action="Войти" onAction={() => router.push('/auth')} />
  </Screen>;

  const items = mode === 'inbox' ? inbox : sent;
  const unread = inbox.filter((message) => !message.readAt).length;

  return <Screen>
    <View style={styles.head}>
      <Text style={common.eyebrow}>ЛИЧНАЯ ПЕРЕПИСКА</Text>
      <Text style={styles.heading}>Сообщения</Text>
      <Text style={styles.subtitle}>Входящие, отправленные и настройки приёма сообщений.</Text>
      <ActionButton title="Написать сообщение" icon={PenLine} onPress={() => router.push('/message/compose')} style={{ alignSelf: 'flex-start', marginTop: 13 }} />
    </View>

    <View style={styles.nav}>
      {([
        ['inbox', `Входящие${unread ? ` · ${unread} новых` : ''}`],
        ['sent', 'Отправленные'],
        ['settings', 'Настройки'],
      ] as [ViewMode, string][]).map(([tab, title]) => <Pressable key={tab} onPress={() => { setMode(tab); setNotice(null); }}
        accessibilityRole="button" style={[styles.navItem, mode === tab && styles.navItemSelected]}>
        <Text style={[styles.navText, mode === tab && styles.navTextSelected]}>{title}</Text>
      </Pressable>)}
    </View>
    <ErrorText message={error} />
    {notice && <Text style={styles.notice}>{notice}</Text>}
    {loading ? <ActivityIndicator color={palette.forest} style={{ marginTop: 35 }} /> :
      mode === 'settings' ? <View style={styles.settings}>
        <SectionLabel text="Какие сообщения мне можно отправлять" />
        <Text style={styles.settingsDescription}>Выберите разрешённые типы. Ограничения действуют для других авторов. Себе можно отправлять любой тип.</Text>
        {MESSAGE_KINDS.map((item) => <View key={item.kind} style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingHint}>{item.hint} · от {item.minimum} символов</Text>
          </View>
          <Switch value={preferences[item.kind]} onValueChange={(enabled) => { setNotice(null); setPreferences((current) => ({ ...current, [item.kind]: enabled })); }}
            trackColor={{ false: palette.border, true: palette.sage }} thumbColor={preferences[item.kind] ? palette.forest : palette.muted}
            accessibilityLabel={`Принимать сообщения типа «${item.title}»`} />
        </View>)}
        <ActionButton title="Сохранить настройки" onPress={() => void savePreferences()} loading={saving} style={{ alignSelf: 'flex-start', marginTop: 24 }} />
      </View> : <View style={styles.messageList}>
        <SectionLabel text={mode === 'inbox' ? 'Входящие сообщения' : 'Отправленные сообщения'} trailing={`${items.length} сообщений`} />
        {items.length === 0 ? <EmptyState title={mode === 'inbox' ? 'Входящих пока нет' : 'Вы ещё не отправляли сообщения'}
          message="Начните переписку с любым автором или отправьте сообщение себе."
          action="Написать сообщение" onAction={() => router.push('/message/compose')} /> :
          items.map((message) => <Pressable key={message.id}
            onPress={() => router.push({ pathname: '/message/[id]', params: { id: String(message.id) } })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.messageCard, pressed && { opacity: 0.78 }]}>
            <View style={styles.cardTop}>
              <View style={styles.metaGroup}>
                <Mail color={palette.accent} size={15} strokeWidth={1.5} />
                <Text style={styles.kind}>{messageKind(message.kind).title}</Text>
                {mode === 'inbox' && !message.readAt && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.date}>{shortDate(message.createdAt)}</Text>
            </View>
            <Text style={styles.author}>{mode === 'inbox' ? message.senderName : message.recipientName}
              <Text style={styles.number}>  {pageNumber(mode === 'inbox' ? message.senderPageNumber : message.recipientPageNumber)}</Text>
            </Text>
            {!!message.subject && <Text style={styles.subject}>{message.subject}</Text>}
            <Text style={styles.preview} numberOfLines={2}>{message.preview}</Text>
            <View style={styles.openRow}><Text style={styles.openText}>Открыть</Text><ArrowRight color={palette.forest} size={15} /></View>
          </Pressable>)}
      </View>}
  </Screen>;
}

const styles = StyleSheet.create({
  head: { paddingTop: 5, paddingBottom: 19 },
  heading: { fontFamily: font.serif, fontSize: 34, lineHeight: 43, color: palette.ink, marginTop: 9 },
  subtitle: { color: palette.inkSoft, fontSize: 13.5, lineHeight: 22, marginTop: 6, maxWidth: 600 },
  nav: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderBottomColor: palette.border, borderBottomWidth: 1, paddingBottom: 13, marginBottom: 17 },
  navItem: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border },
  navItemSelected: { backgroundColor: palette.forest, borderColor: palette.forest },
  navText: { color: palette.forest, fontWeight: '700', fontSize: 12.5 },
  navTextSelected: { color: palette.white },
  notice: { color: palette.forest, fontSize: 13, marginBottom: 15 },
  settings: { width: '100%', maxWidth: 700, alignSelf: 'center', paddingBottom: 35 },
  settingsDescription: { color: palette.inkSoft, lineHeight: 23, fontSize: 13.5, marginBottom: 15 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: palette.border, paddingVertical: 23, gap: 16 },
  settingInfo: { flex: 1 },
  settingTitle: { fontFamily: font.serif, fontSize: 21, color: palette.ink },
  settingHint: { fontSize: 12, lineHeight: 20, color: palette.inkSoft, marginTop: 6 },
  messageList: { width: '100%', maxWidth: 780, alignSelf: 'center', paddingBottom: 35 },
  messageCard: { backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 14, padding: 21, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  metaGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kind: { color: palette.moss, fontWeight: '700', fontSize: 11 },
  unreadDot: { width: 7, height: 7, backgroundColor: palette.accent, borderRadius: 4 },
  date: { color: palette.muted, fontSize: 11 },
  author: { fontFamily: font.serif, color: palette.ink, fontSize: 22, marginTop: 14 },
  number: { fontFamily: font.sans, color: palette.moss, fontSize: 12 },
  subject: { fontSize: 14, fontWeight: '700', color: palette.inkSoft, marginTop: 9 },
  preview: { fontSize: 13.5, lineHeight: 22, color: palette.inkSoft, marginTop: 10 },
  openRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
  openText: { color: palette.forest, fontSize: 12, fontWeight: '700' },
});
