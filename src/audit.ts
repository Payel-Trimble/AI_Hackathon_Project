export type AuditRow = {
  productName: string;
  optimizedTitle: string;
  briefOverview: string;
  splashDescription: string;
  keyBenefits: string;
  mandatoryNote: string;
  asoKeywords: string;
  rubricScore: number;
  nonComplianceFlags: string;
  batchRunDate: string;
};

export type Decision = 'partner' | 'edit' | 'publish';

export const DECISION_LABEL: Record<Decision, string> = {
  partner: 'Send back to the partner',
  edit: 'Reviewer edit required',
  publish: 'Ready for publish review',
};

const HEADER_MAP: Record<string, keyof AuditRow> = {
  'product name': 'productName',
  'optimized product title': 'optimizedTitle',
  'brief overview': 'briefOverview',
  'splash description': 'splashDescription',
  'key benefits': 'keyBenefits',
  'mandatory partner note': 'mandatoryNote',
  'aso keywords': 'asoKeywords',
  'rubric score': 'rubricScore',
  'non-compliance flags': 'nonComplianceFlags',
  'batch run date': 'batchRunDate',
};

export function parseList(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed || /^none$/i.test(trimmed)) return [];
  const parts = trimmed.includes('\n')
    ? trimmed.split(/\n+/)
    : trimmed.includes(' - ')
      ? trimmed.split(' - ')
      : [trimmed];
  return parts.map((part) => part.replace(/^[\s\-–—]+/, '').trim()).filter(Boolean);
}

export function classify(row: AuditRow): Decision {
  const flags = parseList(row.nonComplianceFlags);
  const emptyListing =
    row.rubricScore <= 2 || flags.some((flag) => /empty description/i.test(flag));
  if (emptyListing || row.rubricScore <= 4) return 'partner';
  if (row.rubricScore <= 6 || flags.length > 0) return 'edit';
  return 'publish';
}

export type RubricSeverity = 'none' | 'low' | 'medium' | 'high';

export type RubricCategoryStat = {
  id: string;
  label: string;
  count: number;
  failureRate: number;
  severity: RubricSeverity;
};

const RUBRIC_CATEGORIES: { id: string; label: string; matches: (flag: string) => boolean; ask: string }[] = [
  {
    id: 'empty',
    label: 'Empty description',
    matches: (flag) => /empty description/i.test(flag),
    ask: 'A description of what the product does',
  },
  {
    id: 'audience',
    label: 'Missing audience',
    matches: (flag) => /audience/i.test(flag),
    ask: 'Who the product is for',
  },
  {
    id: 'problem',
    label: 'Missing problem',
    matches: (flag) => /problem/i.test(flag),
    ask: 'The problem the product solves',
  },
  {
    id: 'capabilities',
    label: 'Missing concrete capabilities',
    matches: (flag) => /capabilit/i.test(flag),
    ask: 'The concrete capabilities a buyer gets',
  },
  {
    id: 'workflow',
    label: 'Missing workflow',
    matches: (flag) => /workflow/i.test(flag),
    ask: 'Where the product fits in the buyer’s workflow',
  },
];

export function categoryForFlag(flag: string): { id: string; label: string } {
  const known = RUBRIC_CATEGORIES.find((category) => category.matches(flag));
  if (known) return { id: known.id, label: known.label };
  return { id: `other:${flag.toLowerCase()}`, label: flag };
}

export function listingHasCategory(row: AuditRow, categoryId: string): boolean {
  return parseList(row.nonComplianceFlags).some((flag) => categoryForFlag(flag).id === categoryId);
}

export function rubricCategoryStats(rows: AuditRow[]): RubricCategoryStat[] {
  const stats = new Map<string, { id: string; label: string; count: number }>();
  RUBRIC_CATEGORIES.forEach((category) => {
    stats.set(category.id, { id: category.id, label: category.label, count: 0 });
  });

  rows.forEach((row) => {
    const seen = new Set<string>();
    parseList(row.nonComplianceFlags).forEach((flag) => {
      const category = categoryForFlag(flag);
      if (seen.has(category.id)) return;
      seen.add(category.id);
      const current = stats.get(category.id) ?? { id: category.id, label: category.label, count: 0 };
      current.count += 1;
      stats.set(category.id, current);
    });
  });

  return [...stats.values()]
    .filter((category) => category.id.startsWith('other:') ? category.count > 0 : true)
    .map((category) => {
      const failureRate = rows.length === 0 ? 0 : category.count / rows.length;
      return { ...category, failureRate, severity: severityForRate(failureRate) };
    });
}

function severityForRate(rate: number): RubricSeverity {
  if (rate <= 0) return 'none';
  if (rate < 0.2) return 'low';
  if (rate < 0.4) return 'medium';
  return 'high';
}

export function publisherEmail(row: AuditRow): string {
  const flags = parseList(row.nonComplianceFlags);
  const asks = new Map<string, string>();
  flags.forEach((flag) => {
    const known = RUBRIC_CATEGORIES.find((category) => category.matches(flag));
    if (known) asks.set(known.id, known.ask);
    else asks.set(flag.toLowerCase(), flag);
  });
  if (asks.size === 0) {
    asks.set('audience', 'Who the product is for');
    asks.set('problem', 'The problem the product solves');
    asks.set('capabilities', 'The concrete capabilities a buyer gets');
  }

  const subject = `Action needed: update the ${row.productName} marketplace listing`;
  const body = [
    'Hello,',
    '',
    `Marketplace review flagged ${row.productName} for an update before the listing can go live.`,
    '',
    'Please update the listing to include:',
    ...[...asks.values()].map((ask) => `- ${ask}`),
    '',
    'The current description is not enough to publish. Reply with the updated listing copy, or edit the listing in the marketplace.',
    '',
    'Thank you,',
    'Marketplace Review',
  ].join('\n');

  return `Subject: ${subject}\n\n${body}`;
}

export function decisionDetail(row: AuditRow): string {
  const decision = classify(row);
  if (decision === 'partner') {
    return 'The source listing is too thin to publish. Ask the partner for the audience, the problem, and concrete capabilities before using the rewrite.';
  }
  if (decision === 'edit') {
    return 'A reviewer should confirm every claim in the rewrite against the partner’s source listing before it goes live.';
  }
  return 'The original listing already states an audience, a problem, and concrete capabilities. Confirm the rewrite, then schedule it.';
}

export function parseAuditCsv(text: string): { rows: AuditRow[]; skipped: number } {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], skipped: 0 };

  const headers = table[0].map((header) => header.trim().toLowerCase());
  const indexes = new Map<keyof AuditRow, number>();
  headers.forEach((header, index) => {
    const field = HEADER_MAP[header];
    if (field) indexes.set(field, index);
  });

  if (!indexes.has('productName') || !indexes.has('rubricScore')) {
    throw new Error(
      'The CSV needs Product Name and Rubric Score columns from the audit sheet.',
    );
  }

  const rows: AuditRow[] = [];
  let skipped = 0;
  for (const cells of table.slice(1)) {
    const read = (field: keyof AuditRow) => {
      const index = indexes.get(field);
      return index === undefined ? '' : (cells[index] ?? '').trim();
    };
    const productName = read('productName');
    const score = Number(read('rubricScore'));
    if (!productName || !Number.isFinite(score)) {
      skipped += 1;
      continue;
    }
    rows.push({
      productName,
      optimizedTitle: read('optimizedTitle') || productName,
      briefOverview: read('briefOverview'),
      splashDescription: read('splashDescription'),
      keyBenefits: read('keyBenefits'),
      mandatoryNote: read('mandatoryNote'),
      asoKeywords: read('asoKeywords'),
      rubricScore: score,
      nonComplianceFlags: read('nonComplianceFlags'),
      batchRunDate: read('batchRunDate'),
    });
  }

  return { rows, skipped };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((value) => value.trim().length > 0));
}

export function toDecisionCsv(rows: AuditRow[]): string {
  const header = [
    'Product Name',
    'Rubric Score',
    'Decision',
    'Non-Compliance Flags',
    'Batch Run Date',
  ];
  const lines = rows.map((row) =>
    [row.productName, String(row.rubricScore), DECISION_LABEL[classify(row)], row.nonComplianceFlags, row.batchRunDate]
      .map(csvCell)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
