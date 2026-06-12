export const COLLECTIONS = [
  { id: 'conversations', label: '대화' },
  { id: 'essays', label: '에세이' },
] as const;

export type CollectionId = typeof COLLECTIONS[number]['id'];
