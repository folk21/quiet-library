import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react-native';
import { ActionButton, EmptyState, ErrorText, Screen } from '../../components/Ui';
import { api } from '../../lib/api';
import { messageKind } from '../../lib/messageKinds';
import { useSession } from '../../lib/session';
import { common, font, palette, pageNumber, shortDate } from '../../lib/theme';
import type { MessageDetails } from '../../lib/types';

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const messageId = Number(id);
  const { token, user, loading: sessionLoading } = useSession();
  const [message, setMessage] = useState<MessageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!token || !Number.isSafeInteger(messageId)) { setLoading(false); return; }
    let active = true;
    setLoading(true); setError(null);
    api.getMessage(token, messageId).then(async (result) => {
      if (!active) return;
      setMessage(result);
      if (user?.pageNumber === result.recipientPageNumber && !result.readAt) {
        try {
          await api.markMessageRead(token, messageId);
          if (active) setMessage({ ...result, readAt: new Date().toISOString() });
        } catch {}
      }
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Не удалось открыть сообщение.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, messageId, user?.pageNumber]));

  if (sessionLoading || loading) return <Screen><ActivityIndicator color={palette.forest} style={{ marginTop: 60 }} /></Screen>;

  if (!token) return <Screen>
    <EmptyState title="Нужно войти" message="Личные сообщения могут читать только участники переписки." action="Войти" onAction={() => router.push('/auth')} />
  </Screen>;

  return <Screen>
    <View style={styles.container}>
      <ActionButton title="К сообщениям" icon={ArrowLeft} variant="quiet" onPress={() => router.replace('/(tabs)/messages')} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
      {!message ? <View style={{ marginTop: 30 }}><ErrorText message={error || 'Сообщение не найдено.'} /></View> : <>
        <View style={styles.head}>
          <View style={styles.typeRow}><Mail size={18} color={palette.accent} /><Text style={common.eyebrow}>{messageKind(message.kind).title.toUpperCase()}</Text></View>
          <Text style={styles.heading}>{message.subject || messageKind(message.kind).title}</Text>
          <Text style={styles.date}>{shortDate(message.createdAt)}</Text>
          <View style={styles.people}>
            <Text style={styles.personLabel}>ОТ</Text>
            <Pressable onPress={() => router.push({ pathname: '/page/[number]', params: { number: String(message.senderPageNumber) } })} style={styles.personLink}>
              <Text style={styles.person}>{message.senderName} · {pageNumber(message.senderPageNumber)}</Text>
              <ArrowRight size={14} color={palette.forest} />
            </Pressable>
            <Text style={[styles.personLabel, { marginTop: 16 }]}>КОМУ</Text>
            <Pressable onPress={() => router.push({ pathname: '/page/[number]', params: { number: String(message.recipientPageNumber) } })} style={styles.personLink}>
              <Text style={styles.person}>{message.recipientName} · {pageNumber(message.recipientPageNumber)}</Text>
              <ArrowRight size={14} color={palette.forest} />
            </Pressable>
          </View>
        </View>
        <View style={styles.content}>
          {message.content.split(/\n\s*\n/).map((paragraph, index) =>
            <Text key={index} style={styles.paragraph}>{paragraph}</Text>)}
        </View>
        <View style={styles.actions}>
          <ActionButton
            title={user?.pageNumber === message.senderPageNumber && message.senderPageNumber !== message.recipientPageNumber ? 'Написать ещё' : 'Написать ответ'}
            icon={ArrowRight} variant="secondary"
            onPress={() => router.push({ pathname: '/message/compose', params: {
              to: String(user?.pageNumber === message.senderPageNumber ? message.recipientPageNumber : message.senderPageNumber),
            } })} />
        </View>
      </>}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  head: { borderBottomWidth: 1, borderBottomColor: palette.border, marginTop: 19, paddingBottom: 30 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heading: { fontFamily: font.serif, color: palette.ink, fontSize: 36, lineHeight: 45, marginTop: 18 },
  date: { color: palette.muted, fontSize: 12, marginTop: 13 },
  people: { marginTop: 26, padding: 20, backgroundColor: palette.sage, borderRadius: 13 },
  personLabel: { color: palette.moss, fontWeight: '800', letterSpacing: 1.5, fontSize: 10 },
  personLink: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 7 },
  person: { color: palette.forest, fontSize: 14, fontWeight: '700' },
  content: { paddingTop: 32, paddingBottom: 20 },
  paragraph: { fontFamily: font.serif, fontSize: 17, lineHeight: 30, color: palette.inkSoft, marginBottom: 19 },
  actions: { paddingVertical: 24, borderTopWidth: 1, borderColor: palette.border, flexDirection: 'row', justifyContent: 'flex-end' },
});
