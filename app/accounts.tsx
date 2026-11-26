import React, { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';
import { useShallow } from 'zustand/react/shallow';
import { useDataStore } from '@/stores/useDataStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFormatters } from '@/hooks/useFormatters';
import { toMinor, minorToInputString } from '@/domain/money';
import { startOfDayISO } from '@/domain/dates';
import { Account } from '@/domain/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

type Mode = 'list' | 'editor' | 'transfer';

const ACCOUNT_TYPES = ['cash', 'card', 'bank'] as const;
const ACCOUNT_ICONS: Record<string, string> = { cash: 'cash', card: 'card', bank: 'business' };
const ACCOUNT_COLORS = ['#4ADE80', '#818CF8', '#F59E0B', '#EC4899', '#14B8A6'];

export default function AccountsScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { money } = useFormatters();
  const router = useRouter();
  const currency = useSettingsStore((s) => s.settings.currency);
  const { accounts, transactions, transfers, balanceOf, totalBalance, addAccount, updateAccount, removeAccount, reassignAndDeleteAccount, addTransfer } = useDataStore(
    useShallow((s) => ({
      accounts: s.accounts, transactions: s.transactions, transfers: s.transfers,
      balanceOf: s.balanceOf, totalBalance: s.totalBalance, addAccount: s.addAccount,
      updateAccount: s.updateAccount, removeAccount: s.removeAccount,
      reassignAndDeleteAccount: s.reassignAndDeleteAccount, addTransfer: s.addTransfer,
    })),
  );

  const c = theme.colors;
  const [mode, setMode] = useState<Mode>('list');
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<(typeof ACCOUNT_TYPES)[number]>('cash');
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [opening, setOpening] = useState('');
  const [fromId, setFromId] = useState<string | undefined>(accounts[0]?.id);
  const [toId, setToId] = useState<string | undefined>(accounts[1]?.id);
  const [amount, setAmount] = useState('');
  const [tNote, setTNote] = useState('');
  const [tDate, setTDate] = useState(startOfDayISO(new Date()));
  const [error, setError] = useState('');

  const resetEditor = () => {
    setEditing(null); setName(''); setType('cash'); setColor(ACCOUNT_COLORS[0]); setOpening(''); setError('');
  };

  const openAdd = () => { resetEditor(); setMode('editor'); };
  const openEdit = (a: Account) => {
    setEditing(a); setName(a.name); setType(a.type); setColor(a.color);
    setOpening(a.openingBalance ? minorToInputString(a.openingBalance, useSettingsStore.getState().settings.currency) : '');
    setMode('editor'); setError('');
  };

  const saveAccount = () => {
    setError('');
    if (!name.trim()) { setError(t('errors.required')); return; }
    const openingMinor = opening.trim() ? toMinor(opening, currency) : 0;
    if (opening.trim() && openingMinor === null) { setError(t('errors.invalidAmount')); return; }
    if (editing) {
      updateAccount(editing.id, { name: name.trim(), type, color, openingBalance: openingMinor ?? 0 });
    } else {
      addAccount({ name: name.trim(), type, icon: ACCOUNT_ICONS[type], color, openingBalance: openingMinor ?? 0, isArchived: false });
    }
    resetEditor();
    setMode('list');
  };

  const confirmDelete = (a: Account) => {
    const others = accounts.filter((x) => x.id !== a.id);
    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: t('common.cancel'), style: 'cancel' },
    ];
    if (others.length > 0) {
      buttons.push({
        text: t('accounts.reassignDelete'),
        onPress: () => {
          // Reassign everything to the first other account, then delete.
          reassignAndDeleteAccount(a.id, others[0].id);
          if (mode === 'editor' && editing?.id === a.id) { resetEditor(); setMode('list'); }
        },
      });
    }
    buttons.push({
      text: t('common.delete'), style: 'destructive',
      onPress: () => {
        const result = removeAccount(a.id);
        if (!result.ok) Alert.alert(t('common.error'), t(`errors.${result.error}` as never));
      },
    });
    Alert.alert(t('accounts.deleteTitle'), t('accounts.deleteBody'), buttons);
  };

  const saveTransfer = () => {
    setError('');
    if (!fromId || !toId) { setError(t('errors.noAccounts')); return; }
    if (fromId === toId) { setError(t('accounts.sameAccount')); return; }
    const minor = toMinor(amount, currency);
    if (minor === null || minor <= 0) { setError(t('errors.invalidAmount')); return; }
    const result = addTransfer({ fromAccountId: fromId, toAccountId: toId, amount: minor, note: tNote, date: tDate });
    if (!result.ok) { setError(t(`errors.${result.error}` as never)); return; }
    setMode('list'); setAmount(''); setTNote(''); setError('');
    Alert.alert(t('accounts.transferSaved'));
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, gap: 12 }} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={{ color: c.text, fontSize: theme.type.heading, fontWeight: '800' }}>{t('accounts.title')}</Text>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={c.text} />
          </Pressable>
        </View>

        {mode === 'list' ? (
          <>
            <Card>
              <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>{t('accounts.totalBalance')}</Text>
              <Text style={{ color: c.text, fontSize: theme.type.heading, fontWeight: '800' }}>{money(totalBalance())}</Text>
            </Card>
            {accounts.length === 0 ? (
              <EmptyState icon="cash-outline" title={t('accounts.emptyTitle')} body={t('accounts.emptyBody')} />
            ) : (
              accounts.map((a) => {
                const hasActivity =
                  transactions.some((tx) => tx.accountId === a.id) ||
                  transfers.some((tr) => tr.fromAccountId === a.id || tr.toAccountId === a.id);
                return (
                  <Pressable key={a.id} onPress={() => openEdit(a)} onLongPress={() => hasActivity && confirmDelete(a)}>
                    <Card style={styles.accountRow}>
                      <View style={[styles.badge, { backgroundColor: `${a.color}22`, borderRadius: theme.radii.full , borderCurve: 'continuous'}]}>
                        <Ionicons name={a.icon as never} size={20} color={a.color} />
                      </View>
                      <View style={styles.flex}>
                        <Text style={{ color: c.text, fontWeight: '700', fontSize: theme.type.body }}>{a.name}</Text>
                        <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>
                          {t(`accounts.type${a.type[0].toUpperCase()}${a.type.slice(1)}` as never)}
                        </Text>
                      </View>
                      <Text style={{ color: c.text, fontWeight: '800', fontSize: theme.type.body }}>{money(balanceOf(a.id))}</Text>
                    </Card>
                  </Pressable>
                );
              })
            )}
            <View style={styles.buttonRow}>
              <Button title={t('accounts.add')} onPress={openAdd} style={styles.flex} />
              <Button
                title={t('accounts.transfer')}
                variant="secondary"
                onPress={() => { setMode('transfer'); setError(''); }}
                style={styles.flex}
                disabled={accounts.length < 2}
              />
            </View>
          </>
        ) : mode === 'editor' ? (
          <Card style={styles.editor}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: theme.type.heading, marginBottom: 8 }}>
              {editing ? t('accounts.edit') : t('accounts.add')}
            </Text>
            <TextInput
              value={name} onChangeText={setName}
              placeholder={t('accounts.namePlaceholder')} placeholderTextColor={c.textSecondary}
              style={[styles.input, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, borderCurve: 'continuous', backgroundColor: c.background }]}
            />
            <Text style={[styles.label, { color: c.textSecondary, fontSize: theme.type.caption }]}>{t('accounts.type')}</Text>
            <View style={styles.chips}>
              {ACCOUNT_TYPES.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setType(opt)}
                  style={[styles.chip, { borderColor: type === opt ? c.accent : c.border, backgroundColor: type === opt ? c.accentSoft : c.surface, borderRadius: theme.radii.full , borderCurve: 'continuous'}]}
                >
                  <Text style={{ color: c.text, fontSize: theme.type.caption }}>{t(`accounts.type${opt[0].toUpperCase()}${opt.slice(1)}` as never)}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.chips}>
              {ACCOUNT_COLORS.map((col) => (
                <Pressable
                  key={col}
                  onPress={() => setColor(col)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: col, borderColor: color === col ? c.text : 'transparent', borderRadius: theme.radii.full , borderCurve: 'continuous'},
                  ]}
                />
              ))}
            </View>
            <TextInput
              value={opening} onChangeText={setOpening}
              placeholder={`${t('accounts.initialBalance')} (${currency})`} placeholderTextColor={c.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.input, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, borderCurve: 'continuous', backgroundColor: c.background }]}
            />
            {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
            <View style={styles.buttonRow}>
              <Button title={t('common.cancel')} variant="ghost" onPress={() => { resetEditor(); setMode('list'); }} style={styles.flex} />
              <Button title={t('common.save')} onPress={saveAccount} style={styles.flex} />
            </View>
            {editing ? (
              <Button title={t('common.delete')} variant="danger" onPress={() => confirmDelete(editing)} />
            ) : null}
          </Card>
        ) : (
          <Card style={styles.editor}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: theme.type.heading, marginBottom: 8 }}>{t('accounts.transferTitle')}</Text>
            <Text style={[styles.label, { color: c.textSecondary, fontSize: theme.type.caption }]}>{t('accounts.from')}</Text>
            <View style={styles.chips}>
              {accounts.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => setFromId(a.id)}
                  style={[styles.chip, { borderColor: fromId === a.id ? c.accent : c.border, backgroundColor: fromId === a.id ? c.accentSoft : c.surface, borderRadius: theme.radii.full , borderCurve: 'continuous'}]}
                >
                  <Text style={{ color: c.text, fontSize: theme.type.caption }}>{a.name}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.label, { color: c.textSecondary, fontSize: theme.type.caption }]}>{t('accounts.to')}</Text>
            <View style={styles.chips}>
              {accounts.filter((a) => a.id !== fromId).map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => setToId(a.id)}
                  style={[styles.chip, { borderColor: toId === a.id ? c.accent : c.border, backgroundColor: toId === a.id ? c.accentSoft : c.surface, borderRadius: theme.radii.full , borderCurve: 'continuous'}]}
                >
                  <Text style={{ color: c.text, fontSize: theme.type.caption }}>{a.name}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={amount} onChangeText={setAmount}
              placeholder={`${t('common.amount')} (${currency})`} placeholderTextColor={c.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.input, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, borderCurve: 'continuous', backgroundColor: c.background }]}
            />
            {amount && toMinor(amount, currency) !== null ? (
              <Text style={{ color: c.textSecondary, fontSize: theme.type.caption }}>≈ {money(toMinor(amount, currency) ?? 0)}</Text>
            ) : null}
            <TextInput
              value={tDate} onChangeText={setTDate}
              placeholder="yyyy-mm-dd" placeholderTextColor={c.textSecondary}
              autoCapitalize="none"
              style={[styles.input, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, backgroundColor: c.background }]}
            />
            <TextInput
              value={tNote} onChangeText={setTNote}
              placeholder={t('transactions.notePlaceholder')} placeholderTextColor={c.textSecondary}
              style={[styles.input, { color: c.text, borderColor: c.border, borderRadius: theme.radii.md, borderCurve: 'continuous', backgroundColor: c.background }]}
            />
            {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
            <View style={styles.buttonRow}>
              <Button title={t('common.cancel')} variant="ghost" onPress={() => setMode('list')} style={styles.flex} />
              <Button title={t('common.save')} onPress={saveTransfer} style={styles.flex} />
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, paddingVertical: 10 },
  badge: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  editor: { gap: 10 },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10 },
  label: { fontWeight: '600', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth },
  colorDot: { width: 28, height: 28, borderWidth: 2 },
});
