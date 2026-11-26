import { File, Paths } from 'expo-file-system';
import * as LegacyFS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { buildTransactionsCsv, parseBackup, serializeBackup, BackupData } from '@/domain/export';
import { listAccounts, listBudgets, listCategories, listRecurringRules, listTransactions, listTransfers, replaceAllData } from '@/db/repositories';
import { decodeBase64 } from '@/utils/base64';

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

export async function importJsonBackup(asset: {
  base64?: string | null;
  uri?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    let json: string;
    if (asset.base64) {
      // Web picker path: content inline, no file-system access at all.
      json = decodeBase64(asset.base64);
    } else if (asset.uri) {
      // Android: keep the SAF content:// uri (copyToCacheDirectory: false) — Expo Go's
      // FilePermissionService denies reads of the DocumentPicker cache copy, but the
      // legacy API reads content URIs via ContentResolver under the SAF grant.
      // iOS: file:// tmp copy from the picker, readable directly.
      json = await LegacyFS.readAsStringAsync(asset.uri);
    } else {
      throw new Error('Picked file has no readable content');
    }
    const data = parseBackup(json);
    replaceAllData(data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export type { BackupData };
