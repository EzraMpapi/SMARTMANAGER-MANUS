const tableCallPattern = /(?:sb|useCompanyTable|runCompanyTableQuery|runCompanyTableMutation)\(\s*["']([a-z][a-z0-9_]*)["']/g;
const prefixedTablePattern = /["']((?:mfi|phm|sch)_[a-z0-9_]+)["']/g;

const matches = (source, pattern) => [...source.matchAll(pattern)].map((match) => match[1]);

export function extractReferencedTables({ dashboardSource, microfinanceSource, pharmacySource, schoolSource }) {
  return [...new Set([
    ...matches(dashboardSource, tableCallPattern),
    ...matches(microfinanceSource, /["'](mfi_[a-z0-9_]+)["']/g),
    ...matches(pharmacySource, /["'](phm_[a-z0-9_]+)["']/g),
    ...matches(schoolSource, /["'](sch_[a-z0-9_]+)["']/g),
  ])].sort();
}

export const NON_TABLE_REFERENCE_REGRESSION_CASES = [
  "approval_proposals",
  "auth",
  "bank_transfer",
  "invite",
  "order",
];

export { tableCallPattern, prefixedTablePattern };
