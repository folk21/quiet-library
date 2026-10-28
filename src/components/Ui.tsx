import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { BookOpen, LockKeyhole, Feather, type LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { common, font, palette, shadow } from '../lib/theme';
import { isDemoMode } from '../lib/api';

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <SafeAreaView style={common.page} edges={['top', 'left', 'right']}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, style]}>
      <View style={common.content}>
        <BrandHeader />
        {children}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ТИХАЯ БИБЛИОТЕКА  ·  ЧТЕНИЕ И ПУБЛИКАЦИИ</Text>
          {isDemoMode && <Text style={styles.demoPill}>ДЕМО-РЕЖИМ</Text>}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

export function BrandHeader() {
  return <View style={styles.brandBar}>
    <Pressable onPress={() => router.push('/')} style={styles.brand} accessibilityRole="button" accessibilityLabel="На главную">
      <View style={styles.brandIcon}><BookOpen size={19} strokeWidth={1.65} color={palette.card} /></View>
      <View><Text style={styles.brandName}>ТИХАЯ</Text><Text style={styles.brandName}>БИБЛИОТЕКА</Text></View>
    </Pressable>
    <Pressable onPress={() => router.push('/write')} style={styles.brandRight} accessibilityRole="button" accessibilityLabel="Новая публикация">
      <Feather size={17} color={palette.forest} strokeWidth={1.7} />
      <Text style={styles.brandAction}>Написать</Text>
    </Pressable>
  </View>;
}

export function ActionButton({ title, onPress, variant = 'primary', icon: Icon, loading = false, disabled = false, style }: {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'quiet'; icon?: LucideIcon;
  loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const isPrimary = variant === 'primary';
  return <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button"
    style={({ pressed }) => [styles.action, isPrimary ? styles.actionPrimary : variant === 'secondary' ? styles.actionSecondary : styles.actionQuiet, pressed && { opacity: 0.82 }, disabled && { opacity: 0.45 }, style]}>
    {loading ? <ActivityIndicator color={isPrimary ? palette.white : palette.forest} size="small" /> : <>
      {Icon && <Icon color={isPrimary ? palette.white : palette.forest} size={17} strokeWidth={1.8} />}
      <Text style={[styles.actionText, { color: isPrimary ? palette.white : palette.forest }]}>{title}</Text>
    </>}
  </Pressable>;
}

export function SectionLabel({ text, trailing }: { text: string; trailing?: string }) {
  return <View style={styles.labelRow}>
    <Text style={common.eyebrow}>{text.toUpperCase()}</Text>
    {trailing && <Text style={styles.labelTrailing}>{trailing}</Text>}
  </View>;
}

export function BookInput({ value, onChangeText, placeholder, multiline, secureTextEntry, keyboardType, autoCapitalize, onSubmitEditing, returnKeyType, submitBehavior, style }: {
  value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean;
  secureTextEntry?: boolean; keyboardType?: 'default' | 'numeric' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words'; style?: StyleProp<ViewStyle>;
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  returnKeyType?: TextInputProps['returnKeyType'];
  submitBehavior?: TextInputProps['submitBehavior'];
}) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder}
    placeholderTextColor="#9AA79C" selectionColor={palette.forest} multiline={multiline}
    secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize}
    onSubmitEditing={onSubmitEditing} returnKeyType={returnKeyType} submitBehavior={submitBehavior}
    style={[common.input, multiline && { minHeight: 120, textAlignVertical: 'top' }, style]} />;
}

export function EmptyState({ title, message, action, onAction, privatePage = false }: {
  title: string; message: string; action?: string; onAction?: () => void; privatePage?: boolean;
}) {
  return <View style={styles.empty}>
    <View style={styles.emptyIcon}>{privatePage ? <LockKeyhole size={25} strokeWidth={1.4} color={palette.forest} /> : <BookOpen size={25} strokeWidth={1.4} color={palette.forest} />}</View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
    {action && onAction && <ActionButton title={action} onPress={onAction} variant="secondary" style={{ marginTop: 20 }} />}
  </View>;
}

export function ErrorText({ message }: { message: string | null }) {
  return message ? <View style={styles.error}><Text style={styles.errorText}>{message}</Text></View> : null;
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: 16 },
  brandBar: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: palette.border, marginBottom: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: { width: 43, height: 43, backgroundColor: palette.forest, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: font.sans, fontWeight: '800', letterSpacing: 2.8, color: palette.ink, fontSize: 10.5, lineHeight: 14 },
  brandRight: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: palette.sage, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10 },
  brandAction: { fontFamily: font.sans, fontSize: 12, fontWeight: '700', color: palette.forest },
  action: { minHeight: 51, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11 },
  actionPrimary: { backgroundColor: palette.forest },
  actionSecondary: { backgroundColor: palette.sage, borderWidth: 1, borderColor: '#D4E1D5' },
  actionQuiet: { backgroundColor: 'transparent' },
  actionText: { fontFamily: font.sans, fontSize: 13.5, letterSpacing: 0.2, fontWeight: '700' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14 },
  labelTrailing: { color: palette.muted, fontSize: 12, fontFamily: font.sans },
  footer: { marginTop: 38, paddingTop: 21, borderTopColor: palette.border, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  footerText: { fontSize: 9, letterSpacing: 1.8, color: palette.muted, fontWeight: '600' },
  demoPill: { fontSize: 9, color: palette.accent, letterSpacing: 1.5, fontWeight: '800' },
  empty: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 18, alignItems: 'center', paddingVertical: 55, paddingHorizontal: 26, ...shadow },
  emptyIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  emptyTitle: { fontFamily: font.serif, fontSize: 23, color: palette.ink, textAlign: 'center' },
  emptyMessage: { fontSize: 13.5, color: palette.muted, lineHeight: 22, textAlign: 'center', maxWidth: 360, marginTop: 10 },
  error: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#F8E9E5', borderRadius: 9, marginTop: 12 },
  errorText: { color: palette.danger, fontSize: 13, lineHeight: 19 },
});
