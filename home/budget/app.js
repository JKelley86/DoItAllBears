/* Northstar local client — data is stored in your PocketBase server. */
const PB_URL = 'https://tumid-kiltlike-maia.ngrok-free.dev';
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);
// ngrok's free browser-warning page returns HTML without PocketBase CORS headers.
// This header makes API calls reach PocketBase itself, without changing the server.
pb.beforeSend = function (url, options) {
  options.headers = Object.assign({}, options.headers, { 'ngrok-skip-browser-warning': 'true' });
  return { url, options };
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const pct = (n) => `${(n * 100).toFixed(0)}%`;
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const fmt = value => `${value < 0 ? '−' : '+'}${money.format(Math.abs(value))}`;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

let transactions = [], accounts = [], categories = [], budgets = [], goals = [], debts = [], recurring = [], investmentAccounts = [], holdings = [];
let transactionFilter = 'all';
let displayedMonth = new Date();

/* ---------- small data helpers ---------- */
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function inMonth(dateStr, monthDate) {
  const d = new Date(dateStr);
  return d.getFullYear() === monthDate.getFullYear() && d.getMonth() === monthDate.getMonth();
}
function txInMonth(monthDate) { return transactions.filter(t => inMonth(t.date, monthDate)); }
function sum(arr, fn) { return arr.reduce((s, x) => s + (fn ? fn(x) : x), 0); }
function groupBy(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}
function nameById(items, id, fallback = 'Uncategorized') { const x = items.find(item => item.id === id); return x?.name || fallback; }
function categoryOf(id) { return categories.find(c => c.id === id) || null; }
function firstName(fullName) { return (fullName || '').trim().split(/\s+/)[0] || 'there'; }
function initialsOf(fullName) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}
function timeGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
function workspaceKey() { return `northstar-workspace-${pb.authStore.record?.id || 'anon'}`; }
function currentWorkspaceName() {
  return localStorage.getItem(workspaceKey()) || `${firstName(pb.authStore.record?.name)}'s finances`;
}

/* Monthly income/expense totals for the last N months (oldest first) */
function monthlyTotals(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const m = addMonths(startOfMonth(new Date()), -i);
    const rows = txInMonth(m);
    out.push({
      month: m,
      label: m.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      income: sum(rows.filter(t => t.amount > 0), t => t.amount),
      spend: Math.abs(sum(rows.filter(t => t.amount < 0), t => t.amount)),
    });
  }
  return out;
}

/* Standard loan amortization: months to pay off `balance` at monthly `payment`
   with annual `apr` (percent). Returns {months, totalInterest} or null if payment
   can't cover interest (never pays off). */
function amortize(balance, apr, payment) {
  const r = (apr / 100) / 12;
  if (balance <= 0) return { months: 0, totalInterest: 0 };
  if (payment <= 0) return null;
  if (r === 0) {
    const months = Math.ceil(balance / payment);
    return { months, totalInterest: 0 };
  }
  if (payment <= balance * r) return null; // payment doesn't cover interest
  const months = Math.ceil(-Math.log(1 - (r * balance) / payment) / Math.log(1 + r));
  const totalPaid = months * payment;
  const totalInterest = Math.max(0, totalPaid - balance);
  return { months, totalInterest };
}
function monthsFromNow(n) {
  const d = addMonths(startOfMonth(new Date()), n);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/* ---------- nav / shell ---------- */
const titles = { dashboard: '', transactions: 'Transactions', budget: 'Budget', loans: 'Loans & mortgages', investments: 'Savings & investing', bills: 'Bills & recurring', scenario: 'Scenario lab', reports: 'Reports', learn: 'Learn' };
document.querySelectorAll('[data-page]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showPage(a.dataset.page); }));
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => showPage(b.dataset.go)));
function pageTitleFor(id) {
  if (id === 'dashboard') return `${timeGreeting()}, ${esc(firstName(pb.authStore.record?.name))} <span>☀</span>`;
  if (id === 'budget') return `${displayedMonth.toLocaleDateString('en-US', { month: 'long' })} budget`;
  return titles[id];
}
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.getElementById(id).classList.add('active-page');
  document.querySelectorAll('[data-page]').forEach(x => x.classList.toggle('active', x.dataset.page === id));
  document.getElementById('page-title').innerHTML = pageTitleFor(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toast(message, isError = false) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.append(t); }
  t.textContent = message; t.classList.toggle('error', isError); t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}
async function getAll(collection, options = {}) {
  try { return await pb.collection(collection).getFullList({ sort: '-created', ...options }); }
  catch (err) { console.warn(collection, err); return []; }
}

/* ================= TRANSACTIONS ================= */
function renderTransactions() {
  const activity = document.getElementById('activity-list'), table = document.getElementById('transaction-table');
  const visible = transactions.filter(t => transactionFilter === 'all' || (transactionFilter === 'income' ? t.amount > 0 : transactionFilter === 'expense' ? t.amount < 0 : t.kind === transactionFilter));
  const rows = transactions.slice(0, 4).map(t => `<div class="activity-row"><span class="activity-icon">${t.amount < 0 ? '•' : '$'}</span><div><b>${esc(t.merchant || t.description || 'Transaction')}</b><p>${esc(nameById(categories, t.category, t.kind || 'Other'))} · ${new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div><strong class="${t.amount < 0 ? 'negative' : 'good'}">${fmt(t.amount)}</strong></div>`).join('') || '<p class="empty">No transactions yet. Add your first one to get started.</p>';
  activity.innerHTML = rows;
  table.innerHTML = visible.map(t => `<div class="table-row"><span>${new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><span class="merchant"><i class="merchant-icon">${t.amount < 0 ? '•' : '$'}</i><b>${esc(t.merchant || t.description || 'Transaction')}</b></span><span>${esc(nameById(categories, t.category, t.kind || 'Other'))}</span><span>${esc(nameById(accounts, t.account, '—'))}</span><strong class="${t.amount < 0 ? 'negative' : 'good'}">${fmt(t.amount)}</strong></div>`).join('') || '<p class="empty">No transactions yet.</p>';
}

/* ================= BUDGET ================= */
function renderBudget() {
  const container = document.getElementById('budget-groups');
  const summaryTo = document.getElementById('budget-to'), summaryAssigned = document.getElementById('budget-assigned'), summaryUnassigned = document.getElementById('budget-unassigned');
  if (!container) return;

  const assigned = sum(budgets, b => b.planned_amount || 0);
  const monthIncome = sum(txInMonth(displayedMonth).filter(t => t.amount > 0), t => t.amount);
  const toBudget = monthIncome || assigned; // fall back to assigned total if no income logged yet
  const unassigned = toBudget - assigned;
  if (summaryTo) summaryTo.textContent = money.format(toBudget);
  if (summaryAssigned) summaryAssigned.textContent = money.format(assigned);
  if (summaryUnassigned) { summaryUnassigned.textContent = money.format(unassigned); summaryUnassigned.classList.toggle('good', unassigned >= 0); }

  if (!budgets.length) {
    container.innerHTML = '<article class="card"><div class="card-title"><h2>Planned categories</h2><button class="text-btn" data-create="monthly_budgets">+ Add</button></div><p class="empty">No budget categories saved yet.</p></article>';
    bindCreateButtons();
    return;
  }

  const spentByCategory = new Map();
  for (const t of txInMonth(displayedMonth)) {
    if (t.amount >= 0) continue;
    spentByCategory.set(t.category, (spentByCategory.get(t.category) || 0) + Math.abs(t.amount));
  }
  const groups = groupBy(budgets, b => categoryOf(b.category)?.group || 'other');
  const groupLabels = { needs: 'Essentials', wants: 'Wants', goals: 'Goals', other: 'Other' };
  container.innerHTML = [...groups.entries()].map(([groupKey, items]) => {
    const groupPlanned = sum(items, b => b.planned_amount || 0);
    const groupSpent = sum(items, b => spentByCategory.get(b.category) || 0);
    const lines = items.map(b => {
      const planned = b.planned_amount || 0;
      const spent = spentByCategory.get(b.category) || 0;
      const width = planned ? clamp(spent / planned, 0, 1) : 0;
      const over = spent > planned;
      return `<div class="budget-line"><span>${esc(nameById(categories, b.category))}</span><div class="progress ${over ? '' : 'green'}"><i style="width:${pct(width)}"></i></div><b>${money.format(spent)} / ${money.format(planned)}</b></div>`;
    }).join('');
    return `<article class="card"><div class="card-title"><h2>${groupLabels[groupKey] || groupKey}</h2><b>${money.format(groupSpent)} <small>of ${money.format(groupPlanned)}</small></b></div>${lines}</article>`;
  }).join('') + `<div class="text-btn" style="grid-column:1/-1"><button class="text-btn" data-create="monthly_budgets">+ Add category</button></div>`;
  bindCreateButtons();
}

/* ================= LOANS ================= */
function renderDebts() {
  const list = document.querySelector('.loans-list');
  const feature = document.getElementById('loan-feature');
  const payoffCard = document.getElementById('loan-payoff-tip');

  if (list) {
    list.innerHTML = `<div class="card-title"><h2>All debts</h2><button class="text-btn" data-create="debts">+ Add debt</button></div>${
      debts.map(d => {
        const orig = d.original_balance;
        const progress = orig ? clamp(1 - (d.current_balance || 0) / orig, 0, 1) : null;
        return `<div class="debt-row"><span class="debt-round blue">${esc((d.name || 'D')[0])}</span><div><b>${esc(d.name)}</b><p>${d.interest_rate || 0}% APR · ${money.format(d.minimum_payment || 0)}/mo</p></div><strong>${money.format(d.current_balance || 0)}</strong>${progress !== null ? `<span class="progress tiny"><i style="width:${pct(progress)}"></i></span>` : '<span></span>'}<button>›</button></div>`;
      }).join('') || '<p class="empty">No loans or debts saved yet.</p>'
    }`;
  }

  if (feature) {
    const primary = debts.find(d => (d.debt_type || '').toLowerCase() === 'mortgage') || [...debts].sort((a, b) => (b.current_balance || 0) - (a.current_balance || 0))[0];
    if (!primary) {
      feature.innerHTML = '<p class="empty">Add a loan to see it summarized here.</p>';
    } else {
      const payoff = amortize(primary.current_balance || 0, primary.interest_rate || 0, primary.minimum_payment || 0);
      const orig = primary.original_balance;
      const progress = orig ? clamp(1 - (primary.current_balance || 0) / orig, 0, 1) : null;
      feature.innerHTML = `<div class="loan-title"><span class="loan-icon">⌂</span><div><p class="eyebrow">${esc((primary.debt_type || 'LOAN').toUpperCase())}</p><h2>${esc(primary.name)}</h2></div><button class="dots">•••</button></div>
        <div class="loan-numbers"><div><span>REMAINING</span><b>${money.format(primary.current_balance || 0)}</b></div><div><span>INTEREST RATE</span><b>${primary.interest_rate || 0}%</b></div><div><span>PAYMENT</span><b>${money.format(primary.minimum_payment || 0)} <small>/mo</small></b></div></div>
        ${progress !== null ? `<div class="progress"><i style="width:${pct(progress)}"></i></div><p class="subtle">${pct(progress)} paid off${payoff ? ` · Estimated payoff: ${monthsFromNow(payoff.months)}` : ''}</p>` : (payoff ? `<p class="subtle">Estimated payoff: ${monthsFromNow(payoff.months)}</p>` : '<p class="subtle">Add an interest rate and payment to estimate payoff.</p>')}`;
    }
  }

  if (payoffCard) {
    const candidate = debts.filter(d => (d.current_balance || 0) > 0 && (d.minimum_payment || 0) > 0).sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0))[0];
    if (!candidate) {
      payoffCard.innerHTML = '<p class="eyebrow">SMART PAYOFF</p><h2>Add a loan to see a payoff plan</h2><p>Once you\'ve added a debt with a rate and payment, we\'ll show how extra payments could speed things up.</p>';
    } else {
      const base = amortize(candidate.current_balance, candidate.interest_rate || 0, candidate.minimum_payment);
      const extra = Math.max(25, Math.round((candidate.minimum_payment || 0) * 0.1 / 5) * 5);
      const boosted = amortize(candidate.current_balance, candidate.interest_rate || 0, candidate.minimum_payment + extra);
      if (base && boosted) {
        const monthsSaved = base.months - boosted.months;
        const interestSaved = Math.max(0, base.totalInterest - boosted.totalInterest);
        payoffCard.innerHTML = `<p class="eyebrow">SMART PAYOFF</p><h2>Debt-free ${monthsSaved} month${monthsSaved === 1 ? '' : 's'} sooner</h2><p>Add <b>${money.format(extra)}/month</b> to your ${esc(candidate.name)} and save an estimated <b>${money.format(interestSaved)}</b> in interest.</p><button class="dark-btn">Explore payoff plan →</button>`;
      } else {
        payoffCard.innerHTML = `<p class="eyebrow">SMART PAYOFF</p><h2>${esc(candidate.name)}</h2><p>At the current payment, this balance won't shrink — consider raising the monthly payment above the interest charge.</p>`;
      }
    }
  }
}

/* ================= BILLS ================= */
function renderBills() {
  const box = document.querySelector('.upcoming');
  const banner = document.getElementById('bill-banner');
  const calendarGrid = document.getElementById('bill-calendar-grid');
  const calendarTitle = document.getElementById('bill-calendar-title');

  const sorted = [...recurring].filter(r => r.next_due_date).sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));
  if (box) {
    box.innerHTML = `<div class="card-title"><h2>Coming up</h2><button class="text-btn" data-create="recurring_items">+ Add bill</button></div>${
      sorted.slice(0, 6).map(r => `<div class="bill-row"><span class="bill-logo loan">${esc((r.name || 'B')[0])}</span><div><b>${esc(r.name)}</b><p>${new Date(r.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${esc(r.frequency || 'monthly')}</p></div><strong>${money.format(Math.abs(r.amount || 0))}</strong></div>`).join('') || '<p class="empty">No recurring bills saved yet.</p>'
    }`;
  }

  const today = new Date();
  const weekOut = new Date(today.getTime() + 7 * 86400000);
  const dueSoon = sorted.filter(r => { const d = new Date(r.next_due_date); return d >= today && d <= weekOut; });
  if (banner) {
    if (dueSoon.length) {
      banner.style.display = '';
      banner.innerHTML = `✦ <span><b>Heads up:</b> You have ${money.format(sum(dueSoon, r => Math.abs(r.amount || 0)))} in bills coming up this week.</span><button data-go="bills-review">Review now →</button>`;
    } else {
      banner.style.display = 'none';
    }
  }

  if (calendarGrid) {
    const start = startOfMonth(today);
    const firstWeekday = start.getDay();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dueDays = new Set(sorted.filter(r => inMonth(r.next_due_date, today)).map(r => new Date(r.next_due_date).getDate()));
    let cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<span>${d}</span>`).join('');
    for (let i = 0; i < firstWeekday; i++) cells += '<b></b>';
    for (let day = 1; day <= daysInMonth; day++) {
      const classes = [day === today.getDate() ? 'today' : '', dueDays.has(day) ? 'has-bill' : ''].filter(Boolean).join(' ');
      cells += `<b class="${classes}">${day}</b>`;
    }
    calendarGrid.innerHTML = cells;
  }
  if (calendarTitle) calendarTitle.textContent = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/* ================= INVESTMENTS ================= */
function renderInvestments() {
  const grid = document.querySelector('.account-grid');
  const wealthStrong = document.getElementById('wealth-total-amount');
  const wealthSub = document.getElementById('wealth-total-sub');
  const allocContent = document.getElementById('allocation-content');

  const savingsAccounts = accounts.filter(a => ['savings', 'retirement', 'brokerage'].includes(a.type));
  if (grid) {
    const merged = [...savingsAccounts, ...investmentAccounts];
    grid.innerHTML = merged.map(a => `<article class="card account-card"><span class="account-logo savings-logo">◇</span><p>${esc((a.account_type || a.type || 'account').toUpperCase())}</p><h2>${esc(a.name || nameById(accounts, a.account, 'Investment account'))}</h2><strong>${money.format(a.current_value ?? a.balance ?? 0)}</strong><div><span>${a.monthly_contribution ? `${money.format(a.monthly_contribution)}/mo` : ''}</span><small>${esc(a.institution || '')}</small></div></article>`).join('') || '<p class="empty">No savings or investment accounts saved yet.</p>';
  }

  const assets = sum(savingsAccounts, a => a.balance || 0) + sum(investmentAccounts, a => a.current_value || 0) + sum(goals, g => g.current_amount || 0);
  const liabilities = sum(debts, d => d.current_balance || 0);
  const netWorth = assets - liabilities;
  if (wealthStrong) wealthStrong.textContent = money.format(netWorth);
  if (wealthSub) {
    const accountCount = savingsAccounts.length + investmentAccounts.length;
    wealthSub.textContent = accountCount ? `Across ${accountCount} account${accountCount === 1 ? '' : 's'}, minus ${money.format(liabilities)} in debt` : 'Add accounts to track your net worth';
  }

  if (allocContent) {
    if (!holdings.length) {
      allocContent.innerHTML = '<p class="empty">Add holdings to see your asset allocation.</p>';
    } else {
      const byClass = groupBy(holdings, h => h.asset_class || 'other');
      const total = sum(holdings, h => h.current_value || h.value || 0) || 1;
      const palette = { equity: 'equity', us_stock: 'equity', intl: 'intl', international: 'intl', bond: 'bond', cash: 'cash' };
      const entries = [...byClass.entries()].map(([cls, items]) => ({
        cls, label: cls.replace(/_/g, ' '), value: sum(items, h => h.current_value || h.value || 0),
      }));
      const bar = entries.map(e => `<i class="${palette[e.cls] || 'cash'}" style="flex:${Math.max(1, Math.round((e.value / total) * 100))}"></i>`).join('');
      const legend = entries.map(e => `<span><i class="${palette[e.cls] || 'cash'}"></i>${esc(e.label)} <b>${pct(e.value / total)}</b></span>`).join('');
      allocContent.innerHTML = `<div class="allocation-bar">${bar}</div><div class="alloc-legend">${legend}</div>`;
    }
  }
}

/* ================= DASHBOARD ================= */
function renderCashflowChart() {
  const svgHost = document.getElementById('cashflow-svg');
  const yLabels = document.getElementById('cashflow-ylabels');
  const xLabels = document.getElementById('cashflow-xlabels');
  if (!svgHost) return;
  const months = monthlyTotals(6);
  const max = Math.max(1, ...months.map(m => Math.max(m.income, m.spend)));
  const W = 560, H = 190, floor = 172;
  const stepX = months.length > 1 ? W / (months.length - 1) : W;
  const toY = v => floor - (v / max) * (floor - 10);
  const pathFor = key => months.map((m, i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)} ${toY(m[key]).toFixed(1)}`).join(' ');
  const incomePath = pathFor('income');
  const areaPath = `${incomePath} L${W} ${H} L0 ${H} Z`;
  svgHost.innerHTML = `<defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#dcebe3" stop-opacity=".7"/><stop offset="1" stop-color="#dcebe3" stop-opacity="0"/></linearGradient></defs>
    <path d="${areaPath}" fill="url(#area)"/>
    <path d="${incomePath}" fill="none" stroke="#287a5d" stroke-width="3"/>
    <path d="${pathFor('spend')}" fill="none" stroke="#e07855" stroke-width="3"/>`;
  if (yLabels) {
    const steps = 4;
    yLabels.innerHTML = Array.from({ length: steps }, (_, i) => `<span>${money0.format(max * (1 - i / (steps - 1)))}</span>`).join('');
  }
  if (xLabels) xLabels.innerHTML = months.map(m => `<span>${m.label}</span>`).join('');
}

function renderMoneyMap() {
  const donut = document.getElementById('money-donut');
  const legend = document.getElementById('money-map-legend');
  const tip = document.getElementById('plan-tip-text');
  if (!donut) return;
  const spentByCategory = new Map();
  for (const t of txInMonth(displayedMonth)) {
    if (t.amount >= 0) continue;
    spentByCategory.set(t.category, (spentByCategory.get(t.category) || 0) + Math.abs(t.amount));
  }
  const totals = { needs: 0, wants: 0, goals: 0 };
  for (const [catId, amt] of spentByCategory) {
    const group = categoryOf(catId)?.group;
    if (totals[group] !== undefined) totals[group] += amt;
  }
  const goalAssigned = sum(goals, g => g.monthly_contribution || 0);
  totals.goals += goalAssigned;
  const spentTotal = totals.needs + totals.wants + totals.goals;
  const income = sum(txInMonth(displayedMonth).filter(t => t.amount > 0), t => t.amount);
  const allocatedPct = income ? clamp(spentTotal / income, 0, 1) : 0;

  const colors = { needs: '#287a5d', wants: '#5b86aa', goals: '#e07855' };
  let acc = 0;
  const stops = ['needs', 'wants', 'goals'].map(k => {
    const share = spentTotal ? totals[k] / spentTotal : 0;
    const start = acc, end = acc + share * 100; acc = end;
    return `${colors[k]} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
  }).join(', ');
  donut.style.background = spentTotal ? `conic-gradient(${stops})` : '#e9eee9';
  const donutNumber = document.getElementById('money-donut-pct');
  if (donutNumber) donutNumber.textContent = pct(allocatedPct);

  if (legend) {
    legend.innerHTML = `<li><span class="dot orange"></span>Needs <b>${money.format(totals.needs)}</b></li><li><span class="dot blue"></span>Wants <b>${money.format(totals.wants)}</b></li><li><span class="dot green"></span>Goals <b>${money.format(totals.goals)}</b></li>`;
  }
  if (tip) {
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0).getDate();
    const expectedPace = income * (dayOfMonth / daysInMonth);
    const diff = expectedPace - spentTotal;
    if (!income) {
      tip.innerHTML = '<span><b>Get started.</b> Log some income and spending to see how your plan is tracking.</span>';
    } else if (diff >= 0) {
      tip.innerHTML = `<span><b>Nice work.</b> You're ${money.format(Math.abs(diff))} under your pace.</span>`;
    } else {
      tip.innerHTML = `<span><b>Heads up.</b> You're ${money.format(Math.abs(diff))} over your usual pace this month.</span>`;
    }
  }
}

function renderDashboardGoals() {
  const host = document.getElementById('dashboard-goals');
  if (!host) return;
  if (!goals.length) { host.innerHTML = '<p class="empty">No savings goals yet.</p>'; return; }
  host.innerHTML = goals.slice(0, 3).map(g => {
    const target = g.target_amount || 0, cur = g.current_amount || 0;
    const progress = target ? clamp(cur / target, 0, 1) : 0;
    const remaining = target - cur;
    const monthsLeft = g.monthly_contribution > 0 ? Math.ceil(remaining / g.monthly_contribution) : null;
    const eta = monthsLeft !== null && monthsLeft >= 0 ? monthsFromNow(monthsLeft) : null;
    return `<div class="goal-item"><div class="goal-top"><span>${esc(g.name)}</span><b>${money.format(cur)} <small>/ ${money.format(target)}</small></b></div><div class="progress green"><i style="width:${pct(progress)}"></i></div><p>${pct(progress)} complete${eta ? ` · ${money.format(g.monthly_contribution)}/mo gets you there ${eta}` : ''}</p></div>`;
  }).join('');
}

function renderStatCards() {
  const month = txInMonth(displayedMonth);
  const prevMonth = txInMonth(addMonths(displayedMonth, -1));
  const income = sum(month.filter(t => t.amount > 0), t => t.amount);
  const prevIncome = sum(prevMonth.filter(t => t.amount > 0), t => t.amount);
  const spend = Math.abs(sum(month.filter(t => t.amount < 0), t => t.amount));

  const incomeNode = document.querySelector('.income strong'), spentNode = document.querySelector('.expense strong');
  if (incomeNode) incomeNode.textContent = money.format(income);
  if (spentNode) spentNode.textContent = money.format(spend);

  const incomeSub = document.getElementById('income-sub');
  if (incomeSub) {
    if (prevIncome > 0) {
      const change = ((income - prevIncome) / prevIncome) * 100;
      incomeSub.innerHTML = `<b>${change >= 0 ? '+' : ''}${change.toFixed(0)}%</b> from last month`;
    } else { incomeSub.innerHTML = 'No income logged last month'; }
  }
  const spendSub = document.getElementById('spend-sub');
  if (spendSub) spendSub.innerHTML = income ? `<b>${pct(clamp(spend / income, 0, 1))}</b> of monthly income` : 'Log income to see a share of spending';
  const spendProgress = document.getElementById('spend-progress');
  if (spendProgress) spendProgress.style.width = income ? pct(clamp(spend / income, 0, 1)) : '0%';

  const savedNode = document.querySelector('.savings strong');
  const savedSub = document.getElementById('saved-sub');
  const savedProgress = document.getElementById('saved-progress');
  const totalSaved = sum(goals, g => g.monthly_contribution || 0);
  if (savedNode) savedNode.textContent = money.format(totalSaved);
  const primaryGoal = goals[0];
  if (savedSub) savedSub.innerHTML = primaryGoal ? `on track for your <b>${money.format(primaryGoal.target_amount || 0)} goal</b>` : 'No savings goal set yet';
  if (savedProgress) savedProgress.style.width = primaryGoal?.target_amount ? pct(clamp((primaryGoal.current_amount || 0) / primaryGoal.target_amount, 0, 1)) : '0%';

  const billsNode = document.querySelector('.bills strong');
  const billsSub = document.getElementById('bills-sub');
  const billsAvatars = document.getElementById('bills-avatars');
  const today = new Date(), weekOut = new Date(today.getTime() + 7 * 86400000);
  const dueSoon = recurring.filter(r => r.next_due_date && new Date(r.next_due_date) >= today && new Date(r.next_due_date) <= weekOut);
  if (billsNode) billsNode.textContent = money.format(sum(dueSoon, r => Math.abs(r.amount || 0)));
  if (billsSub) billsSub.innerHTML = `<b>${dueSoon.length} bill${dueSoon.length === 1 ? '' : 's'}</b> due in the next 7 days`;
  if (billsAvatars) {
    const shown = dueSoon.slice(0, 3);
    billsAvatars.innerHTML = shown.map(r => `<span>${esc((r.name || 'B')[0])}</span>`).join('') + (dueSoon.length > shown.length ? `<span>+${dueSoon.length - shown.length}</span>` : '');
  }

  const miniBars = document.getElementById('mini-bars');
  if (miniBars) {
    const months = monthlyTotals(7);
    const max = Math.max(1, ...months.map(m => m.income));
    miniBars.innerHTML = months.map((m, i) => `<i style="height:${clamp((m.income / max) * 100, 4, 100)}%${i === months.length - 1 ? ';background:var(--green)' : ''}"></i>`).join('');
  }
}

function renderDashboard() {
  document.querySelectorAll('.month-toggle strong').forEach(n => n.textContent = displayedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  const monthLabel = document.querySelector('.month-label');
  if (monthLabel) monthLabel.textContent = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

  const month = txInMonth(displayedMonth), prevMonth = txInMonth(addMonths(displayedMonth, -1));
  const income = sum(month.filter(t => t.amount > 0), t => t.amount);
  const spend = Math.abs(sum(month.filter(t => t.amount < 0), t => t.amount));
  const prevIncome = sum(prevMonth.filter(t => t.amount > 0), t => t.amount);
  const prevSpend = Math.abs(sum(prevMonth.filter(t => t.amount < 0), t => t.amount));
  const power = document.querySelector('.spend-number');
  if (power) {
    const val = income - spend;
    const [whole, cents] = money.format(Math.abs(val)).replace('$', '').split('.');
    power.innerHTML = `${val < 0 ? '−' : ''}$${whole}<span>.${cents || '00'}</span>`;
  }
  const spendSubtle = document.getElementById('spend-power-sub');
  if (spendSubtle) {
    const diff = (income - spend) - (prevIncome - prevSpend);
    spendSubtle.innerHTML = `left to spend this month <span class="${diff >= 0 ? 'good' : ''}">${diff >= 0 ? '↑' : '↓'} ${money.format(Math.abs(diff))}</span> vs. last month`;
  }
  if (document.getElementById('page-title')) document.getElementById('page-title').innerHTML = pageTitleFor('dashboard');

  renderStatCards();
  renderCashflowChart();
  renderMoneyMap();
  renderDashboardGoals();
}

/* ================= REPORTS ================= */
function renderReports() {
  const catHost = document.getElementById('report-categories');
  const insightHost = document.getElementById('report-insight');
  const savingsRateNode = document.getElementById('report-savings-rate');
  const topMerchantNode = document.getElementById('report-top-merchant');
  const cashflowNode = document.getElementById('report-cashflow');
  const rangeLabel = document.getElementById('report-range');

  const month = txInMonth(displayedMonth);
  const income = sum(month.filter(t => t.amount > 0), t => t.amount);
  const spend = Math.abs(sum(month.filter(t => t.amount < 0), t => t.amount));

  if (rangeLabel) {
    const now = new Date();
    rangeLabel.textContent = `${displayedMonth.toLocaleDateString('en-US', { month: 'long' })} 1 – ${now.getDate()}`;
  }

  if (catHost) {
    const byCategory = groupBy(month.filter(t => t.amount < 0), t => t.category);
    const rows = [...byCategory.entries()].map(([catId, items]) => ({ name: nameById(categories, catId), total: Math.abs(sum(items, t => t.amount)) })).sort((a, b) => b.total - a.total);
    const max = Math.max(1, ...rows.map(r => r.total));
    catHost.innerHTML = rows.length ? rows.map(r => `<div><span>${esc(r.name)}</span><i style="width:${pct(r.total / max)}"></i><b>${money.format(r.total)}</b></div>`).join('') : '<p class="empty">No spending logged this month yet.</p>';
  }

  if (insightHost) {
    const byCategory = groupBy(transactions.filter(t => t.amount < 0), t => t.category);
    let best = null;
    for (const [catId, items] of byCategory) {
      const thisMonthTotal = Math.abs(sum(items.filter(t => inMonth(t.date, displayedMonth)), t => t.amount));
      const priorMonths = [1, 2, 3].map(i => Math.abs(sum(items.filter(t => inMonth(t.date, addMonths(displayedMonth, -i))), t => t.amount)));
      const avgPrior = sum(priorMonths) / 3;
      if (avgPrior > 0 && thisMonthTotal > avgPrior) {
        const change = ((thisMonthTotal - avgPrior) / avgPrior) * 100;
        if (!best || change > best.change) best = { name: nameById(categories, catId), change };
      }
    }
    insightHost.innerHTML = best
      ? `<p class="eyebrow">YOUR INSIGHT</p><span class="insight-icon">↗</span><h2>${esc(best.name)} is trending up</h2><p>You've spent ${best.change.toFixed(0)}% more on ${esc(best.name.toLowerCase())} than your 3-month average.</p>`
      : `<p class="eyebrow">YOUR INSIGHT</p><span class="insight-icon">✦</span><h2>Nothing unusual this month</h2><p>Your spending is tracking close to your recent average across categories.</p>`;
  }

  if (savingsRateNode) {
    const rate = income ? (income - spend) / income : 0;
    const prevMonth = txInMonth(addMonths(displayedMonth, -1));
    const prevIncome = sum(prevMonth.filter(t => t.amount > 0), t => t.amount);
    const prevSpend = Math.abs(sum(prevMonth.filter(t => t.amount < 0), t => t.amount));
    const prevRate = prevIncome ? (prevIncome - prevSpend) / prevIncome : 0;
    savingsRateNode.querySelector('strong').textContent = pct(rate);
    const diffNode = savingsRateNode.querySelector('p');
    const diff = (rate - prevRate) * 100;
    diffNode.innerHTML = `<span class="${diff >= 0 ? 'good' : ''}">${diff >= 0 ? '↑' : '↓'} ${Math.abs(diff).toFixed(1)}%</span> from last month`;
  }

  if (topMerchantNode) {
    const byMerchant = groupBy(month.filter(t => t.amount < 0 && t.merchant), t => t.merchant);
    const ranked = [...byMerchant.entries()].map(([name, items]) => ({ name, visits: items.length, total: Math.abs(sum(items, t => t.amount)) })).sort((a, b) => b.total - a.total);
    const top = ranked[0];
    topMerchantNode.querySelector('strong').textContent = top ? top.name : '—';
    topMerchantNode.querySelector('p').textContent = top ? `${top.visits} visit${top.visits === 1 ? '' : 's'} · ${money.format(top.total)} this month` : 'No expenses logged this month';
  }

  if (cashflowNode) {
    const net = income - spend;
    const strong = cashflowNode.querySelector('strong');
    strong.textContent = `${net >= 0 ? '+' : '−'}${money.format(Math.abs(net))}`;
    strong.classList.toggle('good', net >= 0);
  }
}

function renderAll() {
  renderTransactions();
  renderBudget();
  renderDebts();
  renderBills();
  renderInvestments();
  renderDashboard();
  renderReports();
  bindCreateButtons();
}

async function loadData() {
  [transactions, accounts, categories, budgets, goals, debts, recurring, investmentAccounts, holdings] = await Promise.all([
    getAll('transactions', { sort: '-date' }), getAll('accounts'), getAll('categories'), getAll('monthly_budgets'),
    getAll('goals'), getAll('debts'), getAll('recurring_items', { sort: 'next_due_date' }), getAll('investment_accounts'), getAll('investment_holdings'),
  ]);
  const workspaceNode = document.querySelector('.workspace');
  if (workspaceNode) {
    workspaceNode.childNodes[1].textContent = currentWorkspaceName();
    const avatar = workspaceNode.querySelector('.avatar');
    if (avatar) avatar.textContent = initialsOf(pb.authStore.record?.name);
  }
  renderAll();
}

/* ================= ADD TRANSACTION MODAL ================= */
const modal = document.getElementById('modal');
function populateCategoryOptions() {
  const select = document.getElementById('tx-category');
  if (!select) return;
  const existing = categories.map(c => c.name);
  select.innerHTML = existing.map(name => `<option>${esc(name)}</option>`).join('') + '<option>Other</option>';
}
function openTransaction() {
  document.getElementById('tx-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('tx-account').innerHTML = '<option value="">Select account</option>' + accounts.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('');
  populateCategoryOptions();
  modal.classList.add('open');
  document.getElementById('tx-desc').focus();
}
document.getElementById('quick-add').onclick = openTransaction;
document.getElementById('transaction-add').onclick = openTransaction;
document.getElementById('close-modal').onclick = () => modal.classList.remove('open');
modal.onclick = e => { if (e.target === modal) modal.classList.remove('open'); };
document.querySelector('.modal').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const amount = Number(document.getElementById('tx-amount').value) * (document.getElementById('tx-type').value === 'expense' ? -1 : 1);
    const categoryName = document.getElementById('tx-category').value;
    let category = categories.find(c => c.name === categoryName);
    if (!category) {
      category = await pb.collection('categories').create({ user: pb.authStore.record.id, name: categoryName, group: amount > 0 ? 'income' : 'wants' });
      categories.push(category);
    }
    const record = await pb.collection('transactions').create({
      user: pb.authStore.record.id, merchant: document.getElementById('tx-desc').value, amount,
      date: new Date(document.getElementById('tx-date').value + 'T12:00:00').toISOString(),
      kind: amount > 0 ? 'income' : 'expense', category: category.id, account: document.getElementById('tx-account').value || null,
    });
    transactions.unshift(record);
    renderAll();
    modal.classList.remove('open');
    e.target.reset();
    toast('Transaction saved to PocketBase');
  } catch (err) { toast(err.message || 'Could not save transaction', true); }
});

/* ================= GENERIC "ADD RECORD" MODALS ================= */
const createSchemas = {
  accounts: { title: 'Add account', fields: [['name', 'Account name'], ['type', 'Type (checking, savings, credit_card, retirement, brokerage)'], ['institution', 'Institution'], ['balance', 'Current balance', 'number']] },
  monthly_budgets: { title: 'Add budget category', fields: [['category', 'Category name'], ['planned_amount', 'Monthly amount', 'number']] },
  debts: { title: 'Add loan or debt', fields: [['name', 'Name'], ['debt_type', 'Type (mortgage, student_loan, auto_loan, credit_card)'], ['current_balance', 'Current balance', 'number'], ['original_balance', 'Original balance (optional, enables % paid off)', 'number'], ['interest_rate', 'APR %', 'number'], ['minimum_payment', 'Monthly payment', 'number']] },
  recurring_items: { title: 'Add recurring bill', fields: [['name', 'Bill name'], ['amount', 'Amount', 'number'], ['frequency', 'Frequency (monthly, weekly, yearly)'], ['next_due_date', 'Next due date', 'date']] },
  investment_accounts: { title: 'Add investment account', fields: [['name', 'Account name'], ['account_type', 'Type (401k, roth_ira, brokerage, hsa)'], ['current_value', 'Current value', 'number'], ['monthly_contribution', 'Monthly contribution', 'number']] },
  goals: { title: 'Add savings goal', fields: [['name', 'Goal name'], ['target_amount', 'Target amount', 'number'], ['current_amount', 'Current amount', 'number'], ['monthly_contribution', 'Monthly contribution', 'number']] },
  scenarios: { title: 'Save scenario', fields: [['name', 'Scenario name'], ['purchase_amount', 'Purchase amount', 'number']] },
};
function bindCreateButtons() {
  document.querySelectorAll('[data-create]').forEach(b => b.onclick = () => openCreator(b.dataset.create));
  document.querySelectorAll('.page .add-button').forEach(b => {
    const page = b.closest('.page')?.id;
    if (b.id || b.dataset.bound) return;
    b.dataset.bound = '1';
    const map = { budget: 'monthly_budgets', loans: 'debts', investments: 'investment_accounts', bills: 'recurring_items' };
    if (map[page]) b.onclick = () => openCreator(map[page]);
  });
  const budgetEditBtn = document.querySelector('#budget .outline-btn');
  if (budgetEditBtn) budgetEditBtn.onclick = () => openCreator('monthly_budgets');
}
function openCreator(type) {
  const schema = createSchemas[type];
  if (!schema) return;
  const fields = schema.fields.map(([key, label, input = 'text']) => `<label>${label}<input name="${key}" type="${input}" ${input === 'number' ? '' : 'required'}></label>`).join('');
  const overlay = document.createElement('div');
  overlay.className = 'modal-backdrop open';
  overlay.innerHTML = `<form class="modal"><button type="button" class="modal-close">×</button><p class="eyebrow">POCKETBASE</p><h2>${schema.title}</h2>${fields}<button class="add-button" type="submit">Save</button></form>`;
  document.body.append(overlay);
  overlay.querySelector('.modal-close').onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    for (const [k, v] of Object.entries(data)) if (e.target.elements[k].type === 'number') data[k] = v === '' ? null : Number(v);
    try {
      if (type === 'monthly_budgets') {
        let c = categories.find(x => x.name === data.category);
        if (!c) { c = await pb.collection('categories').create({ user: pb.authStore.record.id, name: data.category, group: 'needs' }); categories.push(c); }
        data.category = c.id;
        data.month = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      }
      data.user = pb.authStore.record.id;
      await pb.collection(type).create(data);
      overlay.remove();
      await loadData();
      toast('Saved to PocketBase');
    } catch (err) { toast(err.message || 'Could not save', true); }
  };
}

/* ================= SCENARIO LAB ================= */
function updateScenario() {
  const price = Number(document.getElementById('scenario-price').value || 0);
  const income = sum(transactions.filter(t => t.amount > 0), t => t.amount);
  const spend = Math.abs(sum(transactions.filter(t => t.amount < 0), t => t.amount));
  const left = income - spend - price;
  document.getElementById('scenario-result').textContent = money.format(left);
  document.getElementById('scenario-summary').textContent = `after buying ${document.getElementById('scenario-name').value || 'this'}`;

  const primaryGoal = goals[0];
  if (primaryGoal && primaryGoal.monthly_contribution > 0) {
    const delayMonths = Math.ceil(price / primaryGoal.monthly_contribution);
    document.getElementById('goal-impact').textContent = delayMonths > 0 ? `Delayed ${delayMonths} month${delayMonths === 1 ? '' : 's'}` : 'No delay';
  } else {
    document.getElementById('goal-impact').textContent = 'No goal set yet';
  }
  const avgDailySpend = spend / 30 || 1;
  document.getElementById('cushion-impact').textContent = `${Math.max(0, Math.round(left / avgDailySpend))} days`;
  const withoutChoice = Math.max(0, (income - spend) * 6);
  const withChoice = Math.max(0, left * 6);
  document.getElementById('scenario-base-saved').textContent = `${money.format(withoutChoice)} saved`;
  document.getElementById('scenario-saved').textContent = `${money.format(withChoice)} saved`;
  document.getElementById('scenario-bar').style.width = `${clamp(withoutChoice ? (withChoice / withoutChoice) * 86 : 12, 12, 86)}%`;
}
document.getElementById('scenario-price').addEventListener('input', updateScenario);
document.getElementById('scenario-name').addEventListener('input', updateScenario);
const scenarioSaveBtn = document.querySelector('#scenario .outline-btn');
if (scenarioSaveBtn) scenarioSaveBtn.onclick = () => openCreator('scenarios');

/* ================= MISC UI HOOKS ================= */
document.querySelectorAll('.month-toggle button').forEach((b, i) => b.onclick = () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + (i ? 1 : -1), 1);
  renderDashboard();
  renderBudget();
  toast(`Showing ${displayedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
});
const workspaceEl = document.querySelector('.workspace');
if (workspaceEl) {
  workspaceEl.onclick = () => {
    const current = currentWorkspaceName();
    const next = prompt('Name this financial workspace:', current);
    if (next?.trim()) {
      localStorage.setItem(workspaceKey(), next.trim());
      workspaceEl.childNodes[1].textContent = next.trim();
      toast('Workspace name updated');
    }
  };
}
const iconButtons = document.querySelectorAll('.top-actions .icon-btn');
if (iconButtons[0]) iconButtons[0].onclick = () => {
  const term = prompt('Search transactions, bills, and accounts:');
  if (!term) return;
  const q = term.toLowerCase();
  const matches = transactions.filter(t => `${t.merchant} ${t.description}`.toLowerCase().includes(q));
  showPage('transactions');
  transactionFilter = 'all';
  renderTransactions();
  toast(matches.length ? `${matches.length} matching transaction${matches.length === 1 ? '' : 's'} shown below` : 'No matching saved transactions');
};
if (iconButtons[1]) iconButtons[1].onclick = () => toast(recurring.length ? `${recurring.length} recurring bill${recurring.length === 1 ? '' : 's'} are being tracked.` : 'No new notifications.');
document.querySelectorAll('.dots').forEach(b => b.onclick = () => toast('Card options: your data is saved automatically in PocketBase.'));
document.querySelectorAll('.filter').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  const label = b.textContent.trim().toLowerCase();
  transactionFilter = label.includes('income') ? 'income' : label.includes('expense') ? 'expense' : label.includes('transfer') ? 'transfer' : 'all';
  renderTransactions();
}));

/* ================= AUTH ================= */
function authScreen() {
  const screen = document.createElement('div');
  screen.id = 'auth-screen';
  screen.innerHTML = `<form class="auth-card"><div class="brand"><span class="brand-mark">N</span><span>northstar</span></div><p class="eyebrow">YOUR PRIVATE MONEY SPACE</p><h1>Welcome back.</h1><p>Sign in to securely access your finances.</p><label>Email<input name="email" type="email" required autocomplete="email"></label><label>Password<input name="password" type="password" required autocomplete="current-password"></label><button class="add-button" type="submit">Sign in</button><button type="button" class="text-btn" id="show-signup">Create an account</button><small id="auth-message"></small></form>`;
  document.body.append(screen);
  screen.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await pb.collection('users').authWithPassword(f.get('email'), f.get('password'));
      screen.remove();
      await loadData();
      toast('Signed in securely');
    } catch (err) { screen.querySelector('#auth-message').textContent = err.message || 'Sign-in failed'; }
  };
  screen.querySelector('#show-signup').onclick = () => {
    screen.querySelector('.auth-card').innerHTML = `<div class="brand"><span class="brand-mark">N</span><span>northstar</span></div><p class="eyebrow">GET STARTED</p><h1>Create your account.</h1><label>Name<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Password<input name="password" type="password" minlength="8" required></label><label>Confirm password<input name="passwordConfirm" type="password" minlength="8" required></label><button class="add-button" type="submit">Create account</button><small id="auth-message"></small>`;
    screen.querySelector('form').onsubmit = async e => {
      e.preventDefault();
      try {
        const data = Object.fromEntries(new FormData(e.target));
        await pb.collection('users').create(data);
        await pb.collection('users').authWithPassword(data.email, data.password);
        screen.remove();
        await loadData();
        toast('Account created');
      } catch (err) { screen.querySelector('#auth-message').textContent = err.message || 'Could not create account'; }
    };
  };
}
if (pb.authStore.isValid) loadData().then(updateScenario);
else authScreen();
