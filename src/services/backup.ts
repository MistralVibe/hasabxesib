import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { buildTransactionsCsv, parseBackup, serializeBackup, BackupData } from '@/domain/export';
import { listAccounts, listBudgets, listCategories, listRecurringRules, listTransactions, listTransfers, replaceAllData } from '@/db/repositories';

// Export/import via share sheet. Parsing/validation live in the pure domain
// module (src/domain/export.ts). expo-file-system SDK-58 API: File + Paths.

export async function exportCsv(currency: string): Promise<string | null> {
  const csv = buildTransactionsCsv(listTransactions(), listAccounts(), listCategories(), currency);
  const file = new File(Paths.cache, `hasabxesib-transactions-${Date.now()}.csv`);
  await file.write(csv);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'HasabXesib CSV' });
  }
  return file.uri;
}

export async function exportJsonBackup(): Promise<string | null> {
  const data = {
    accounts: listAccounts(),
    categories: listCategories(),
    transactions: listTransactions(),
    transfers: listTransfers(),
    budgets: listBudgets(),
    recurringRules: listRecurringRules(),
  };
  const json = serializeBackup(data, new Date().toISOString());
  const file = new File(Paths.cache, `hasabxesib-backup-${Date.now()}.json`);
  await file.write(json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'HasabXesib backup' });
  }
  return file.uri;
}

export async function importJsonBackup(uri: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const file = new File(uri);
    if (!file.exists) return { ok: false, error: 'File not found' };
    const json = await file.text();
    const data = parseBackup(json);
    replaceAllData(data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export type { BackupData };
