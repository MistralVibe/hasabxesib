import { Category } from '@/domain/types';

// Predefined categories, seeded on first run. `nameKey` points into the i18n
// dictionaries (categories.*), `name` is the English fallback.
export const PREDEFINED_CATEGORIES: Array<Omit<Category, 'id' | 'createdAt' | 'isPredefined'>> = [
  // expense
  { nameKey: 'categories.food', name: 'Food & dining', icon: 'fast-food', color: '#F59E0B', type: 'expense' },
  { nameKey: 'categories.transport', name: 'Transport', icon: 'car', color: '#3B82F6', type: 'expense' },
  { nameKey: 'categories.housing', name: 'Housing & utilities', icon: 'home', color: '#8B5CF6', type: 'expense' },
  { nameKey: 'categories.shopping', name: 'Shopping', icon: 'cart', color: '#EC4899', type: 'expense' },
  { nameKey: 'categories.entertainment', name: 'Entertainment', icon: 'film', color: '#F43F5E', type: 'expense' },
  { nameKey: 'categories.health', name: 'Health', icon: 'medkit', color: '#10B981', type: 'expense' },
  { nameKey: 'categories.subscriptions', name: 'Subscriptions', icon: 'repeat', color: '#6366F1', type: 'expense' },
  { nameKey: 'categories.education', name: 'Education', icon: 'school', color: '#0EA5E9', type: 'expense' },
  { nameKey: 'categories.travel', name: 'Travel', icon: 'airplane', color: '#14B8A6', type: 'expense' },
  { nameKey: 'categories.otherExpense', name: 'Other expenses', icon: 'ellipsis-horizontal', color: '#6B7280', type: 'expense' },
  // income
  { nameKey: 'categories.salary', name: 'Salary', icon: 'briefcase', color: '#15803D', type: 'income' },
  { nameKey: 'categories.freelance', name: 'Freelance', icon: 'laptop', color: '#65A30D', type: 'income' },
  { nameKey: 'categories.investments', name: 'Investments', icon: 'trending-up', color: '#0D9488', type: 'income' },
  { nameKey: 'categories.gifts', name: 'Gifts', icon: 'gift', color: '#D946EF', type: 'income' },
  { nameKey: 'categories.otherIncome', name: 'Other income', icon: 'ellipsis-horizontal', color: '#6B7280', type: 'income' },
];
