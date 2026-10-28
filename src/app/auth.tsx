import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, Feather } from 'lucide-react-native';
import { ActionButton, BookInput, ErrorText, Screen } from '../components/Ui';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { common, font, palette } from '../lib/theme';

export default function AuthScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [isRegister, setIsRegister] = useState(mode === 'register');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useSession();

  async function submit() {
    setBusy(true); setError(null);
    try {
      const response = isRegister ? await api.register({ displayName, email, password }) : await api.login({ email, password });
      await signIn(response);
      router.replace('/(tabs)/me');
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось войти.'); }
    finally { setBusy(false); }
  }

  return <Screen>
    <View style={styles.container}>
      <ActionButton title="Вернуться к каталогу" icon={ArrowLeft} variant="quiet" onPress={() => router.back()} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
      <View style={styles.badge}><Feather size={23} color={palette.forest} strokeWidth={1.45} /></View>
      <Text style={common.eyebrow}>{isRegister ? 'ВАША ИСТОРИЯ НАЧИНАЕТСЯ ЗДЕСЬ' : 'С ВОЗВРАЩЕНИЕМ'}</Text>
      <Text style={styles.title}>{isRegister ? 'Займите место\nна полке.' : 'Снова среди\nстраниц.'}</Text>
      <Text style={styles.subtitle}>{isRegister ? 'Создайте свою страницу и начните писать. Номер останется с вами навсегда.' : 'Войдите, чтобы продолжить писать и открыть личный блокнот.'}</Text>
      <View style={styles.form}>
        {isRegister && <View style={styles.field}><Text style={styles.label}>ИМЯ АВТОРА</Text><BookInput value={displayName} onChangeText={setDisplayName} placeholder="Как вас называть?" autoCapitalize="words" /></View>}
        <View style={styles.field}><Text style={styles.label}>ЭЛЕКТРОННАЯ ПОЧТА</Text><BookInput value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" /></View>
        <View style={styles.field}><Text style={styles.label}>ПАРОЛЬ</Text><BookInput value={password} onChangeText={setPassword} placeholder="Не менее 8 символов" secureTextEntry /></View>
        <ErrorText message={error} />
        <ActionButton title={isRegister ? 'Создать страницу' : 'Войти в библиотеку'} icon={ArrowRight} onPress={submit} loading={busy} style={{ marginTop: 12 }} />
        <Text style={styles.switchText}>{isRegister ? 'Уже есть страница?' : 'Ещё нет страницы?'}{' '}
          <Text onPress={() => { setIsRegister(!isRegister); setError(null); }} style={styles.switchLink}>{isRegister ? 'Войти' : 'Зарегистрироваться'}</Text>
        </Text>
      </View>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 460, alignSelf: 'center', paddingTop: 5 },
  badge: { width: 56, height: 56, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center', borderRadius: 16, marginTop: 20, marginBottom: 24 },
  title: { fontFamily: font.serif, color: palette.ink, fontSize: 44, lineHeight: 52, letterSpacing: -0.8, marginTop: 13 },
  subtitle: { fontFamily: font.sans, color: palette.inkSoft, fontSize: 14, lineHeight: 23, marginTop: 14, marginBottom: 27 },
  form: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, padding: 24, borderRadius: 16, gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 10, letterSpacing: 1.8, color: palette.inkSoft, fontWeight: '800' },
  switchText: { textAlign: 'center', fontSize: 13, color: palette.muted, marginTop: 10 },
  switchLink: { color: palette.forest, fontWeight: '800' },
});
