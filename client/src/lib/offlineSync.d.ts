export interface OfflineQueueSummary {
  pending: number;
  syncing: number;
  failed: number;
  conflicts: number;
  entries: Array<{ id: string; status: string }>;
}

export function offlineScope(companyId?: string): string;
export function offlineQueueSummary(scope: string): OfflineQueueSummary;
