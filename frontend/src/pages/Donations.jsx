import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HeartHandshake,
  DollarSign,
  Package,
  TrendingUp,
  CalendarRange,
  Printer,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, isLiveApiSession, getApiErrorMessage } from '../utils/helpers';
import { getMyDonationData, getAdminDonationStats } from '../api/orderApi';
import {
  markPaymentsSeen,
  clearPaymentSessionHint
} from '../utils/notificationPrefs';

const mockDonations = [
  {
    id: 'DON-001',
    donor: 'Anonymous',
    type: 'Monetary',
    amount: 500,
    date: '2026-03-20',
    status: 'Completed'
  },
  {
    id: 'DON-002',
    donor: 'Emma Wilson',
    type: 'Product',
    items: '500 packs of pads',
    date: '2026-03-18',
    status: 'Received'
  },
  {
    id: 'DON-003',
    donor: 'Local Business Inc',
    type: 'Monetary',
    amount: 2000,
    date: '2026-03-10',
    status: 'Completed'
  }
];

function statusPillClass(status) {
  if (status === 'Completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Pending') return 'bg-amber-100 text-amber-700';
  if (status === 'Received') return 'bg-emerald-50 text-emerald-800';
  return 'bg-red-100 text-red-700';
}

/** Local calendar range for period preset: `day` = today, `week` = Mon–Sun, `month`, `year`. */
function getDonationPeriodRangeMs(preset) {
  if (!preset || preset === 'all') return null;
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (preset === 'day') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }
  if (preset === 'week') {
    const dow = now.getDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    start.setDate(now.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }
  if (preset === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setFullYear(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }
  if (preset === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setFullYear(now.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }
  return null;
}

function donationInPeriod(dateIso, preset) {
  const range = getDonationPeriodRangeMs(preset);
  if (!range) return true;
  const t = new Date(dateIso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= range.start && t <= range.end;
}

const DONATION_PERIOD_LABELS = {
  all: 'All time',
  day: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year'
};

function contributionTextForDonationRow(donation, isLiveRow) {
  if (isLiveRow) {
    return `${formatCurrency(donation.amount)} · ${(donation.units || 0).toLocaleString()} items`;
  }
  if (donation.type === 'Monetary' && donation.amount != null) {
    return formatCurrency(donation.amount);
  }
  return String(donation.items || '—');
}

function buildDonationSearchHaystack(donation, isLiveRow) {
  const contributionText = contributionTextForDonationRow(donation, isLiveRow).replace(' · ', ' ');
  const parts = [
    donation.id,
    donation.donor,
    donation.type,
    donation.status,
    donation.contribution,
    contributionText,
    formatDate(donation.date),
    String(donation.amount ?? ''),
    String(donation.units ?? '')
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function periodLabelFromKey(periodKey) {
  const [y, m] = periodKey.split('-').map(Number);
  if (!y || !m) return periodKey;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

/** Demo / fallback: group table rows by calendar month (UTC). Live rows: completed only (paid). */
function buildPeriodSummaryFromRows(rows, isLiveRow) {
  const source = isLiveRow ? rows.filter((r) => r.status === 'Completed') : rows;
  const map = new Map();
  for (const r of source) {
    const d = new Date(r.date);
    if (Number.isNaN(d.getTime())) continue;
    const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!map.has(period)) {
      map.set(period, { period, label: periodLabelFromKey(period), totalAmount: 0, units: 0, orderCount: 0 });
    }
    const row = map.get(period);
    row.orderCount += 1;
    if (isLiveRow) {
      row.totalAmount += Number(r.amount) || 0;
      row.units += Number(r.units) || 0;
    } else if (r.type === 'Monetary' && r.amount != null) {
      row.totalAmount += Number(r.amount) || 0;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.period.localeCompare(a.period));
}

const ORG_NAME = 'PeriodPal';

/** Clears the active print payload via the passed React setter after the browser print dialog closes. */
function schedulePrintSlice(clearPrintState, options = {}) {
  const title = options.title || 'PeriodPal — Donation summary report';
  const prevTitle = document.title;
  window.setTimeout(() => {
    document.title = title;
    document.body.classList.add('print-donation-slice-only');
    const cleanup = () => {
      document.body.classList.remove('print-donation-slice-only');
      document.title = prevTitle;
      clearPrintState(null);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }, 150);
}

function orderPeriodKey(dateIso) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function filterOrdersForPeriod(tableRows, periodKey, live) {
  return tableRows.filter((r) => {
    if (orderPeriodKey(r.date) !== periodKey) return false;
    if (live) return r.status === 'Completed';
    return true;
  });
}

function filterOrdersAllReport(tableRows, live) {
  if (live) return tableRows.filter((r) => r.status === 'Completed');
  return [...tableRows];
}

function normalizeOrderForPrint(r, live) {
  const orderId = r.id || r.orderId || '—';
  const orderTotal = Number(r.amount) || 0;
  if (live && Array.isArray(r.lines) && r.lines.length > 0) {
    return {
      orderId,
      date: r.date,
      status: r.status,
      lines: r.lines.map((l) => ({
        productName: l.productName || 'Product',
        description: l.description || '',
        qty: Number(l.qty) || 0,
        unitPrice: Number(l.unitPrice) || 0,
        lineTotal:
          l.lineTotal != null ? Number(l.lineTotal) : (Number(l.qty) || 0) * (Number(l.unitPrice) || 0)
      })),
      orderTotal
    };
  }
  if (!live) {
    const lines =
      r.type === 'Monetary'
        ? [
            {
              productName: 'Monetary contribution',
              description: 'Demo record',
              qty: 1,
              unitPrice: orderTotal,
              lineTotal: orderTotal
            }
          ]
        : [
            {
              productName: r.items || 'Product donation',
              description: r.type ? String(r.type) : '',
              qty: 1,
              unitPrice: orderTotal,
              lineTotal: orderTotal
            }
          ];
    return { orderId, date: r.date, status: r.status, lines, orderTotal };
  }
  const units = Math.max(Number(r.units) || 1, 1);
  const unitPrice = orderTotal / units;
  return {
    orderId,
    date: r.date,
    status: r.status,
    lines: [
      {
        productName: r.contribution || 'Donation supplies',
        description: '',
        qty: units,
        unitPrice,
        lineTotal: orderTotal
      }
    ],
    orderTotal
  };
}

function formatReportGeneratedAt() {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(new Date());
}

function OfficialDonationPrint({
  donorDisplayName,
  donorEmail,
  mode,
  periodLabel,
  ordersNormalized,
  footerTotals,
  periodBreakdown
}) {
  const sumFromOrders = ordersNormalized.reduce((s, o) => s + (Number(o.orderTotal) || 0), 0);
  const unitsFromOrders = ordersNormalized.reduce(
    (s, o) => s + o.lines.reduce((t, l) => t + (Number(l.qty) || 0), 0),
    0
  );
  const showOrderDetail = ordersNormalized.length > 0;
  const grandAmountFinal = showOrderDetail ? sumFromOrders : Number(footerTotals?.amount) || 0;
  const grandUnits = showOrderDetail ? unitsFromOrders : Number(footerTotals?.units) || 0;

  return (
    <div className="donation-official-print">
      <header className="dop-header">
        <h1 className="dop-title">Donation Summary Report</h1>
        <p className="dop-org">{ORG_NAME}</p>
      </header>

      <section className="dop-criteria">
        <p className="dop-criteria-heading">Report criteria</p>
        <ul className="dop-criteria-list">
          <li>
            <span className="dop-k">Donor:</span> {donorDisplayName}
          </li>
          {donorEmail ? (
            <li>
              <span className="dop-k">Email:</span> {donorEmail}
            </li>
          ) : null}
          <li>
            <span className="dop-k">Report generated:</span> {formatReportGeneratedAt()}
          </li>
          <li>
            <span className="dop-k">Scope:</span>{' '}
            {mode === 'period'
              ? `Calendar month ${periodLabel} (UTC)`
              : 'All completed donation orders in this export'}
          </li>
          {mode === 'period' && footerTotals ? (
            <li>
              <span className="dop-k">Period totals (orders / units):</span>{' '}
              {footerTotals.orders} orders · {(footerTotals.units ?? 0).toLocaleString()} units
            </li>
          ) : null}
        </ul>
      </section>

      <hr className="dop-rule" />

      {!showOrderDetail ? (
        <p className="dop-empty">
          No line-level orders matched this view. Period totals are shown below.
        </p>
      ) : (
        ordersNormalized.map((order) => (
          <section key={order.orderId} className="dop-order-block">
            <div className="dop-order-wrap">
              <div className="dop-order-banner">
                <span className="dop-order-banner-main">Order {order.orderId}</span>
                <span className="dop-order-banner-meta">
                  {formatDate(order.date)} · Status: {order.status} · Payment total:{' '}
                  {formatCurrency(order.orderTotal)}
                </span>
              </div>
              <table className="dop-table dop-order-table">
              <thead>
                <tr>
                  <th className="dop-th dop-col-item">Item</th>
                  <th className="dop-th dop-col-desc">Description</th>
                  <th className="dop-th dop-col-qty">Qty</th>
                  <th className="dop-th dop-col-price">Unit price</th>
                  <th className="dop-th dop-col-amt">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="dop-td dop-col-item">{line.productName}</td>
                    <td className="dop-td dop-col-desc">{line.description || '—'}</td>
                    <td className="dop-td dop-col-qty dop-num">{(line.qty ?? 0).toLocaleString()}</td>
                    <td className="dop-td dop-col-price dop-num">{formatCurrency(line.unitPrice)}</td>
                    <td className="dop-td dop-col-amt dop-num">{formatCurrency(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="dop-tfoot-row">
                  <td className="dop-td dop-tfoot-label" colSpan={4}>
                    Total for order {order.orderId}
                  </td>
                  <td className="dop-td dop-col-amt dop-num dop-strong">
                    {formatCurrency(order.orderTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          </section>
        ))
      )}

      {mode === 'total' && periodBreakdown?.length > 0 ? (
        <>
          <h2 className="dop-subtitle">Summary by calendar month (UTC)</h2>
          <table className="dop-table dop-summary-period">
            <thead>
              <tr>
                <th className="dop-th">Period</th>
                <th className="dop-th dop-num">Orders</th>
                <th className="dop-th dop-num">Amount</th>
                <th className="dop-th dop-num">Units</th>
              </tr>
            </thead>
            <tbody>
              {periodBreakdown.map((pr) => (
                <tr key={pr.period}>
                  <td className="dop-td">{pr.label || pr.period}</td>
                  <td className="dop-td dop-num">{pr.orderCount}</td>
                  <td className="dop-td dop-num">{formatCurrency(pr.totalAmount)}</td>
                  <td className="dop-td dop-num">{(pr.units ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="dop-tfoot-row">
                <td className="dop-td dop-strong">Total (all periods)</td>
                <td className="dop-td dop-num dop-strong">{footerTotals?.orders ?? '—'}</td>
                <td className="dop-td dop-num dop-strong">
                  {formatCurrency(footerTotals?.amount ?? 0)}
                </td>
                <td className="dop-td dop-num dop-strong">
                  {(footerTotals?.units ?? 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </>
      ) : null}

      <footer className="dop-grand">
        <div className="dop-grand-row">
          <span className="dop-grand-label">
            Grand total
            {mode === 'period' ? ` (${periodLabel})` : ' (all orders in this report)'}
          </span>
          <span className="dop-grand-value">{formatCurrency(grandAmountFinal)}</span>
        </div>
        <p className="dop-grand-sub">
          Total product units (line items): {grandUnits.toLocaleString()}
        </p>
        <p className="dop-footer-note">
          This report reflects completed shop checkouts recorded in {ORG_NAME}. For questions, contact
          support through your account.
        </p>
      </footer>
    </div>
  );
}

function RecentDonationsListPrint({
  reportTitle,
  preparedForName,
  preparedEmail,
  criteriaLines,
  rows,
  showDonorColumn,
  summary
}) {
  const colCount = showDonorColumn ? 6 : 5;

  return (
    <div className="donation-official-print">
      <header className="dop-header">
        <h1 className="dop-title">Recent Donations Report</h1>
        <p className="dop-org">{ORG_NAME}</p>
        <p className="dop-org" style={{ fontSize: '11pt', fontWeight: 500, marginTop: 8 }}>
          {reportTitle}
        </p>
      </header>

      <section className="dop-criteria">
        <p className="dop-criteria-heading">Report criteria</p>
        <ul className="dop-criteria-list">
          <li>
            <span className="dop-k">Generated:</span> {formatReportGeneratedAt()}
          </li>
          <li>
            <span className="dop-k">Prepared by:</span> {preparedForName}
          </li>
          {preparedEmail ? (
            <li>
              <span className="dop-k">Email:</span> {preparedEmail}
            </li>
          ) : null}
          {criteriaLines.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </section>

      <hr className="dop-rule" />

      <table className="dop-table dop-order-table">
        <thead>
          <tr>
            <th className="dop-th dop-col-item">ID</th>
            {showDonorColumn ? <th className="dop-th dop-col-item">Donor</th> : null}
            <th className="dop-th">Type</th>
            <th className="dop-th dop-col-desc">Contribution</th>
            <th className="dop-th">Date</th>
            <th className="dop-th">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="dop-td" colSpan={colCount}>
                No rows match the current filters.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td className="dop-td dop-col-item">{r.id}</td>
                {showDonorColumn ? <td className="dop-td dop-col-item">{r.donor || '—'}</td> : null}
                <td className="dop-td">{r.type}</td>
                <td className="dop-td dop-col-desc">
                  <div>{r.contribution}</div>
                  {r.detail ? (
                    <div style={{ fontSize: '9pt', color: '#64748b', marginTop: 4 }}>{r.detail}</div>
                  ) : null}
                </td>
                <td className="dop-td">{r.date}</td>
                <td className="dop-td">{r.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <footer className="dop-grand" style={{ marginTop: 20 }}>
        <div className="dop-grand-row">
          <span className="dop-grand-label">Rows in this report</span>
          <span className="dop-grand-value">{summary.count}</span>
        </div>
        <div className="dop-grand-row">
          <span className="dop-grand-label">Sum of order totals</span>
          <span className="dop-grand-value">{formatCurrency(summary.totalAmount)}</span>
        </div>
        <div className="dop-grand-row">
          <span className="dop-grand-label">Sum of product units</span>
          <span className="dop-grand-value">{summary.totalUnits.toLocaleString()}</span>
        </div>
        <p className="dop-footer-note">
          This list reflects the same filters as on screen (period, status, search). Official tax or
          accounting records may require additional documentation.
        </p>
      </footer>
    </div>
  );
}

export function Donations() {
  const { user } = useAuth();
  const location = useLocation();
  const isDonor = user?.role === 'donor';
  const isAdmin = user?.role === 'admin';
  const live = isLiveApiSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [donorReportLoaded, setDonorReportLoaded] = useState(false);
  const [printPayload, setPrintPayload] = useState(null);
  const [recentListPrintPayload, setRecentListPrintPayload] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminStats, setAdminStats] = useState(null);
  const [adminRows, setAdminRows] = useState([]);

  const [donationSearch, setDonationSearch] = useState('');
  const [donationPeriod, setDonationPeriod] = useState('all');
  const [donationStatus, setDonationStatus] = useState('all');

  useEffect(() => {
    const bump = () => setRefreshKey((k) => k + 1);
    window.addEventListener('periodpal:donations-updated', bump);
    return () => window.removeEventListener('periodpal:donations-updated', bump);
  }, []);

  useEffect(() => {
    if (!isDonor || !live) {
      setRows([]);
      setStats(null);
      setMonthlyBreakdown([]);
      setDonorReportLoaded(false);
      setError('');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setDonorReportLoaded(false);
      setError('');
      try {
        const { data } = await getMyDonationData(30);
        if (cancelled) return;
        if (data?.success) {
          setRows(data.orders || []);
          setStats(data.stats);
          setMonthlyBreakdown(Array.isArray(data.monthlyBreakdown) ? data.monthlyBreakdown : []);
          setDonorReportLoaded(true);
          const completed = (data.orders || []).filter((r) => r.status === 'Completed');
          if (completed.length > 0 && user?._id) {
            let maxMs = 0;
            for (const r of completed) {
              const ms = Date.parse(r.date);
              if (!Number.isNaN(ms)) maxMs = Math.max(maxMs, ms);
            }
            if (maxMs > 0) {
              markPaymentsSeen(user._id, new Date(maxMs).toISOString());
            }
          }
          clearPaymentSessionHint();
          window.dispatchEvent(new Event('periodpal:notifications-refresh'));
        }
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, 'Could not load your donations.'));
      } finally {
        if (!cancelled) {
          setLoading(false);
          setDonorReportLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDonor, live, refreshKey, user?._id]);

  useEffect(() => {
    if (!isAdmin || !live) {
      setAdminRows([]);
      setAdminStats(null);
      setAdminError('');
      setAdminLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setAdminLoading(true);
      setAdminError('');
      try {
        const { data } = await getAdminDonationStats();
        if (cancelled) return;
        if (data?.success) {
          setAdminStats({
            totalFundsRaised: Number(data.totalFundsRaised) || 0,
            unitsPurchased: Number(data.unitsPurchased) || 0,
            uniqueDonorsCount: Number(data.uniqueDonorsCount) || 0
          });
          setAdminRows(Array.isArray(data.recentDonations) ? data.recentDonations : []);
        }
      } catch (e) {
        if (!cancelled) setAdminError(getApiErrorMessage(e, 'Could not load donation data.'));
      } finally {
        if (!cancelled) setAdminLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, live, refreshKey]);

  const statsLoading = (isDonor && live && loading) || (isAdmin && live && adminLoading);

  const totalContributed = isDonor
    ? !live
      ? 4500
      : stats
        ? stats.totalContributed
        : 0
    : isAdmin
      ? !live
        ? 0
        : adminStats
          ? adminStats.totalFundsRaised
          : 0
      : 125000;
  const productsDonated = isDonor
    ? !live
      ? 1200
      : stats
        ? stats.productUnits
        : 0
    : isAdmin
      ? !live
        ? 0
        : adminStats
          ? adminStats.unitsPurchased
          : 0
      : 45000;
  const peopleReached = isDonor
    ? !live
      ? 14
      : stats
        ? stats.communitiesHelped
        : 0
    : isAdmin
      ? !live
        ? 0
        : adminStats
          ? adminStats.uniqueDonorsCount
          : 0
      : 5000;

  const tableRows =
    isDonor && live ? rows : isAdmin && live ? adminRows : !isDonor && !isAdmin ? mockDonations : [];

  const filteredDonationRows = useMemo(() => {
    const needle = donationSearch.trim().toLowerCase();
    return tableRows.filter((donation) => {
      const isLiveRow =
        (isDonor || isAdmin) && live && donation.contribution !== undefined;
      if (donationStatus !== 'all' && donation.status !== donationStatus) return false;
      if (!donationInPeriod(donation.date, donationPeriod)) return false;
      if (needle && !buildDonationSearchHaystack(donation, isLiveRow).includes(needle)) return false;
      return true;
    });
  }, [tableRows, donationSearch, donationPeriod, donationStatus, isDonor, isAdmin, live]);

  const periodSummary = useMemo(() => {
    if (!isDonor) return [];
    if (live && !donorReportLoaded) return [];
    if (live && donorReportLoaded) {
      if (monthlyBreakdown.length > 0) return monthlyBreakdown;
      return buildPeriodSummaryFromRows(tableRows, true);
    }
    return buildPeriodSummaryFromRows(tableRows, false);
  }, [isDonor, live, donorReportLoaded, monthlyBreakdown, tableRows]);

  useEffect(() => {
    if (location.hash !== '#donation-report' || !isDonor) return;
    const t = window.setTimeout(() => {
      document.getElementById('donation-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => window.clearTimeout(t);
  }, [location.hash, isDonor, loading, donorReportLoaded]);

  const periodFooterTotals = useMemo(
    () => ({
      orders: periodSummary.reduce((s, r) => s + r.orderCount, 0),
      amount: periodSummary.reduce((s, r) => s + (r.totalAmount || 0), 0),
      units: periodSummary.reduce((s, r) => s + (r.units || 0), 0)
    }),
    [periodSummary]
  );

  const donorDisplayName = user?.name || user?.username || 'Donor';

  const handlePrintRecentDonationsReport = () => {
    setPrintPayload(null);
    const criteriaLines = [
      `Period: ${DONATION_PERIOD_LABELS[donationPeriod] ?? donationPeriod}`,
      `Status: ${donationStatus === 'all' ? 'All statuses' : donationStatus}`
    ];
    if (donationSearch.trim()) {
      criteriaLines.push(`Search: "${donationSearch.trim()}"`);
    }
    criteriaLines.push(`Rows in report: ${filteredDonationRows.length}`);

    const printRows = filteredDonationRows.map((donation) => {
      const isLiveRow =
        (isDonor || isAdmin) && live && donation.contribution !== undefined;
      return {
        id: donation.id,
        donor: donation.donor,
        type: donation.type,
        contribution: contributionTextForDonationRow(donation, isLiveRow),
        detail: isLiveRow ? donation.contribution || '' : '',
        date: formatDate(donation.date),
        status: donation.status,
        amountNum: Number(donation.amount) || 0,
        unitsNum: Number(donation.units) || 0
      };
    });

    const summary = {
      count: printRows.length,
      totalAmount: printRows.reduce((s, r) => s + r.amountNum, 0),
      totalUnits: printRows.reduce((s, r) => s + r.unitsNum, 0)
    };

    setRecentListPrintPayload({
      criteriaLines,
      rows: printRows,
      summary,
      showDonorColumn: !isDonor,
      preparedForName: donorDisplayName,
      preparedEmail: user?.email || '',
      reportTitle: isDonor
        ? 'My donations — filtered list'
        : 'Organization donations — filtered list'
    });
    schedulePrintSlice(setRecentListPrintPayload, {
      title: 'PeriodPal — Recent donations report'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            {isDonor ? 'My Donations' : 'Donations & Support'}
          </h1>
          <p className="text-secondary-500 mt-1">
            {isDonor
              ? 'Track your impact and contributions to menstrual equity.'
              : 'Manage incoming donations and community support.'}
          </p>
        </div>

        {isDonor && (
          <Link
            to="/shop"
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/20"
          >
            <HeartHandshake className="h-5 w-5" />
            Shop donation products
          </Link>
        )}
      </div>

      {isDonor && !live && (
        <div className="mb-6 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          Demo sign-in is active. Use your real account (same password you registered with) while the
          API is running to see your own order history. The numbers below are placeholders.
        </div>
      )}

      {isAdmin && !live && (
        <div className="mb-6 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          Demo sign-in is active. Sign in with a real admin session while the API is running to load
          live totals and recent orders from the database.
        </div>
      )}

      {isDonor && live && error && (
        <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {isAdmin && live && adminError && (
        <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {adminError}
        </div>
      )}

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
      >
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100 bg-gradient-to-br from-primary-50 to-white"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-100 text-primary-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-600">
                {isDonor ? 'Total Contributed' : 'Total Funds Raised'}
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {statsLoading ? '…' : formatCurrency(totalContributed)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">
                Products Donated
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {statsLoading
                  ? '…'
                  : isDonor && live
                    ? (productsDonated || 0).toLocaleString()
                    : isAdmin && live
                      ? (productsDonated || 0).toLocaleString()
                      : isDonor
                        ? '1,200'
                        : isAdmin
                          ? '0'
                          : '45,000+'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">
                People Reached
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {statsLoading
                  ? '…'
                  : isDonor && live
                    ? String(peopleReached ?? 0)
                    : isAdmin && live
                      ? String(peopleReached ?? 0)
                      : isDonor
                        ? '14 Communities'
                        : isAdmin
                          ? '0'
                          : '5,000+ Individuals'}
              </p>
              {isDonor && live && !loading && (
                <p className="text-xs text-secondary-500 mt-0.5">
                  Completed donation checkouts
                </p>
              )}
              {isAdmin && live && !adminLoading && (
                <p className="text-xs text-secondary-500 mt-0.5">
                  Unique donors (paid checkouts)
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Period-wise report (View Reports destination for donors) */}
      {isDonor && (
        <motion.div
          id="donation-report"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="scroll-mt-24 bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden mb-8"
        >
          <div className="px-6 py-5 border-b border-secondary-100 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary-50 text-primary-600 mt-0.5">
                <CalendarRange className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-secondary-900">
                  Donation summary by period
                </h2>
                <p className="text-sm text-secondary-500 mt-0.5">
                  Your completed checkouts grouped by calendar month (UTC).
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading && isDonor && live ? (
              <p className="px-6 py-10 text-center text-secondary-500">Loading summary…</p>
            ) : periodSummary.length === 0 ? (
              <p className="px-6 py-10 text-center text-secondary-500">
                No completed donations to summarize yet.{' '}
                <Link to="/shop" className="text-primary-600 font-medium">
                  Fund supplies in the shop
                </Link>
              </p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary-50 border-b border-secondary-100 text-secondary-500 text-sm">
                    <th className="px-6 py-4 font-medium">Period</th>
                    <th className="px-6 py-4 font-medium">Orders</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Product units</th>
                    <th className="px-4 py-4 font-medium w-px text-right no-print">Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {periodSummary.map((row) => (
                    <tr key={row.period} className="hover:bg-secondary-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-secondary-900">
                        {row.label || row.period}
                      </td>
                      <td className="px-6 py-4 text-secondary-700 text-sm">{row.orderCount}</td>
                      <td className="px-6 py-4 text-secondary-900 font-medium text-sm">
                        {formatCurrency(row.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-secondary-700 text-sm">
                        {(row.units ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right no-print">
                        <button
                          type="button"
                          onClick={() => {
                            const ordersRaw = filterOrdersForPeriod(tableRows, row.period, live);
                            const ordersNormalized = ordersRaw.map((r) =>
                              normalizeOrderForPrint(r, live)
                            );
                            setRecentListPrintPayload(null);
                            setPrintPayload({
                              mode: 'period',
                              periodLabel: row.label || row.period,
                              ordersNormalized,
                              footerTotals: {
                                orders: row.orderCount,
                                amount: row.totalAmount,
                                units: row.units
                              },
                              donorDisplayName,
                              donorEmail: user?.email || '',
                              periodBreakdown: undefined
                            });
                            schedulePrintSlice(setPrintPayload, {
                              title: `PeriodPal — Donations ${row.label || row.period}`
                            });
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-secondary-200 bg-white p-2 text-secondary-600 shadow-sm hover:bg-secondary-50 hover:border-secondary-300"
                          aria-label={`Print summary for ${row.label || row.period}`}
                          title="Print this period"
                        >
                          <Printer className="h-4 w-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-secondary-50/80 border-t border-secondary-100 font-medium text-secondary-900 text-sm">
                    <td className="px-6 py-4">Total (all periods shown)</td>
                    <td className="px-6 py-4">{periodFooterTotals.orders}</td>
                    <td className="px-6 py-4">{formatCurrency(periodFooterTotals.amount)}</td>
                    <td className="px-6 py-4">{periodFooterTotals.units.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right no-print">
                      <button
                        type="button"
                        onClick={() => {
                          const ordersRaw = filterOrdersAllReport(tableRows, live);
                          const ordersNormalized = ordersRaw.map((r) =>
                            normalizeOrderForPrint(r, live)
                          );
                          setRecentListPrintPayload(null);
                          setPrintPayload({
                            mode: 'total',
                            periodLabel: '',
                            ordersNormalized,
                            footerTotals: {
                              orders: periodFooterTotals.orders,
                              amount: periodFooterTotals.amount,
                              units: periodFooterTotals.units
                            },
                            donorDisplayName,
                            donorEmail: user?.email || '',
                            periodBreakdown: periodSummary
                          });
                          schedulePrintSlice(setPrintPayload, {
                            title: 'PeriodPal — Full donation report'
                          });
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-secondary-200 bg-white p-2 text-secondary-600 shadow-sm hover:bg-secondary-50 hover:border-secondary-300"
                        aria-label="Print full summary with all periods"
                        title="Print full report"
                      >
                        <Printer className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-secondary-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-secondary-900">
            Recent Donations
          </h2>
          {!statsLoading && tableRows.length > 0 && (
            <button
              type="button"
              onClick={handlePrintRecentDonationsReport}
              className="no-print inline-flex items-center justify-center gap-2 rounded-xl border border-secondary-200 bg-white px-4 py-2.5 text-sm font-medium text-secondary-700 shadow-sm transition-colors hover:bg-secondary-50 hover:border-secondary-300"
            >
              <Printer className="h-4 w-4 shrink-0" aria-hidden />
              Print report
            </button>
          )}
        </div>

        {!statsLoading && tableRows.length > 0 && (
          <div className="px-6 py-4 border-b border-secondary-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="relative w-full lg:max-w-md lg:flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400"
                aria-hidden
              />
              <input
                type="search"
                value={donationSearch}
                onChange={(e) => setDonationSearch(e.target.value)}
                placeholder="Search by ID, donor, amount, status…"
                className="w-full rounded-xl border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 shadow-sm placeholder:text-secondary-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                aria-label="Search donations"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="flex flex-col gap-1 sm:min-w-[140px]">
                <span className="text-xs font-medium text-secondary-500">Period</span>
                <select
                  value={donationPeriod}
                  onChange={(e) => setDonationPeriod(e.target.value)}
                  className="rounded-xl border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-800 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  aria-label="Filter by period"
                >
                  <option value="all">All time</option>
                  <option value="day">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 sm:min-w-[140px]">
                <span className="text-xs font-medium text-secondary-500">Status</span>
                <select
                  value={donationStatus}
                  onChange={(e) => setDonationStatus(e.target.value)}
                  className="rounded-xl border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-800 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Received">Received</option>
                </select>
              </label>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-100 text-secondary-500 text-sm">
                <th className="px-6 py-4 font-medium">ID</th>
                {!isDonor && (
                  <th className="px-6 py-4 font-medium">Donor</th>
                )}
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Contribution</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-secondary-100">
              {statsLoading ? (
                <tr>
                  <td colSpan={isDonor ? 5 : 6} className="px-6 py-12 text-center text-secondary-500">
                    {isDonor ? 'Loading your donations…' : 'Loading donations…'}
                  </td>
                </tr>
              ) : tableRows.length === 0 && isDonor && live ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-secondary-500">
                    No orders yet.{' '}
                    <Link to="/shop" className="text-primary-600 font-medium">
                      Shop donation products
                    </Link>{' '}
                    to create your first entry.
                  </td>
                </tr>
              ) : tableRows.length === 0 && isAdmin && live ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary-500">
                    No orders yet. Completed shop checkouts will appear here.
                  </td>
                </tr>
              ) : tableRows.length > 0 && filteredDonationRows.length === 0 ? (
                <tr>
                  <td colSpan={isDonor ? 5 : 6} className="px-6 py-12 text-center text-secondary-500">
                    <p className="mb-3">No donations match your filters.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setDonationSearch('');
                        setDonationPeriod('all');
                        setDonationStatus('all');
                      }}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredDonationRows.map((donation) => {
                  const isLiveRow =
                    (isDonor || isAdmin) && live && donation.contribution !== undefined;
                  const type = isLiveRow ? donation.type : donation.type;
                  const contributionText = contributionTextForDonationRow(donation, isLiveRow);
                  const detailTitle = isLiveRow ? donation.contribution : '';

                  return (
                    <tr
                      key={isLiveRow ? donation.orderId || donation.id : donation.id}
                      className="hover:bg-secondary-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-secondary-900">
                        {donation.id}
                      </td>

                      {!isDonor && (
                        <td className="px-6 py-4 text-secondary-600">
                          {donation.donor}
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-sm text-secondary-700">
                          {type === 'Monetary' ? (
                            <DollarSign className="h-4 w-4 text-primary-500" />
                          ) : (
                            <Package className="h-4 w-4 text-emerald-500" />
                          )}
                          {type}
                        </span>
                      </td>

                      <td
                        className="px-6 py-4 font-medium text-secondary-900 max-w-[220px]"
                        title={detailTitle || undefined}
                      >
                        <span className="line-clamp-2">{contributionText}</span>
                      </td>

                      <td className="px-6 py-4 text-secondary-600 text-sm">
                        {formatDate(donation.date)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusPillClass(
                            donation.status
                          )}`}
                        >
                          {donation.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {(printPayload || recentListPrintPayload) &&
        createPortal(
          <div id="donation-print-slice" className="donation-print-slice-root" aria-hidden>
            {printPayload ? (
              <OfficialDonationPrint
                donorDisplayName={printPayload.donorDisplayName}
                donorEmail={printPayload.donorEmail}
                mode={printPayload.mode}
                periodLabel={printPayload.periodLabel}
                ordersNormalized={printPayload.ordersNormalized}
                footerTotals={printPayload.footerTotals}
                periodBreakdown={printPayload.periodBreakdown}
              />
            ) : (
              <RecentDonationsListPrint
                reportTitle={recentListPrintPayload.reportTitle}
                preparedForName={recentListPrintPayload.preparedForName}
                preparedEmail={recentListPrintPayload.preparedEmail}
                criteriaLines={recentListPrintPayload.criteriaLines}
                rows={recentListPrintPayload.rows}
                showDonorColumn={recentListPrintPayload.showDonorColumn}
                summary={recentListPrintPayload.summary}
              />
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
