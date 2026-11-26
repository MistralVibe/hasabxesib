export const en = {
  tabs: {
    home: 'Home',
    transactions: 'Transactions',
    budgets: 'Budgets',
    reports: 'Reports',
    settings: 'Settings',
  },
  home: {
    title: 'Home',
    totalBalance: 'Total balance',
    monthSpent: 'Spent this month',
    ofBudget: 'of {amount} budget',
    recent: 'Recent transactions',
    upcomingRecurring: 'Upcoming recurring',
    emptyTitle: 'Nothing here yet',
    emptyBody: 'Add your first account and transaction to see your balance.',
    addTransaction: 'Add transaction',
    seeAll: 'See all',
  },
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    done: 'Done',
    search: 'Search',
    none: 'None',
    confirmDelete: 'Are you sure you want to delete this?',
    error: 'Something went wrong',
  },
} as const;

export type TranslationKey = string;
