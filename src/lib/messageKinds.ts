import type { MessageKind } from './types';

export const MESSAGE_KINDS: { kind: MessageKind; title: string; minimum: number; hint: string }[] = [
  { kind: 'simple', title: 'Обычное', minimum: 200, hint: 'Короткое личное сообщение' },
  { kind: 'thought', title: 'Длинная мысль', minimum: 500, hint: 'Развёрнутый абзац или размышление' },
  { kind: 'letter', title: 'Письмо', minimum: 1800, hint: 'Полноценное письмо объёмом примерно в страницу' },
];

export function messageKind(kind: MessageKind) {
  return MESSAGE_KINDS.find((item) => item.kind === kind) ?? MESSAGE_KINDS[0];
}

export function characterCount(text: string): number {
  return Array.from(text.trim()).length;
}
