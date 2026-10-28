import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight, Feather } from 'lucide-react-native';
import { font, palette, shortDate } from '../lib/theme';
import type { Post } from '../lib/types';

export function PostCard({ post, onEdit, compact = false }: { post: Post; onEdit?: () => void; compact?: boolean }) {
  const paragraphs = compact ? [post.content.slice(0, 200) + (post.content.length > 200 ? '…' : '')] : post.content.split(/\n\s*\n/);
  return <View style={styles.card}>
    <View style={styles.meta}><View style={styles.metaLeft}><Feather size={15} color={palette.accent} strokeWidth={1.5} /><Text style={styles.date}>{shortDate(post.createdAt)}</Text></View>
      {onEdit && <Pressable onPress={onEdit} style={styles.edit}><Text style={styles.editText}>ИЗМЕНИТЬ</Text><ArrowUpRight size={13} color={palette.forest} /></Pressable>}
    </View>
    <Text style={styles.title}>{post.title}</Text>
    <View style={styles.divider} />
    {paragraphs.map((paragraph, i) => <Text style={styles.content} key={`${post.id}-${i}`}>{paragraph}</Text>)}
  </View>;
}

const styles = StyleSheet.create({
  card: { paddingVertical: 28, borderBottomColor: palette.border, borderBottomWidth: 1 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  date: { fontSize: 11, color: palette.muted, letterSpacing: 0.3 },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5 },
  editText: { fontSize: 10, letterSpacing: 1.2, color: palette.forest, fontWeight: '700' },
  title: { fontFamily: font.serif, color: palette.ink, fontSize: 27, lineHeight: 34, marginTop: 15 },
  divider: { width: 35, height: 2, backgroundColor: palette.accent, marginTop: 16, marginBottom: 17 },
  content: { fontFamily: font.serif, fontSize: 16.5, lineHeight: 29, color: palette.inkSoft, marginBottom: 13 },
});
