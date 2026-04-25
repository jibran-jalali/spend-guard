import { addMonths, format, parseISO } from "date-fns";

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
  paused: "tone-blue"
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
    .replace(/['']/g, "")
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
  return normalizeWorkspace(createSampleWorkspace({ businessName }));
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

export function getSubscriptionName(subscription, workspace) {
  const vendor = workspace?.vendors?.find((entry) => entry.id === subscription?.vendorId);
  return vendor?.name || subscription?.vendorName || "Unknown vendor";
}

export function normalizeWorkspace(source = {}) {
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
      vendorId: subscription.vendorId || subscription.vendor_id,
      departmentId: subscription.departmentId || subscription.department_id,
      categoryId: subscription.categoryId || subscription.category_id,
      planName: subscription.planName || subscription.plan_name,
      cost: Number(subscription.cost || 0),
      currency: subscription.currency || "USD",
      billingCycle: subscription.billingCycle || subscription.billing_cycle || "monthly",
      renewalDate: subscription.renewalDate || subscription.renewal_date,
      nextBillingDate:
        subscription.nextBillingDate ||
        subscription.next_billing_date ||
        subscription.renewalDate ||
        subscription.renewal_date,
      status: subscription.status || "active",
      notes: subscription.notes || ""
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

  const nextRenewal = [...activeSubscriptions].sort(
    (left, right) => new Date(left.renewalDate).getTime() - new Date(right.renewalDate).getTime()
  )[0];
  const duplicateTools = countDuplicateTools(workspace).length;

  return {
    monthlySpend,
    yearlySpend: monthlySpend * 12,
    activeCount: activeSubscriptions.length,
    duplicateTools,
    nextRenewalDate: nextRenewal?.renewalDate || null
  };
}

export function createWorkspaceReports(workspace) {
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

  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const key = format(addMonths(today, i), "MMM yy");
    monthlyTrendMap.set(key, 0);
  }

  for (const subscription of workspace.subscriptions.filter((entry) => entry.status === "active")) {
    if (subscription.billingCycle === "monthly") {
      for (let i = 0; i < 12; i++) {
        const key = format(addMonths(today, i), "MMM yy");
        monthlyTrendMap.set(key, (monthlyTrendMap.get(key) || 0) + subscription.cost);
      }
    } else if (subscription.billingCycle === "quarterly") {
      for (let i = 0; i < 12; i += 3) {
        const key = format(addMonths(today, i), "MMM yy");
        monthlyTrendMap.set(key, (monthlyTrendMap.get(key) || 0) + subscription.cost);
      }
    } else if (subscription.billingCycle === "annual") {
      const renewalDate = subscription.renewalDate ? parseISO(subscription.renewalDate) : addMonths(today, 11);
      const diffMonths = Math.round((renewalDate - today) / (1000 * 60 * 60 * 24 * 30));
      const idx = Math.max(0, Math.min(11, diffMonths));
      const key = format(addMonths(today, idx), "MMM yy");
      monthlyTrendMap.set(key, (monthlyTrendMap.get(key) || 0) + subscription.cost);
    }
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
        name: getSubscriptionName(subscription, workspace),
        renewalDate: subscription.renewalDate,
        vendor: getSubscriptionName(subscription, workspace),
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
    const name = getSubscriptionName(subscription, workspace);
    const key = name.trim().toLowerCase();
    const existing = usage.get(key) || [];
    existing.push({
      id: subscription.id,
      name,
      department: departmentById.get(subscription.departmentId)?.name || "Unassigned"
    });
    usage.set(key, existing);
  }

  return [...usage.values()].filter((entries) => entries.length > 1);
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
