import React from 'react';
import { Tabs } from 'expo-router';
import { BookOpen, Bookmark, LibraryBig, Mail } from 'lucide-react-native';
import { font, palette } from '../../lib/theme';

export default function TabLayout() {
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: palette.forest,
    tabBarInactiveTintColor: palette.muted,
    tabBarStyle: { backgroundColor: palette.card, borderTopColor: palette.border, borderTopWidth: 1, height: 72, paddingBottom: 13, paddingTop: 9 },
    tabBarLabelStyle: { fontFamily: font.sans, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.2 },
  }}>
    <Tabs.Screen name="index" options={{ title: 'Главная', tabBarIcon: ({ color, focused }) => <LibraryBig size={21} strokeWidth={focused ? 2 : 1.6} color={color} /> }} />
    <Tabs.Screen name="notebook" options={{ title: 'Блокнот', tabBarIcon: ({ color, focused }) => <Bookmark size={21} strokeWidth={focused ? 2 : 1.6} color={color} /> }} />
    <Tabs.Screen name="messages" options={{ title: 'Сообщения', tabBarIcon: ({ color, focused }) => <Mail size={21} strokeWidth={focused ? 2 : 1.6} color={color} /> }} />
    <Tabs.Screen name="me" options={{ title: 'Моя страница', tabBarIcon: ({ color, focused }) => <BookOpen size={21} strokeWidth={focused ? 2 : 1.6} color={color} /> }} />
  </Tabs>;
}
