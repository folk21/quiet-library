import { Platform, StyleSheet } from 'react-native';

export const palette = {
  paper: '#F5F1E7',
  paperAlt: '#EDE8DC',
  card: '#FFFEF9',
  ink: '#26332E',
  inkSoft: '#46574D',
  muted: '#819086',
  forest: '#355C4B',
  moss: '#718C76',
  sage: '#E0E8DD',
  border: '#DADDD2',
  accent: '#B17A55',
  accentLight: '#F1E5D8',
  danger: '#9C564D',
  white: '#FFFFFF',
};

export const font = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' })!,
  sans: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'Arial, sans-serif' })!,
};

export const shadow = Platform.select({
  web: { boxShadow: '0 16px 45px rgba(31, 47, 39, 0.07)' } as object,
  default: { elevation: 2, shadowColor: '#26332E', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
});

export const common = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', paddingHorizontal: 24 },
  eyebrow: { fontFamily: font.sans, color: palette.accent, fontSize: 11, letterSpacing: 2.8, fontWeight: '700' },
  title: { fontFamily: font.serif, color: palette.ink, fontSize: 36, lineHeight: 44, letterSpacing: -0.7 },
  body: { fontFamily: font.sans, fontSize: 15, lineHeight: 25, color: palette.inkSoft },
  divider: { height: 1, backgroundColor: palette.border },
  card: { backgroundColor: palette.card, borderRadius: 18, borderWidth: 1, borderColor: palette.border },
  input: {
    backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 12,
    color: palette.ink, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: font.sans,
  },
});

export function pageNumber(number: number): string {
  return `№ ${String(number).padStart(4, '0')}`;
}

export function shortDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}
