import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth
} from "date-fns";

import { createSampleWorkspace } from "@/lib/sample-data";

export const DEMO_STORAGE_KEY = "spendguard-demo-workspace";
export const DEMO_SESSION_KEY = "spendguard-demo-session";

export const billingCycleLabels = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual"
};

export const statusToneMap = {
  active: "tone-green",
  inactive: "tone-orange",
  canceled: "tone-red",
  paused: "tone-blue",
  paid: "tone-green",
  pending: "tone-orange",
  overdue: "tone-red",
  projected: "tone-blue",
  healthy: "tone-green",
  underused: "tone-orange",
  unused: "tone-red",
  duplicate_candidate: "tone-blue"
};

export const cycleMonths = {
  monthly: 1,
  quarterly: 3,
  annual: 12
};

const vendorLogoAliases = {
  "adobe creative cloud": "adobe",
  adobe: "adobe",
  "amazon aws": "aws",
  "amazon web services": "aws",
  aws: "aws",
  canva: "canva",
  dropbox: "dropbox",
  figma: "figma",
  github: "github",
  google: "google",
  "google workspace": "google",
  hubspot: "hubspot",
  jira: "jira",
  netflix: "netflix",
  notion: "notion",
  quickbooks: "quickbooks",
  shopify: "shopify",
  slack: "slack",
  spotify: "spotify",
  vercel: "vercel",
  youtube: "youtube",
  zoom: "zoom"
};

export function slugifyVendorName(name = "") {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getVendorLogoKey(nameOrKey = "") {
  const normalized = String(nameOrKey).toLowerCase().trim();

  if (!normalized) {
    return "default";
  }

  if (vendorLogoAliases[normalized]) {
    return vendorLogoAliases[normalized];
  }

  const slug = slugifyVendorName(normalized);

  if (vendorLogoAliases[slug]) {
    return vendorLogoAliases[slug];
  }

  return slug.replace(/-/g, "") || "default";
}

function getPreferredDemoBusinessName(explicitBusinessName) {
  const directName = explicitBusinessName?.trim();

  if (directName) {
    return directName;
  }

  const session = getDemoSession();
  return session?.businessName?.trim() || undefined;
}

export function createDemoWorkspace(options = {}) {
  const businessName = getPreferredDemoBusinessName(options.businessName);
  const workspace = createSampleWorkspace({ businessName });
  const projectedPayments = createProjectedPayments(workspace.subscriptions, workspace.payments, 6);
  const hydrated = {
    ...workspace,
    payments: [...workspace.payments, ...projectedPayments],
    alerts: createAlertRecords({
      ...workspace,
      payments: [...workspace.payments, ...projectedPayments]
    })
  };

  return normalizeWorkspace(hydrated);
}

export function loadDemoWorkspace() {
  const businessName = getPreferredDemoBusinessName();

  if (typeof window === "undefined") {
    return createDemoWorkspace({ businessName });
  }

  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);

  if (!raw) {
    const created = createDemoWorkspace({ businessName });
    saveDemoWorkspace(created);
    return created;
  }

  try {
    const normalized = normalizeWorkspace(JSON.parse(raw));

    if (businessName && normalized.business.name !== businessName) {
      const renamedWorkspace = normalizeWorkspace({
        ...normalized,
        business: {
          ...normalized.business,
          name: businessName
        }
      });
      saveDemoWorkspace(renamedWorkspace);
      return renamedWorkspace;
    }

    return normalized;
  } catch (error) {
    const fallback = createDemoWorkspace({ businessName });
    saveDemoWorkspace(fallback);
    return fallback;
  }
}

export function saveDemoWorkspace(workspace) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(normalizeWorkspace(workspace)));
}

export function setDemoSession(session) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

export function getDemoSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(DEMO_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function clearDemoSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DEMO_SESSION_KEY);
}

export function normalizeWorkspace(source) {
  const workspace = {
    business: {
      id: source.business?.id || "business-demo",
      name: source.business?.name || "SpendGuard Business",
      currency: source.business?.currency || "USD",
      renewalWindowDays:
        Number(source.business?.renewalWindowDays || source.business?.renewal_window_days) || 30
    },
    departments: (source.departments || []).map((department) => ({
      id: department.id,
      name: department.name,
      accentColor: department.accentColor || department.accent_color || "#16a34a"
    })),
    categories: (source.categories || []).map((category) => ({
      id: category.id,
      name: category.name,
      accentColor: category.accentColor || category.accent_color || "#16a34a",
      description: category.description || ""
    })),
    vendors: (source.vendors || []).map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      logoKey: getVendorLogoKey(vendor.logoKey || vendor.logo_key || vendor.name || "default"),
      website: vendor.website || ""
    })),
    subscriptions: (source.subscriptions || []).map((subscription) => ({
      id: subscription.id,
      toolName: subscription.toolName || subscription.tool_name,
      vendorId: subscription.vendorId || subscription.vendor_id,
      departmentId: subscription.departmentId || subscription.department_id,
      categoryId: subscription.categoryId || subscription.category_id,
      planName: subscription.planName || subscription.plan_name,
      cost: Number(subscription.cost || 0),
      currency: subscription.currency || "USD",
      billingCycle: subscription.billingCycle || subscription.billing_cycle || "monthly",
      renewalDate: subscription.renewalDate || subscription.renewal_date,
      nextBillingDate: subscription.nextBillingDate || subscription.next_billing_date,
      status: subscription.status || "active",
      usageStatus: subscription.usageStatus || subscription.usage_status || "healthy",
      autoRenew:
        typeof subscription.autoRenew === "boolean"
          ? subscription.autoRenew
          : Boolean(subscription.auto_renew),
      seats: Number(subscription.seats || 0),
      notes: subscription.notes || ""
    })),
    payments: (source.payments || []).map((payment) => ({
      id: payment.id,
      subscriptionId: payment.subscriptionId || payment.subscription_id,
      amount: Number(payment.amount || 0),
      currency: payment.currency || "USD",
      dueDate: payment.dueDate || payment.due_date,
      paidAt: payment.paidAt || payment.paid_at || null,
      status: payment.status,
      source: payment.source || "manual",
      reference: payment.reference || "",
      notes: payment.notes || ""
    })),
    alerts: (source.alerts || []).map((alert) => ({
      id: alert.id || `alert-${Math.random().toString(36).slice(2, 10)}`,
      subscriptionId: alert.subscriptionId || alert.subscription_id || null,
      title: alert.title,
      body: alert.body,
      type: alert.type,
      severity: alert.severity || "medium",
      dueAt: alert.dueAt || alert.due_at || null,
      status: alert.status || "open",
      isRead:
        typeof alert.isRead === "boolean" ? alert.isRead : Boolean(alert.is_read),
      metadata: alert.metadata || {}
    })),
    aiAnalyses: (source.aiAnalyses || source.ai_analyses || []).map((analysis) => ({
      id: analysis.id || `analysis-${Math.random().toString(36).slice(2, 10)}`,
      generatedAt: analysis.generatedAt || analysis.created_at || new Date().toISOString(),
      headline: analysis.headline || "SpendGuard analysis ready",
      summary: analysis.summary || "",
      source: analysis.source || "groq",
      model: analysis.model || null,
      savingsOpportunities: analysis.savingsOpportunities || analysis.recommendations?.savingsOpportunities || [],
      renewalRisks: analysis.renewalRisks || analysis.recommendations?.renewalRisks || [],
      recommendedActions: analysis.recommendedActions || analysis.recommendations?.recommendedActions || [],
      warning: analysis.warning || null
    }))
  };

  return {
    ...workspace,
    metrics: createWorkspaceMetrics(workspace),
    reports: createWorkspaceReports(workspace)
  };
}

export function createWorkspaceMetrics(workspace) {
  const activeSubscriptions = workspace.subscriptions.filter((subscription) => subscription.status === "active");
  const monthlySpend = activeSubscriptions.reduce((total, subscription) => {
    if (subscription.billingCycle === "annual") {
      return total + subscription.cost / 12;
    }

    if (subscription.billingCycle === "quarterly") {
      return total + subscription.cost / 3;
    }

    return total + subscription.cost;
  }, 0);

  const nextRenewal = [...activeSubscriptions]
    .sort((left, right) => new Date(left.renewalDate).getTime() - new Date(right.renewalDate).getTime())[0];

  const pendingPayments = workspace.payments.filter((payment) => payment.status === "pending").length;
  const overduePayments = workspace.payments.filter((payment) => payment.status === "overdue").length;
  const unreadAlerts = workspace.alerts.filter((alert) => !alert.isRead).length;
  const duplicateTools = countDuplicateTools(workspace).length;
  const underused = workspace.subscriptions.filter((subscription) =>
    ["underused", "unused"].includes(subscription.usageStatus)
  ).length;

  return {
    monthlySpend,
    yearlySpend: monthlySpend * 12,
    activeCount: activeSubscriptions.length,
    pendingPayments,
    overduePayments,
    duplicateTools,
    underused,
    unreadAlerts,
    nextRenewalDate: nextRenewal?.renewalDate || null
  };
}

export function createWorkspaceReports(workspace) {
  const vendorById = new Map(workspace.vendors.map((vendor) => [vendor.id, vendor]));
  const departmentById = new Map(workspace.departments.map((department) => [department.id, department]));
  const categoryById = new Map(workspace.categories.map((category) => [category.id, category]));

  const departmentSpendMap = new Map();
  const categorySpendMap = new Map();
  const monthlyTrendMap = new Map();

  for (const subscription of workspace.subscriptions) {
    const monthlyValue =
      subscription.billingCycle === "annual"
        ? subscription.cost / 12
        : subscription.billingCycle === "quarterly"
          ? subscription.cost / 3
          : subscription.cost;
    const department = departmentById.get(subscription.departmentId);
    const category = categoryById.get(subscription.categoryId);

    departmentSpendMap.set(
      department?.name || "Unassigned",
      (departmentSpendMap.get(department?.name || "Unassigned") || 0) + monthlyValue
    );
    categorySpendMap.set(
      category?.name || "Other",
      (categorySpendMap.get(category?.name || "Other") || 0) + monthlyValue
    );
  }

  // Build 12-month forward projection from active subscriptions
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const d = addMonths(today, i);
    const key = format(d, "MMM yy");
    monthlyTrendMap.set(key, 0);
  }

  for (const subscription of workspace.subscriptions.filter(s => s.status === "active")) {
    const monthlyValue =
      subscription.billingCycle === "annual"
        ? subscription.cost / 12
        : subscription.billingCycle === "quarterly"
          ? subscription.cost / 3
          : subscription.cost;

    if (subscription.billingCycle === "monthly") {
      // monthly subs appear every month
      for (let i = 0; i < 12; i++) {
        const key = format(addMonths(today, i), "MMM yy");
        monthlyTrendMap.set(key, (monthlyTrendMap.get(key) || 0) + subscription.cost);
      }
    } else if (subscription.billingCycle === "quarterly") {
      // quarterly subs appear every 3 months
      for (let i = 0; i < 12; i += 3) {
        const key = format(addMonths(today, i), "MMM yy");
        monthlyTrendMap.set(key, (monthlyTrendMap.get(key) || 0) + subscription.cost);
      }
    } else if (subscription.billingCycle === "annual") {
      // annual subs appear once — in their renewal month (if within 12m), else month 0
      const renewalDate = subscription.renewalDate ? parseISO(subscription.renewalDate) : addMonths(today, 11);
      const diffMonths = Math.round((renewalDate - today) / (1000 * 60 * 60 * 24 * 30));
      const idx = Math.max(0, Math.min(11, diffMonths));
      const key = format(addMonths(today, idx), "MMM yy");
      monthlyTrendMap.set(key, (monthlyTrendMap.get(key) || 0) + subscription.cost);
    }
  }

  // Also overlay any real paid payments logged historically
  for (const payment of workspace.payments.filter((entry) => entry.status === "paid" && entry.dueDate)) {
    try {
      const payDate = parseISO(payment.dueDate);
      const key = format(payDate, "MMM yy");
      if (monthlyTrendMap.has(key)) {
        // Real payments replace projected amounts for that month (already counted above)
      }
    } catch (_) { /* skip malformed dates */ }
  }

  return {
    departmentSpend: [...departmentSpendMap.entries()].map(([name, total]) => ({
      name,
      total: roundCurrency(total)
    })),
    categorySpend: [...categorySpendMap.entries()].map(([name, total]) => ({
      name,
      total: roundCurrency(total)
    })),
    monthlyTrend: [...monthlyTrendMap.entries()].map(([month, total]) => ({
      month,
      total: roundCurrency(total)
    })),
    renewals: workspace.subscriptions
      .filter((subscription) => subscription.status === "active")
      .map((subscription) => ({
        id: subscription.id,
        toolName: subscription.toolName,
        renewalDate: subscription.renewalDate,
        vendor: vendorById.get(subscription.vendorId)?.name || "Vendor",
        department: departmentById.get(subscription.departmentId)?.name || "Unassigned"
      }))
      .sort((left, right) => new Date(left.renewalDate).getTime() - new Date(right.renewalDate).getTime()),
    duplicates: countDuplicateTools(workspace)
  };
}

export function countDuplicateTools(workspace) {
  const usage = new Map();
  const departmentById = new Map(workspace.departments.map((department) => [department.id, department]));

  for (const subscription of workspace.subscriptions.filter((entry) => entry.status === "active")) {
    const key = subscription.toolName.trim().toLowerCase();
    const existing = usage.get(key) || [];
    existing.push({
      id: subscription.id,
      toolName: subscription.toolName,
      department: departmentById.get(subscription.departmentId)?.name || "Unassigned"
    });
    usage.set(key, existing);
  }

  return [...usage.values()].filter((entries) => entries.length > 1);
}

export function createProjectedPayments(subscriptions, existingPayments, horizonMonths = 4) {
  const today = new Date();
  const payments = [];
  const existingKeys = new Set(
    existingPayments.map((payment) => `${payment.subscriptionId}|${payment.dueDate}|${payment.source}`)
  );

  for (const subscription of subscriptions.filter((entry) => entry.status === "active")) {
    const step = cycleMonths[subscription.billingCycle] || 1;
    let cursor = parseISO(subscription.nextBillingDate || subscription.renewalDate);
    const horizon = addMonths(today, horizonMonths);

    while (isBefore(cursor, horizon) || format(cursor, "yyyy-MM-dd") === format(horizon, "yyyy-MM-dd")) {
      const dueDate = format(cursor, "yyyy-MM-dd");
      const key = `${subscription.id}|${dueDate}|system`;

      if (isAfter(cursor, today) && !existingKeys.has(key)) {
        payments.push({
          id: `proj-${subscription.id}-${dueDate}`,
          subscriptionId: subscription.id,
          amount: subscription.cost,
          currency: subscription.currency,
          dueDate,
          paidAt: null,
          status: "projected",
          source: "system",
          reference: "Projected cadence",
          notes: `Generated from ${billingCycleLabels[subscription.billingCycle] || "billing"} cadence.`
        });
      }

      cursor = addMonths(cursor, step);
    }
  }

  return payments;
}

export function createAlertRecords(workspace) {
  const alerts = [];
  const renewalWindow = workspace.business.renewalWindowDays || 30;
  const vendorById = new Map(workspace.vendors.map((vendor) => [vendor.id, vendor]));
  const departmentById = new Map(workspace.departments.map((department) => [department.id, department]));
  const today = new Date();

  for (const subscription of workspace.subscriptions) {
    if (subscription.status !== "active") {
      continue;
    }

    const daysToRenewal = differenceInCalendarDays(parseISO(subscription.renewalDate), today);

    if (daysToRenewal <= renewalWindow && daysToRenewal >= 0) {
      alerts.push({
        id: `renewal-${subscription.id}`,
        subscriptionId: subscription.id,
        title: `${subscription.toolName} renews in ${daysToRenewal} day${daysToRenewal === 1 ? "" : "s"}`,
        body: `${vendorById.get(subscription.vendorId)?.name || subscription.toolName} for ${departmentById.get(subscription.departmentId)?.name || "Unassigned"} is due soon.`,
        type: "renewal",
        severity: daysToRenewal <= 7 ? "high" : "medium",
        dueAt: subscription.renewalDate,
        status: "system",
        isRead: false,
        metadata: { daysToRenewal }
      });
    }

    if (["underused", "unused"].includes(subscription.usageStatus)) {
      alerts.push({
        id: `usage-${subscription.id}`,
        subscriptionId: subscription.id,
        title: `${subscription.toolName} looks ${subscription.usageStatus.replace("_", " ")}`,
        body: `This plan is assigned to ${departmentById.get(subscription.departmentId)?.name || "Unassigned"} and may be a savings candidate.`,
        type: "usage",
        severity: subscription.usageStatus === "unused" ? "high" : "medium",
        dueAt: null,
        status: "system",
        isRead: false,
        metadata: {}
      });
    }
  }

  for (const payment of workspace.payments.filter((entry) => ["pending", "projected"].includes(entry.status))) {
    const daysPastDue = differenceInCalendarDays(today, parseISO(payment.dueDate));

    if (daysPastDue > 0) {
      const subscription = workspace.subscriptions.find((entry) => entry.id === payment.subscriptionId);
      alerts.push({
        id: `payment-${payment.id}`,
        subscriptionId: payment.subscriptionId,
        title: `${subscription?.toolName || "Subscription"} payment is overdue`,
        body: `${daysPastDue} day${daysPastDue === 1 ? "" : "s"} past due. Review payment history and renewal timing.`,
        type: "payment",
        severity: "high",
        dueAt: payment.dueDate,
        status: "system",
        isRead: false,
        metadata: { daysPastDue }
      });
    }
  }

  for (const duplicateGroup of countDuplicateTools(workspace)) {
    alerts.push({
      id: `duplicate-${duplicateGroup[0].toolName.toLowerCase()}`,
      subscriptionId: duplicateGroup[0].id,
      title: `${duplicateGroup[0].toolName} is duplicated across departments`,
      body: duplicateGroup.map((entry) => entry.department).join(", "),
      type: "duplicate",
      severity: "medium",
      dueAt: null,
      status: "system",
      isRead: false,
      metadata: { departments: duplicateGroup.map((entry) => entry.department) }
    });
  }

  return alerts;
}

export function analyzeWorkspaceLocally(workspace) {
  const normalized = normalizeWorkspace(workspace);
  const duplicateGroups = countDuplicateTools(normalized);
  const underusedSubscriptions = normalized.subscriptions.filter((subscription) =>
    ["underused", "unused"].includes(subscription.usageStatus)
  );
  const expensiveSubscription = [...normalized.subscriptions].sort((left, right) => right.cost - left.cost)[0];
  const upcomingRenewals = normalized.reports.renewals.slice(0, 3);
  const duplicateSavings = duplicateGroups.reduce((sum, group) => {
    const subscriptions = group
      .map((entry) => normalized.subscriptions.find((subscription) => subscription.id === entry.id))
      .filter(Boolean);
    return sum + subscriptions.slice(1).reduce((subtotal, subscription) => subtotal + subscription.cost, 0);
  }, 0);

  return {
    generatedAt: new Date().toISOString(),
    headline:
      duplicateGroups.length || underusedSubscriptions.length
        ? "SpendGuard found clear ways to tighten recurring spend."
        : "Recurring spend looks healthy, with only light review items left.",
    summary: `Current monthly run-rate is ${formatCurrency(
      normalized.metrics.monthlySpend,
      normalized.business.currency
    )}. There are ${duplicateGroups.length} duplicate tool group${duplicateGroups.length === 1 ? "" : "s"} and ${underusedSubscriptions.length} subscription${underusedSubscriptions.length === 1 ? "" : "s"} flagged for review.`,
    savingsOpportunities: [
      duplicateGroups.length
        ? {
          title: "Consolidate overlapping tools",
          detail: `${duplicateGroups[0][0].toolName} appears in more than one department. One shared contract or license owner would reduce duplication.`,
          impact: "high",
          estimatedSavings: formatCurrency(duplicateSavings || 0, normalized.business.currency)
        }
        : null,
      underusedSubscriptions[0]
        ? {
          title: `Review ${underusedSubscriptions[0].toolName}`,
          detail: `${underusedSubscriptions[0].toolName} is marked ${underusedSubscriptions[0].usageStatus.replace(
            "_",
            " "
          )}. Right-size seats or cancel the plan if usage stays low.`,
          impact: underusedSubscriptions[0].usageStatus === "unused" ? "high" : "medium",
          estimatedSavings: formatCurrency(underusedSubscriptions[0].cost, normalized.business.currency)
        }
        : null,
      expensiveSubscription
        ? {
          title: `Validate ${expensiveSubscription.toolName} ROI`,
          detail: `${expensiveSubscription.toolName} is the most expensive subscription in the workspace and should be reviewed before its next renewal.`,
          impact: "medium",
          estimatedSavings: formatCurrency(expensiveSubscription.cost * 0.2, normalized.business.currency)
        }
        : null
    ].filter(Boolean),
    renewalRisks: upcomingRenewals.map((renewal) => ({
      title: `${renewal.toolName} renews soon`,
      detail: `${renewal.department} should confirm seats and owner before renewal.`,
      dueDate: renewal.renewalDate
    })),
    recommendedActions: [
      "Run a seat audit on duplicate or underused tools before the next renewal window closes.",
      "Confirm all pending or overdue payments inside the payment history timeline.",
      "Export the monthly spend report and review department-level ownership with finance."
    ],
    source: "heuristic"
  };
}

export function normalizeAnalysisPayload(workspace) {
  const normalized = normalizeWorkspace(workspace);

  return {
    business: normalized.business,
    metrics: normalized.metrics,
    subscriptions: normalized.subscriptions.map((subscription) => ({
      toolName: subscription.toolName,
      planName: subscription.planName,
      billingCycle: subscription.billingCycle,
      cost: subscription.cost,
      status: subscription.status,
      usageStatus: subscription.usageStatus,
      renewalDate: subscription.renewalDate
    })),
    reports: normalized.reports
  };
}

export function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function formatDate(value) {
  if (!value) {
    return "No date";
  }

  return format(parseISO(value), "MMM d, yyyy");
}

export function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}
