import React from 'react';
import { Screen } from '@/components/ui/Screen';
import { Placeholder } from '@/components/ui/Placeholder';
import { useI18n } from '@/i18n';

export default function TransactionsScreen() {
  const { t } = useI18n();
  return (
    <Screen>
      <Placeholder title={t('tabs.transactions')} />
    </Screen>
  );
}
