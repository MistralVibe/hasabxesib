import React from 'react';
import { Screen } from '@/components/ui/Screen';
import { Placeholder } from '@/components/ui/Placeholder';
import { useI18n } from '@/i18n';

export default function SettingsScreen() {
  const { t } = useI18n();
  return (
    <Screen>
      <Placeholder title={t('tabs.settings')} />
    </Screen>
  );
}
