export const COLLECTIONS = [
  { id: 'conversations', label: '대화 (Conversations)' },
  { id: 'essays', label: '에세이 (Essays)' },
] as const;

export type CollectionId = typeof COLLECTIONS[number]['id'];
