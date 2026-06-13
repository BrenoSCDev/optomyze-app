/**
 * PRESET COLOR PALETTE FOR TAGS
 */

export interface TagColorOption {
  value: string;
  label: string;
}

export const DEFAULT_TAG_COLOR = '#6B7280';

export const TAG_COLORS: TagColorOption[] = [
  { value: '#6B7280', label: 'Gray' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F97316', label: 'Orange' },
  { value: '#EAB308', label: 'Yellow' },
  { value: '#22C55E', label: 'Green' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#0E7490', label: 'Teal' },
  { value: '#1E3A8A', label: 'Indigo' },
  { value: '#831843', label: 'Rose' },
];
