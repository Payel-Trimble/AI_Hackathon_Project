import {
  ModusWcAlert,
  ModusWcBadge,
  ModusWcButton,
  ModusWcCard,
  ModusWcIcon,
  ModusWcNavbar,
  ModusWcTextInput,
  ModusWcThemeSwitcher,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  classify,
  decisionDetail,
  listingHasCategory,
  parseAuditCsv,
  parseList,
  publisherEmail,
  rubricCategoryStats,
  toDecisionCsv,
  type AuditRow,
  type RubricSeverity,
} from './audit';
import { SAMPLE_SOURCE, sampleAudits } from './sampleAudits';

const SEVERITY_LABEL: Record<RubricSeverity, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const SEVERITY_COLOR: Record<RubricSeverity, 'default' | 'tertiary' | 'warning' | 'danger'> = {
  none: 'default',
  low: 'tertiary',
  medium: 'warning',
  high: 'danger',
};

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function formatDecimalPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

const BENCHMARK_SCORE = 8;

type ReviewStatus = 'not-reviewed' | 'reviewed' | 'sent';

const REVIEW_STATUSES: ReviewStatus[] = ['not-reviewed', 'reviewed', 'sent'];

const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  'not-reviewed': 'Not reviewed',
  reviewed: 'Reviewed',
  sent: 'Sent mail to Publisher',
};

const REVIEW_BADGE_COLOR: Record<ReviewStatus, 'warning' | 'success' | 'primary'> = {
  'not-reviewed': 'warning',
  reviewed: 'success',
  sent: 'primary',
};

const REVIEW_STATUS_RANK: Record<ReviewStatus, number> = {
  'not-reviewed': 0,
  sent: 1,
  reviewed: 2,
};

function byPriority(a: AuditRow, b: AuditRow): number {
  return a.rubricScore - b.rubricScore || a.productName.localeCompare(b.productName);
}

export default function App() {
  const fileInput = useRef<HTMLInputElement>(null);
  const categoryTableRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<AuditRow[]>(sampleAudits);
  const [source, setSource] = useState(SAMPLE_SOURCE);
  const [usingSample, setUsingSample] = useState(true);
  const [error, setError] = useState('');
  const [skipped, setSkipped] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [publisherIndex, setPublisherIndex] = useState(0);
  const [reviewerIndex, setReviewerIndex] = useState(0);
  const [reviewerQuery, setReviewerQuery] = useState('');
  const [reviewStatus, setReviewStatus] = useState<Record<number, ReviewStatus>>({});
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [copied, setCopied] = useState(false);

  function statusOf(index: number): ReviewStatus {
    return reviewStatus[index] ?? 'not-reviewed';
  }

  function updateReviewStatus(index: number, status: ReviewStatus) {
    setReviewStatus((current) => ({ ...current, [index]: status }));
  }

  useEffect(() => {
    if (!categoryId) return;
    categoryTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [categoryId]);

  const categories = useMemo(() => rubricCategoryStats(rows), [rows]);
  const summary = useMemo(() => {
    const total = rows.length;
    const average = total === 0 ? 0 : rows.reduce((sum, row) => sum + row.rubricScore, 0) / total;
    const critical = rows.filter((row) => classify(row) === 'partner').length;
    const passing = rows.filter((row) => row.rubricScore >= BENCHMARK_SCORE).length;
    return {
      total,
      averageLabel: total === 0 ? '—' : `${average.toFixed(1)} / 10`,
      critical,
      passRateLabel: total === 0 ? '—' : formatDecimalPercent(passing / total),
      batchLabel: `${total} ${total === 1 ? 'Integration' : 'Integrations'} Batched`,
    };
  }, [rows]);
  const categoryListings = useMemo(() => {
    if (!categoryId) return [];
    return rows
      .map((row, index) => ({
        row,
        index,
        updates: parseList(row.nonComplianceFlags).length,
      }))
      .filter(({ row }) => listingHasCategory(row, categoryId))
      .sort(
        (a, b) =>
          a.row.rubricScore - b.row.rubricScore ||
          b.updates - a.updates ||
          a.row.productName.localeCompare(b.row.productName),
      )
      .map(({ row, index, updates }) => ({
        index,
        productName: row.productName,
        rubricScore: formatScore(row.rubricScore),
        updates: String(updates),
        flags: parseList(row.nonComplianceFlags).join(', ') || 'None',
        batchRunDate: row.batchRunDate || 'Undated',
      }));
  }, [rows, categoryId]);

  const publisherQueue = useMemo(() => {
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => classify(row) === 'partner')
      .sort((a, b) => byPriority(a.row, b.row))
      .slice(0, 5);
  }, [rows]);

  const reviewCounts = useMemo(() => {
    const counts: Record<ReviewStatus, number> = { 'not-reviewed': 0, reviewed: 0, sent: 0 };
    rows.forEach((_, index) => {
      counts[reviewStatus[index] ?? 'not-reviewed'] += 1;
    });
    return counts;
  }, [rows, reviewStatus]);

  const reviewerQueue = useMemo(() => {
    const needle = reviewerQuery.trim().toLowerCase();
    return rows
      .map((row, index) => ({ row, index, status: reviewStatus[index] ?? 'not-reviewed' }))
      .filter(({ status }) => statusFilter === 'all' || status === statusFilter)
      .filter(({ row }) => {
        if (!needle) return true;
        return (
          row.productName.toLowerCase().includes(needle) ||
          row.optimizedTitle.toLowerCase().includes(needle)
        );
      })
      .sort(
        (a, b) => REVIEW_STATUS_RANK[a.status] - REVIEW_STATUS_RANK[b.status] || byPriority(a.row, b.row),
      );
  }, [rows, reviewerQuery, reviewStatus, statusFilter]);

  const selectedPublisher = publisherQueue.find((item) => item.index === publisherIndex) ?? publisherQueue[0];
  const selectedReviewer = reviewerQueue.find((item) => item.index === reviewerIndex) ?? reviewerQueue[0];
  const email = selectedPublisher ? publisherEmail(selectedPublisher.row) : '';

  function selectCategory(id: string) {
    setCategoryId(id);
    setCopied(false);
  }

  async function copyEmail() {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (selectedPublisher) updateReviewStatus(selectedPublisher.index, 'sent');
    } catch {
      setCopied(false);
    }
  }

  function importCsv(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseAuditCsv(String(reader.result ?? ''));
        if (parsed.rows.length === 0) {
          setError('No listing rows were found in that CSV.');
          return;
        }
        setRows(parsed.rows);
        setSource(`${file.name} · ${parsed.rows.length} listings`);
        setUsingSample(false);
        setSkipped(parsed.skipped);
        setError('');
        setCategoryId(null);
        setReviewerQuery('');
        setReviewStatus({});
        setStatusFilter('all');
        setPublisherIndex(0);
        setReviewerIndex(0);
        setCopied(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not read that CSV.');
      }
    };
    reader.readAsText(file);
  }

  function exportDecisions() {
    const csv = toDecisionCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'marketplace-aso-decisions.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function useSample() {
    setRows(sampleAudits);
    setSource(SAMPLE_SOURCE);
    setUsingSample(true);
    setSkipped(0);
    setError('');
    setCategoryId(null);
    setReviewerQuery('');
    setReviewStatus({});
    setStatusFilter('all');
    setPublisherIndex(0);
    setReviewerIndex(0);
    setCopied(false);
  }

  const publisherHeading =
    publisherQueue.length === 1
      ? '1 listing the publisher needs to update'
      : `Top ${publisherQueue.length} listings the publisher needs to update`;

  return (
    <>
      <div className="nav-shell">
        <ModusWcNavbar
          logoName="trimble"
          userCard={{ name: 'Marketplace Review', email: 'marketplace@trimble.com' }}
          visibility={{
            ai: false,
            apps: false,
            help: false,
            logo: true,
            mainMenu: false,
            notifications: false,
            search: false,
            searchInput: false,
            user: false,
          }}
        >
          <div slot="center" className="nav-title">
            <ModusWcTypography
              hierarchy="p"
              size="lg"
              weight="semibold"
              label="Marketplace ASO Review"
            />
          </div>
          <div slot="end">
            <ModusWcThemeSwitcher />
          </div>
        </ModusWcNavbar>
      </div>

      <main className="page">
        <section className="leadership-summary" aria-label="Audit summary">
          <div className="leadership-header">
            <ModusWcTypography
              hierarchy="h1"
              size="xl"
              weight="semibold"
              label="Trimble Marketplace ASO Audit Reviewer Dashboard"
            />
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              label="Operational review console: reviewer workload queues, compliance rubric diagnostics, and automated partner outreach."
            />
          </div>
          <div className="leadership-metrics">
            <div className="leadership-metric">
              <ModusWcTypography className="leadership-kicker" hierarchy="p" size="xs" weight="semibold" label="Average ASO score" />
              <ModusWcTypography className="leadership-figure" hierarchy="p" size="3xl" weight="bold" label={summary.averageLabel} />
              <ModusWcTypography
                className="leadership-subline"
                hierarchy="p"
                size="sm"
                label={`Benchmark Target: ${BENCHMARK_SCORE.toFixed(1)} / 10`}
              />
            </div>
            <div className="leadership-metric">
              <ModusWcTypography className="leadership-kicker" hierarchy="p" size="xs" weight="semibold" label="Total audited listings" />
              <ModusWcTypography className="leadership-figure" hierarchy="p" size="3xl" weight="bold" label={String(summary.total)} />
              <ModusWcTypography className="leadership-subline" hierarchy="p" size="sm" label={summary.batchLabel} />
            </div>
            <div className="leadership-metric">
              <ModusWcTypography className="leadership-kicker" hierarchy="p" size="xs" weight="semibold" label="Critical queue count" />
              <ModusWcTypography
                className={summary.critical > 0 ? 'leadership-figure leadership-figure-critical' : 'leadership-figure'}
                hierarchy="p"
                size="3xl"
                weight="bold"
                label={String(summary.critical)}
              />
            </div>
            <div className="leadership-metric">
              <ModusWcTypography className="leadership-kicker" hierarchy="p" size="xs" weight="semibold" label="Compliance pass rate" />
              <ModusWcTypography className="leadership-figure" hierarchy="p" size="3xl" weight="bold" label={summary.passRateLabel} />
            </div>
          </div>
        </section>

        {usingSample ? (
          <ModusWcAlert
            variant="info"
            alertTitle="Sample audit batch"
            alertDescription="Import the Google Sheets CSV to load a real audit run. The sample batch shows publisher follow-up, reviewer workload, and rubric categories."
          />
        ) : (
          <ModusWcAlert
            variant="success"
            alertTitle="Audit sheet loaded"
            alertDescription={
              skipped > 0
                ? `${source}. ${skipped} rows were skipped because the product name or score was missing.`
                : source
            }
          />
        )}
        {error ? <ModusWcAlert variant="error" alertTitle="Something needs attention" alertDescription={error} /> : null}

        <div className="toolbar">
          <div className="toolbar-actions">
            <ModusWcButton color="tertiary" variant="outlined" onButtonClick={() => fileInput.current?.click()}>
              <ModusWcIcon decorative name="upload" size="sm" />
              Import audit CSV
            </ModusWcButton>
            <ModusWcButton color="tertiary" variant="outlined" onButtonClick={exportDecisions}>
              <ModusWcIcon decorative name="download" size="sm" />
              Export decisions
            </ModusWcButton>
            {usingSample ? null : (
              <ModusWcButton color="tertiary" variant="outlined" onButtonClick={useSample}>
                Use sample batch
              </ModusWcButton>
            )}
          </div>
        </div>
        <input
          ref={fileInput}
          className="hidden-input"
          type="file"
          accept=".csv,text/csv"
          aria-label="Import audit CSV"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) importCsv(file);
            event.target.value = '';
          }}
        />

        <section className="rubric-section">
          <ModusWcTypography hierarchy="h1" size="2xl" label="Rubric categories" />
          <ModusWcTypography
            hierarchy="p"
            label={`Select a category to list every listing with that gap. Failure rate is the share of ${rows.length} listings with that flag. Severity is Low under 20%, Medium under 40%, and High at 40% or more. Source: ${source}.`}
          />
          <div className="child-stack">
            <div>
              <ModusWcButton
                color="tertiary"
                variant="outlined"
                pressed={categoryId === null}
                onButtonClick={() => {
                  setCategoryId(null);
                  setCopied(false);
                }}
              >
                All categories
              </ModusWcButton>
            </div>
            {categories.map((category) => {
              const active = categoryId === category.id;
              return (
                <div
                  key={category.id}
                  className="child-stack"
                  onClickCapture={(event) => {
                    const element = event.target instanceof Element ? event.target : null;
                    if (element?.closest('table')) return;
                    selectCategory(category.id);
                  }}
                >
                <button
                  type="button"
                  className="queue-button"
                  aria-pressed={active}
                >
                  <div className="metric-line">
                    <ModusWcTypography hierarchy="p" weight="semibold" label={category.label} />
                    <ModusWcTypography
                      hierarchy="p"
                      size="sm"
                      label={`${category.count} ${category.count === 1 ? 'flag' : 'flags'}`}
                    />
                    <ModusWcTypography
                      hierarchy="p"
                      size="sm"
                      label={`${formatPercent(category.failureRate)} failure`}
                    />
                    <div className="bar-track" aria-hidden="true">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.max(category.failureRate * 100, category.count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <ModusWcBadge
                      color={SEVERITY_COLOR[category.severity]}
                      customClass=""
                      size="sm"
                      variant={category.severity === 'none' ? 'outlined' : 'filled'}
                    >
                      {SEVERITY_LABEL[category.severity]}
                    </ModusWcBadge>
                  </div>
                </button>
                {active ? (
                  <div ref={categoryTableRef} className="table-scroll">
                    <table className="listing-table">
                      <caption>
                        {categoryListings.length === 1
                          ? `1 listing flagged for ${category.label}`
                          : `All ${categoryListings.length} listings flagged for ${category.label}`}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Product name</th>
                          <th scope="col">Rubric score</th>
                          <th scope="col">Updates needed</th>
                          <th scope="col">Flags</th>
                          <th scope="col">Batch run date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryListings.length === 0 ? (
                          <tr>
                            <td colSpan={5}>No listing in this batch has that gap.</td>
                          </tr>
                        ) : (
                          categoryListings.map((listing) => (
                            <tr
                              key={`${listing.productName}-${listing.index}`}
                              onClick={() => {
                                setPublisherIndex(listing.index);
                                setReviewerIndex(listing.index);
                                setCopied(false);
                              }}
                            >
                              <td>{listing.productName}</td>
                              <td>{listing.rubricScore}</td>
                              <td>{listing.updates}</td>
                              <td>{listing.flags}</td>
                              <td>{listing.batchRunDate}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <div className="review-layout">
          <ModusWcCard bordered={false} padding="comfortable">
            <ModusWcTypography
              slot="title"
              hierarchy="h2"
              size="xl"
              label={publisherQueue.length === 0 ? 'No publisher updates in this view' : publisherHeading}
            />
            <ModusWcTypography
              hierarchy="p"
              size="sm"
              label="These are the five weakest listings. The publisher who submitted each one needs to update the source description."
            />
            {publisherQueue.length === 0 ? (
              <ModusWcAlert
                variant="info"
                alertTitle="Nothing for the publisher in this category"
                alertDescription="Choose another rubric category, or clear the filter to see the top five."
              />
            ) : (
              <div className="child-stack">
                {publisherQueue.map(({ row, index }, position) => {
                  const flags = parseList(row.nonComplianceFlags);
                  return (
                    <button
                      key={`${row.productName}-${index}`}
                      type="button"
                      className="queue-button"
                      aria-pressed={selectedPublisher?.index === index}
                      onClick={() => {
                        setPublisherIndex(index);
                        setCopied(false);
                      }}
                    >
                      <div className="queue-meta">
                        <ModusWcTypography
                          hierarchy="p"
                          weight="semibold"
                          label={`${position + 1}. ${row.productName}`}
                        />
                        <ModusWcBadge color="danger" customClass="" size="sm" variant="filled">
                          {formatScore(row.rubricScore)}
                        </ModusWcBadge>
                      </div>
                      <ModusWcTypography
                        hierarchy="p"
                        size="sm"
                        label={`${flags.join(' · ') || 'Thin description'} · ${row.batchRunDate || 'Undated'}`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </ModusWcCard>

          <ModusWcCard bordered={false} padding="comfortable">
            <ModusWcTypography slot="title" hierarchy="h2" size="xl" label="Email to the publisher" />
            {selectedPublisher ? (
              <div className="child-stack">
                <ModusWcTypography
                  hierarchy="p"
                  label={`Draft for ${selectedPublisher.row.productName}. The audit sheet does not include the publisher’s address, so paste this into the message to the person who submitted the listing.`}
                />
                <ModusWcButton color="primary" onButtonClick={() => void copyEmail()}>
                  <ModusWcIcon decorative name="copy" size="sm" />
                  {copied ? 'Copied' : 'Copy email'}
                </ModusWcButton>
                <pre className="email-draft">{email}</pre>
              </div>
            ) : (
              <ModusWcTypography hierarchy="p" label="Select a listing the publisher needs to update." />
            )}
          </ModusWcCard>
        </div>

        <section className="rubric-section">
          <ModusWcTypography hierarchy="h2" size="xl" label="Reviewer workload" />
          <ModusWcTypography
            hierarchy="p"
            size="sm"
            label={
              reviewCounts['not-reviewed'] === 1
                ? '1 listing is actively in review.'
                : `${reviewCounts['not-reviewed']} listings are actively in review.`
            }
          />
          <div className="status-grid">
            {REVIEW_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className="queue-button"
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter((current) => (current === status ? 'all' : status))}
              >
                <ModusWcTypography hierarchy="p" size="sm" label={REVIEW_STATUS_LABEL[status]} />
                <ModusWcTypography hierarchy="p" size="2xl" weight="bold" label={String(reviewCounts[status])} />
              </button>
            ))}
          </div>
          <div className="search-field">
            <ModusWcTextInput
              label="Search reviewer queue"
              placeholder="Product or title"
              value={reviewerQuery}
              includeSearch
              onInputChange={(event: CustomEvent) => {
                const value = event.detail?.target?.value || '';
                setReviewerQuery(value);
              }}
            />
          </div>
          {reviewerQueue.length === 0 ? (
            <ModusWcAlert
              variant="info"
              alertTitle="No listings in this view"
              alertDescription="Clear the search or choose another review state."
            />
          ) : (
            <div className="review-layout">
              <div className="queue-scroll child-stack">
                {reviewerQueue.map(({ row, index, status }) => {
                  const flags = parseList(row.nonComplianceFlags);
                  return (
                    <button
                      key={`${row.productName}-${index}`}
                      type="button"
                      className="queue-button"
                      aria-pressed={selectedReviewer?.index === index}
                      onClick={() => setReviewerIndex(index)}
                    >
                      <div className="queue-meta">
                        <ModusWcTypography hierarchy="p" weight="semibold" label={row.productName} />
                        <ModusWcBadge color={REVIEW_BADGE_COLOR[status]} customClass="" size="sm" variant="filled">
                          {REVIEW_STATUS_LABEL[status]}
                        </ModusWcBadge>
                      </div>
                      <ModusWcTypography
                        hierarchy="p"
                        size="sm"
                        label={`Score ${formatScore(row.rubricScore)} · ${flags.join(' · ') || 'No compliance flags'}`}
                      />
                    </button>
                  );
                })}
              </div>
              {selectedReviewer ? (
                <ReviewerDetail
                  row={selectedReviewer.row}
                  status={statusOf(selectedReviewer.index)}
                  onStatus={(status) => updateReviewStatus(selectedReviewer.index, status)}
                />
              ) : null}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function ReviewerDetail({
  row,
  status,
  onStatus,
}: {
  row: AuditRow;
  status: ReviewStatus;
  onStatus: (status: ReviewStatus) => void;
}) {
  const benefits = parseList(row.keyBenefits);
  return (
    <div className="child-stack">
      <div className="queue-meta">
        <ModusWcTypography hierarchy="h3" size="lg" label={row.optimizedTitle} />
        <ModusWcBadge color={REVIEW_BADGE_COLOR[status]} customClass="" size="sm" variant="filled">
          {REVIEW_STATUS_LABEL[status]}
        </ModusWcBadge>
      </div>
      <div className="chip-row">
        {REVIEW_STATUSES.map((next) => (
          <ModusWcButton
            key={next}
            color="tertiary"
            variant="outlined"
            pressed={status === next}
            onButtonClick={() => onStatus(next)}
          >
            {REVIEW_STATUS_LABEL[next]}
          </ModusWcButton>
        ))}
      </div>
      <ModusWcTypography hierarchy="p" label={decisionDetail(row)} />
      <ModusWcTypography hierarchy="h4" size="md" weight="semibold" label="Brief overview" />
      <ModusWcTypography hierarchy="p" label={row.briefOverview || 'No overview in this row.'} />
      <ModusWcTypography hierarchy="h4" size="md" weight="semibold" label="Splash description" />
      <ModusWcTypography hierarchy="p" label={row.splashDescription || 'No splash description in this row.'} />
      <ModusWcTypography hierarchy="h4" size="md" weight="semibold" label="Key benefits" />
      {benefits.length > 0 ? (
        benefits.map((benefit) => <ModusWcTypography key={benefit} hierarchy="p" label={benefit} />)
      ) : (
        <ModusWcTypography hierarchy="p" label="No benefits in this row." />
      )}
    </div>
  );
}
