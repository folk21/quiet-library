import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, BookMarked, Compass, Hash, Search } from 'lucide-react-native';
import { ActionButton, BookInput, ErrorText, Screen, SectionLabel } from '../../components/Ui';
import { api } from '../../lib/api';
import type { CatalogStats } from '../../lib/types';
import { common, font, palette, pageNumber, shadow } from '../../lib/theme';

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const { width } = useWindowDimensions();
  const wide = width > 760;

  useEffect(() => { api.stats().then(setStats).catch(() => {}); }, []);

  async function goToNumber() {
    const number = Number(query.trim().replace(/[^0-9]/g, ''));
    if (!Number.isSafeInteger(number) || number <= 0) { setMessage('Введите существующий номер страницы.'); return; }
    setMessage(null);
    router.push({ pathname: '/page/[number]', params: { number: String(number) } });
  }

  async function openRandom() {
    setBusy(true);
    setMessage(null);
    try {
      const page = await api.randomPage();
      router.push({ pathname: '/page/[number]', params: { number: String(page.user.pageNumber) } });
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось открыть страницу.'); }
    finally { setBusy(false); }
  }

  return <Screen>
    <View style={[styles.hero, wide && styles.heroWide]}>
      <View style={styles.heroCopy}>
        <View style={styles.heroEyebrow}><View style={styles.eyebrowDot} /><Text style={common.eyebrow}>БИБЛИОТЕКА АВТОРОВ</Text></View>
        <Text style={[styles.heroTitle, wide && { fontSize: 56, lineHeight: 65 }]}>Люди и их{ '\n' }<Text style={styles.italic}>тексты.</Text></Text>
        <Text style={styles.heroDescription}>Публикуйте записи, открывайте страницы по номеру и сохраняйте авторов в личный блокнот. Здесь нет ленты, лайков и подписчиков.</Text>
        <View style={styles.pills}>
          <Text style={styles.pill}>публикации</Text><Text style={styles.pill}>поиск по номеру</Text><Text style={styles.pill}>личный блокнот</Text>
        </View>
      </View>
      <Pressable onPress={() => router.push('/page/56')} style={styles.bookPreview} accessibilityRole="button" accessibilityLabel="Открыть страницу 56">
        <View style={styles.previewMark}><Text style={styles.previewMarkText}>ПРИМЕР СТРАНИЦЫ</Text><BookMarked color={palette.accent} size={18} strokeWidth={1.3} /></View>
        <View style={styles.previewCircle}><BookMarked color={palette.forest} size={27} strokeWidth={1.2} /></View>
        <Text style={styles.previewNumber}>{pageNumber(56)}</Text>
        <Text style={styles.previewName}>Ева Белая</Text>
        <Text style={styles.previewDescription}>Городские прогулки, архивные находки и заметки о повседневности.</Text>
        <View style={styles.previewBottom}><Text style={styles.previewBottomText}>ПОСМОТРЕТЬ СТРАНИЦУ</Text><ArrowRight size={18} color={palette.forest} /></View>
      </Pressable>
    </View>

    <View style={styles.findSection}>
      <SectionLabel text="01 / Найти страницу" trailing="По номеру из каталога" />
      <Text style={styles.findTitle}>Поиск по номеру</Text>
      <View style={[styles.searchRow, !wide && { flexDirection: 'column' }]}>
        <View style={styles.searchWrap}><Search size={20} color={palette.moss} strokeWidth={1.7} /><BookInput value={query} onChangeText={setQuery} placeholder="Например, 0056" keyboardType="numeric" style={styles.searchInput} /></View>
        <ActionButton title="Найти страницу" icon={ArrowRight} onPress={goToNumber} style={wide ? { minWidth: 190 } : { width: '100%' }} />
      </View>
      <ErrorText message={message} />
    </View>

    <View style={[styles.randomCard, wide && { flexDirection: 'row', alignItems: 'center' }]}>
      <View style={styles.randomIcon}><Compass size={27} color={palette.forest} strokeWidth={1.35} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.randomEyebrow}>СЛУЧАЙНЫЙ АВТОР</Text>
        <Text style={styles.randomTitle}>Открыть случайную страницу</Text>
        <Text style={styles.randomText}>Если номера нет, можно выбрать страницу случайным образом и прочитать публикации её автора.</Text>
      </View>
      <ActionButton title="Открыть" icon={ArrowRight} variant="secondary" loading={busy} onPress={openRandom} style={wide ? { minWidth: 167 } : { marginTop: 18 }} />
    </View>

    <View style={styles.principles}>
      <SectionLabel text="02 / Как устроена библиотека" trailing="Простые правила" />
      <View style={[styles.principlesRow, !wide && { flexDirection: 'column' }]}>
        <View style={styles.principle}><View style={styles.principleIcon}><Hash size={21} color={palette.accent} /></View><Text style={styles.principleTitle}>Постоянный номер</Text><Text style={styles.principleBody}>Каждый пользователь получает числовой адрес страницы, который не меняется.</Text></View>
        <View style={styles.principle}><View style={styles.principleIcon}><BookMarked size={21} color={palette.accent} /></View><Text style={styles.principleTitle}>Личный блокнот</Text><Text style={styles.principleBody}>Сохраняйте авторов и добавляйте приватные заметки к их страницам.</Text></View>
        <View style={styles.principle}><View style={styles.principleIcon}><Compass size={21} color={palette.accent} /></View><Text style={styles.principleTitle}>Без ленты</Text><Text style={styles.principleBody}>Авторы находятся по номеру или случайным выбором. Рекомендаций нет.</Text></View>
      </View>
    </View>
    <View style={styles.ending}>
      <Text style={styles.endingEyebrow}>КАТАЛОГ</Text>
      <Text style={styles.endingTitle}>{stats ? `${stats.pages} авторов · ${stats.posts} публикаций` : 'Читайте и публикуйте тексты'}</Text>
      <Text style={styles.endingDescription}>Просмотр доступен всем. Для публикации текстов и личного блокнота нужна регистрация.</Text>
      <ActionButton title="Создать свою страницу" variant="secondary" onPress={() => router.push('/auth?mode=register')} icon={ArrowRight} style={{ alignSelf: 'flex-start', marginTop: 22 }} />
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { gap: 24, paddingTop: 13, paddingBottom: 55 },
  heroWide: { flexDirection: 'row', alignItems: 'center', gap: 45, paddingTop: 25, paddingBottom: 66 },
  heroCopy: { flex: 1, minWidth: 0 },
  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  eyebrowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accent },
  heroTitle: { fontFamily: font.serif, color: palette.ink, fontSize: 39, lineHeight: 49, letterSpacing: -1.4 },
  italic: { fontStyle: 'italic', color: palette.forest },
  heroDescription: { fontFamily: font.sans, fontSize: 15.5, color: palette.inkSoft, lineHeight: 27, maxWidth: 430, marginTop: 22 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
  pill: { color: palette.forest, backgroundColor: palette.sage, fontSize: 11.2, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  bookPreview: { backgroundColor: '#E8E9DE', borderColor: '#CBD3C8', borderWidth: 1, borderRadius: 7, width: '100%', maxWidth: 324, minHeight: 395, padding: 27, alignSelf: 'center', justifyContent: 'space-between', borderLeftWidth: 10, borderLeftColor: palette.forest, ...shadow },
  previewMark: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewMarkText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: palette.moss },
  previewCircle: { alignSelf: 'center', height: 70, width: 70, borderRadius: 35, borderWidth: 1, borderColor: '#B7C2B4', alignItems: 'center', justifyContent: 'center', marginTop: 17 },
  previewNumber: { fontFamily: font.serif, fontSize: 36, textAlign: 'center', color: palette.forest, marginTop: 6 },
  previewName: { fontFamily: font.serif, fontSize: 20, color: palette.ink, textAlign: 'center' },
  previewDescription: { fontFamily: font.sans, fontSize: 14, color: palette.inkSoft, lineHeight: 23, textAlign: 'center', marginTop: 7 },
  previewBottom: { borderTopWidth: 1, borderTopColor: '#C5CFC1', marginTop: 15, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewBottomText: { fontSize: 10, color: palette.forest, letterSpacing: 1.6, fontWeight: '700' },
  findSection: { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 31, paddingBottom: 36 },
  findTitle: { fontFamily: font.serif, fontSize: 27, color: palette.ink, marginBottom: 18 },
  searchRow: { flexDirection: 'row', gap: 11 },
  searchWrap: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: palette.border, borderRadius: 12, backgroundColor: palette.card, flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 14 },
  searchInput: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingLeft: 5 },
  randomCard: { backgroundColor: '#E8ECE1', borderWidth: 1, borderColor: '#D5DCCE', borderRadius: 18, padding: 25, gap: 19 },
  randomIcon: { width: 55, height: 55, borderRadius: 14, backgroundColor: palette.card, alignItems: 'center', justifyContent: 'center' },
  randomEyebrow: { fontSize: 10, letterSpacing: 2.1, color: palette.forest, fontWeight: '800', marginBottom: 7 },
  randomTitle: { fontFamily: font.serif, fontSize: 24, color: palette.ink },
  randomText: { color: palette.inkSoft, fontSize: 13, lineHeight: 22, marginTop: 7, maxWidth: 430 },
  principles: { marginTop: 63 },
  principlesRow: { flexDirection: 'row', gap: 14 },
  principle: { flex: 1, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 22, minWidth: 0 },
  principleIcon: { marginBottom: 17 },
  principleTitle: { fontFamily: font.serif, fontSize: 20, color: palette.ink, marginBottom: 8 },
  principleBody: { fontSize: 13.2, lineHeight: 22, color: palette.inkSoft },
  ending: { marginTop: 64, padding: 28, borderWidth: 1, borderColor: palette.border, borderRadius: 18, backgroundColor: palette.card },
  endingEyebrow: { color: palette.accent, fontSize: 10, letterSpacing: 2.1, fontWeight: '800' },
  endingTitle: { fontFamily: font.serif, fontSize: 28, color: palette.ink, marginTop: 13 },
  endingDescription: { fontSize: 14, color: palette.inkSoft, lineHeight: 23, marginTop: 10 },
});
