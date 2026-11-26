import { en } from './en';

export const ru: typeof en = {
  tabs: {
    home: 'Главная',
    transactions: 'Операции',
    budgets: 'Бюджеты',
    reports: 'Отчёты',
    settings: 'Настройки',
  },
  home: {
    title: 'Главная',
    totalBalance: 'Общий баланс',
    monthSpent: 'Потрачено за месяц',
    ofBudget: 'из бюджета {amount}',
    recent: 'Недавние операции',
    upcomingRecurring: 'Ближайшие повторы',
    emptyTitle: 'Здесь пока пусто',
    emptyBody: 'Добавьте первый счёт и операцию, чтобы увидеть баланс.',
    addTransaction: 'Добавить операцию',
    seeAll: 'Все',
  },
  common: {
    cancel: 'Отмена',
    save: 'Сохранить',
    delete: 'Удалить',
    edit: 'Изменить',
    add: 'Добавить',
    done: 'Готово',
    search: 'Поиск',
    none: 'Нет',
    confirmDelete: 'Точно удалить?',
    error: 'Что-то пошло не так',
  },
};
