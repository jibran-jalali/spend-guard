"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  Building2,
  CalendarClock,
  CreditCard,
  FileDown,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useSpendGuardAuth } from "@/lib/use-spendguard-auth";
import { useSpendGuardWorkspace } from "@/lib/use-spendguard-workspace";
import {
  billingCycleLabels,
  downloadCsv,
  formatCurrency,
  formatDate,
  statusToneMap
} from "@/lib/workspace";
import { DEFAULT_VENDOR_CATALOG } from "@/lib/default-vendors";
import { VendorMark } from "@/components/vendor-mark";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "reports", label: "Reports", icon: FileDown },
  { id: "ai", label: "AI Center", icon: Bot },
  { id: "settings", label: "Settings", icon: Settings2 }
];

const categoryAccent = [
  "#16a34a", // green  – Engineering
  "#2563eb", // blue   – Finance
  "#f59e0b", // amber  – Marketing / Sales
  "#ef4444", // red    – Operations
  "#8b5cf6", // violet – Support
  "#ec4899", // pink   – HR
  "#06b6d4", // cyan   – Data Science
  "#eab308", // yellow – Executive
  "#f97316", // orange – Legal
  "#10b981", // emerald – Design
  "#6366f1", // indigo – Product
  "#84cc16", // lime   – DevOps
  "#a855f7", // purple – Recruiting
  "#14b8a6", // teal   – IT
];
const quickActions = [
  {
    id: "subscriptions",
    title: "Manage subscriptions",
    detail: "Contracts, owners, and renewals"
  },
  {
    id: "ai",
    title: "Run AI review",
    detail: "Waste, overlap, and savings"
  },
  {
    id: "reports",
    title: "Open reports",
    detail: "Spend by team and category"
  },
  {
    id: "settings",
    title: "Update workspace",
    detail: "Payments, teams, and status"
  }
];

function LoadingScreen() {
  const [index, setIndex] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");

  const statusMessages = [
    "Syncing contract intelligence...",
    "Decrypting billing cadences...",
    "Scanning for savings overlap...",
    "Organizing vendor operations...",
    "Optimizing renewal pipelines...",
    "Preparing operator dashboard..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(Math.floor(Math.random() * DEFAULT_VENDOR_CATALOG.length));
      setStatusText(statusMessages[Math.floor(Math.random() * statusMessages.length)]);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  const vendor = DEFAULT_VENDOR_CATALOG[index];

  return (
    <main className="sg-page-loader">
      <div className="sg-loader-content">
        <div className="sg-loader-visual">
          <AnimatePresence mode="wait">
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, scale: 0.6, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.4, y: -15 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="sg-loader-logo-wrap"
            >
              <VendorMark logoKey={vendor.logoKey} domain={vendor.website} />
            </motion.div>
          </AnimatePresence>
          <div className="sg-loader-glow" />
        </div>
        <div className="sg-loader-text">
          <motion.div
            key={statusText}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="sg-loader-status"
          >
            {statusText}
          </motion.div>
          <p>Analyzing <strong>{vendor.name}</strong> footprint</p>
        </div>
        <div className="sg-loader-track">
          <motion.div
            className="sg-loader-progress"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "easeInOut" }}
          />
        </div>
      </div>
    </main>
  );
}

function LogoShuffle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(Math.floor(Math.random() * DEFAULT_VENDOR_CATALOG.length));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const vendor = DEFAULT_VENDOR_CATALOG[index];

  return (
    <div className="sg-landing-shuffle">
      <AnimatePresence mode="wait">
        <motion.div
          key={vendor.id}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -10 }}
          transition={{ duration: 0.5 }}
          className="sg-landing-logo-wrap"
        >
          <VendorMark logoKey={vendor.logoKey} domain={vendor.website} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const emptySubscriptionForm = {
  toolName: "",
  vendorId: "",
  departmentId: "",
  categoryId: "",
  planName: "",
  cost: 49,
  currency: "USD",
  billingCycle: "monthly",
  renewalDate: "",
  nextBillingDate: "",
  status: "active",
  usageStatus: "healthy",
  autoRenew: true,
  seats: 5,
  notes: ""
};

const emptyPaymentForm = {
  subscriptionId: "",
  amount: 0,
  dueDate: "",
  paidAt: "",
  status: "paid",
  reference: "",
  notes: ""
};

const CUSTOM_VENDOR_ID = "__custom__";

export default function SpendGuardApp() {
  const auth = useSpendGuardAuth();
  const workspaceState = useSpendGuardWorkspace(auth.mode, auth.session);
  const [activeView, setActiveView] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [drawerSubscription, setDrawerSubscription] = useState(null);
  const [isSubscriptionFormOpen, setIsSubscriptionFormOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [subscriptionForm, setSubscriptionForm] = useState(emptySubscriptionForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [authTab, setAuthTab] = useState("login");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    fullName: "",
    businessName: ""
  });
  const [departmentName, setDepartmentName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [customVendorName, setCustomVendorName] = useState("");
  const [minLoadingDone, setMinLoadingDone] = useState(false);

  useEffect(() => {
    if (auth.mode !== "guest" && !auth.loading) {
      const timer = setTimeout(() => setMinLoadingDone(true), 5000);
      return () => clearTimeout(timer);
    } else if (auth.mode === "guest") {
      setMinLoadingDone(false);
    }
  }, [auth.mode, auth.loading]);

  const workspace = workspaceState.workspace;

  useEffect(() => {
    if (workspace?.business?.name) {
      setWorkspaceName(workspace.business.name);
    }
  }, [workspace?.business?.name]);

  const filteredSubscriptions = useMemo(() => {
    if (!workspace) {
      return [];
    }

    return workspace.subscriptions.filter((subscription) => {
      const category = workspace.categories.find((entry) => entry.id === subscription.categoryId);
      const matchesSearch = [subscription.toolName, subscription.planName]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "all" || subscription.status === selectedStatus;
      const matchesCategory =
        selectedCategory === "all" || category?.id === selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchTerm, selectedCategory, selectedStatus, workspace]);

  const openCreateSubscription = () => {
    const firstDepartment = workspace?.departments[0]?.id || "";
    const firstVendor = workspace?.vendors[0]?.id || "";
    const firstCategory = workspace?.categories[0]?.id || "";
    setEditingSubscription(null);
    setIsSubscriptionFormOpen(true);
    setCustomVendorName("");
    setSubscriptionForm({
      ...emptySubscriptionForm,
      departmentId: firstDepartment,
      vendorId: firstVendor,
      categoryId: firstCategory
    });
  };

  const openEditSubscription = (subscription) => {
    setEditingSubscription(subscription.id);
    setIsSubscriptionFormOpen(true);
    setCustomVendorName("");
    setSubscriptionForm({
      ...subscription
    });
  };

  async function handleSubmitAuth(event) {
    event.preventDefault();

    if (authTab === "login") {
      await auth.signIn({
        email: authForm.email,
        password: authForm.password
      });
      return;
    }

    if (authTab === "register") {
      await auth.signUp({
        email: authForm.email,
        password: authForm.password,
        fullName: authForm.fullName,
        businessName: authForm.businessName
      });
      return;
    }

    await auth.resetPassword(authForm.email);
  }

  async function handleSaveSubscription(event) {
    event.preventDefault();
    await workspaceState.upsertSubscription({
      ...subscriptionForm,
      vendorId: subscriptionForm.vendorId === CUSTOM_VENDOR_ID ? "" : subscriptionForm.vendorId,
      customVendorName: subscriptionForm.vendorId === CUSTOM_VENDOR_ID ? customVendorName : "",
      id: editingSubscription || undefined,
      cost: Number(subscriptionForm.cost),
      seats: Number(subscriptionForm.seats)
    });
    setEditingSubscription(null);
    setIsSubscriptionFormOpen(false);
    setSubscriptionForm(emptySubscriptionForm);
    setCustomVendorName("");
  }

  async function handleSavePayment(event) {
    event.preventDefault();
    await workspaceState.addPayment({
      ...paymentForm,
      amount: Number(paymentForm.amount)
    });
    setPaymentForm(emptyPaymentForm);
  }

  async function handleSaveWorkspace(event) {
    event.preventDefault();
    await workspaceState.updateBusiness({
      name: workspaceName
    });
  }

  function exportSubscriptionsCsv() {
    if (!workspace) {
      return;
    }

    const departmentById = new Map(workspace.departments.map((department) => [department.id, department.name]));
    const vendorById = new Map(workspace.vendors.map((vendor) => [vendor.id, vendor.name]));
    const categoryById = new Map(workspace.categories.map((category) => [category.id, category.name]));

    const rows = [
      [
        "Tool",
        "Vendor",
        "Department",
        "Category",
        "Plan",
        "Cost",
        "Billing cycle",
        "Renewal date",
        "Status",
        "Usage"
      ],
      ...workspace.subscriptions.map((subscription) => [
        subscription.toolName,
        vendorById.get(subscription.vendorId) || "",
        departmentById.get(subscription.departmentId) || "",
        categoryById.get(subscription.categoryId) || "",
        subscription.planName,
        subscription.cost,
        subscription.billingCycle,
        subscription.renewalDate,
        subscription.status,
        subscription.usageStatus
      ])
    ];

    downloadCsv("spendguard-subscriptions.csv", rows);
  }

  function exportPaymentsCsv() {
    if (!workspace) {
      return;
    }

    const subscriptionById = new Map(workspace.subscriptions.map((subscription) => [subscription.id, subscription.toolName]));
    const rows = [
      ["Subscription", "Amount", "Due date", "Paid at", "Status", "Reference", "Source"],
      ...workspace.payments.map((payment) => [
        subscriptionById.get(payment.subscriptionId) || "",
        payment.amount,
        payment.dueDate,
        payment.paidAt || "",
        payment.status,
        payment.reference,
        payment.source
      ])
    ];

    downloadCsv("spendguard-payments.csv", rows);
  }

  if (auth.loading || workspaceState.loading || (auth.mode !== "guest" && (!workspace || !minLoadingDone))) {
    return <LoadingScreen />;
  }

  if (auth.mode === "guest") {
    return (
      <main className="sg-page">
        <div className="sg-auth-shell">
          <motion.div
            className="sg-landing-hero"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <LogoShuffle />
            <h2 className="sg-hero-quote">
              Control every renewal before it turns into a <span>finance problem</span>.
            </h2>
          </motion.div>

          <div style={{ position: "relative", width: "100%", maxWidth: "520px" }}>
            <motion.section
              className="sg-auth-panel"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="sg-auth-brand-area">
                <Image
                  src="/logo.png"
                  alt="SpendGuard"
                  width={320}
                  height={160}
                  className="sg-auth-logo"
                  priority
                />
              </div>
            <div className="sg-auth-tabs" role="tablist" aria-label="Authentication tabs">
              {[
                { id: "login", label: "Sign in" },
                { id: "register", label: "Create account" },
                { id: "reset", label: "Reset password" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`sg-auth-tab ${authTab === tab.id ? "is-active" : ""}`}
                  onClick={() => setAuthTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="sg-auth-caption">Access your workspace</span>
            <h2 className="sg-auth-title">
              {authTab === "login"
                ? "Sign in to your workspace"
                : authTab === "register"
                  ? "Create the first operator account"
                  : "Reset your password"}
            </h2>
            <p className="sg-auth-subtitle">
              {authTab === "login"
                ? "Use your work email to continue into SpendGuard."
                : authTab === "register"
                  ? "Set up the company workspace name and the admin who will manage renewals and spend."
                  : "Enter your work email and we will send you a secure reset link."}
            </p>

            <form className="sg-auth-form" onSubmit={handleSubmitAuth}>
              {authTab === "register" ? (
                <div className="sg-form-grid">
                  <label className="sg-field">
                    <span>Full name</span>
                    <input
                      value={authForm.fullName}
                      onChange={(event) => setAuthForm((current) => ({ ...current, fullName: event.target.value }))}
                      placeholder="Dana Rivers"
                      required
                    />
                  </label>
                  <label className="sg-field">
                    <span>Business name</span>
                    <input
                      value={authForm.businessName}
                      onChange={(event) =>
                        setAuthForm((current) => ({ ...current, businessName: event.target.value }))
                      }
                      placeholder="Northstar Creative"
                      required
                    />
                  </label>
                </div>
              ) : null}

              <label className="sg-field">
                <span>Email</span>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="admin@northstarcreative.com"
                  required
                />
              </label>

              {authTab !== "reset" ? (
                <label className="sg-field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="********"
                    required
                  />
                </label>
              ) : null}

              <div className="sg-form-actions">
                <button className="sg-button" type="submit">
                  {authTab === "login"
                    ? "Sign in"
                    : authTab === "register"
                      ? "Create workspace"
                      : "Send reset link"}
                </button>
              </div>
            </form>

            <p className={`sg-message ${auth.message?.toLowerCase().includes("error") ? "is-error" : ""}`}>
              {auth.message || "Secure access for finance, operations, and IT owners."}
            </p>
          </motion.section>
        </div>
      </div>
    </main>
    );
  }

  if (!workspace) {
    return (
      <main className="sg-page">
        <div className="sg-app-shell">
          <div className="sg-panel">
            <strong>Unable to load workspace</strong>
            <p className="sg-panel-copy">
              {workspaceState.error || "SpendGuard could not load the workspace right now."}
            </p>
            <div className="sg-form-actions" style={{ marginTop: 16 }}>
              <button className="sg-button-secondary" type="button" onClick={auth.signOut}>
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const latestAnalysis = workspace?.aiAnalyses?.[0];
  const departmentById = new Map(workspace.departments.map((department) => [department.id, department]));
  const vendorById = new Map(workspace.vendors.map((vendor) => [vendor.id, vendor]));
  const categoryById = new Map(workspace.categories.map((category) => [category.id, category]));
  const selectedSubscription = drawerSubscription
    ? workspace.subscriptions.find((subscription) => subscription.id === drawerSubscription)
    : null;
  const selectedSubscriptionPayments = selectedSubscription
    ? workspace.payments
      .filter((payment) => payment.subscriptionId === selectedSubscription.id)
      .sort((left, right) => new Date(right.dueDate).getTime() - new Date(left.dueDate).getTime())
    : [];

  return (
    <main className="sg-page">
      <div className="sg-app-shell">
        <motion.header
          className="sg-topbar"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="sg-topbar-brand">
            <Image src="/logo.png" alt="SpendGuard" width={164} height={82} />
            <div className="sg-topbar-copy">
              <h1>{workspace.business.name}</h1>
              <div className="sg-topbar-badges">
                <span className="sg-badge">Secure workspace</span>
                <span className="sg-badge">{workspace.metrics.activeCount} active</span>
                <span className="sg-badge">
                  {formatCurrency(workspace.metrics.monthlySpend, workspace.business.currency)} / month
                </span>
              </div>
            </div>
          </div>

          <div className="sg-topbar-actions">
            <button className="sg-button-secondary" type="button" onClick={() => workspaceState.runAnalysis()}>
              <Sparkles size={18} /> Analyze and improve
            </button>
            <button className="sg-button-ghost" type="button" onClick={exportSubscriptionsCsv}>
              <FileDown size={18} /> Export subscriptions
            </button>
            <button className="sg-button-ghost" type="button" onClick={exportPaymentsCsv}>
              <FileDown size={18} /> Export payments
            </button>
            <button className="sg-button-ghost" type="button" onClick={auth.signOut}>
              <LogOut size={18} /> Sign out
            </button>
          </div>
        </motion.header>

        {workspaceState.error ? (
          <div className="sg-banner">
            <div>
              <strong>Workspace notice</strong>
              <span>{workspaceState.error}</span>
            </div>
          </div>
        ) : null}

        <div className="sg-app-grid">
          <aside className="sg-sidebar">
            <div className="sg-sidebar-header">
              <span className="sg-sidebar-label">Workspace</span>
              <strong>{auth.userName}</strong>
            </div>
            <nav className="sg-nav" aria-label="Primary">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={isActive ? "is-active" : ""}
                    onClick={() => setActiveView(item.id)}
                    style={{ position: "relative" }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-glow"
                        className="sg-nav-indicator"
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <motion.div
                      animate={isActive ? { scale: 1.15, rotate: [0, -10, 10, -10, 0] } : { scale: 1, rotate: 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ 
                        scale: { type: "spring", stiffness: 400, damping: 17 },
                        rotate: { duration: 0.45, ease: "easeInOut" }
                      }}
                      style={{ 
                        position: "relative", 
                        zIndex: 1, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        width: 24,
                        height: 24,
                        color: "inherit"
                      }}
                    >
                      <Icon size={18} />
                    </motion.div>
                    <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="sg-sidebar-metrics">
              <div className="sg-sidebar-metric">
                <span>Unread</span>
                <strong>{workspace.metrics.unreadAlerts}</strong>
              </div>
              <div className="sg-sidebar-metric">
                <span>Duplicates</span>
                <strong>{workspace.metrics.duplicateTools}</strong>
              </div>
              <div className="sg-sidebar-metric">
                <span>Underused</span>
                <strong>{workspace.metrics.underused}</strong>
              </div>
            </div>
          </aside>

          <section className="sg-main">
            {activeView === "dashboard" ? (
              <>
                <motion.section
                  className="sg-panel"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="sg-panel-header">
                    <div>
                      <h2 className="sg-panel-title">Overview</h2>
                      <p className="sg-panel-copy">Spend, risk, and renewals.</p>
                    </div>
                    <div className="sg-note">
                      Last sync: {workspaceState.lastSync ? formatDate(workspaceState.lastSync.slice(0, 10)) : "Just now"}
                    </div>
                  </div>

                  <div className="sg-overview-strip">
                    <div className="sg-overview-pill">
                      <span>Projected yearly spend</span>
                      <strong>{formatCurrency(workspace.metrics.yearlySpend, workspace.business.currency)}</strong>
                    </div>
                    <div className="sg-overview-pill">
                      <span>Pending + overdue</span>
                      <strong>{workspace.metrics.pendingPayments + workspace.metrics.overduePayments}</strong>
                    </div>
                    <div className="sg-overview-pill">
                      <span>Renewal watch</span>
                      <strong>{workspace.metrics.nextRenewalDate ? formatDate(workspace.metrics.nextRenewalDate) : "Clear"}</strong>
                    </div>
                  </div>

                  <motion.div
                    className="sg-kpi-grid"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                  >
                    {[
                      {
                        label: "Monthly run-rate",
                        value: formatCurrency(workspace.metrics.monthlySpend, workspace.business.currency),
                        footnote: `${workspace.metrics.activeCount} active subscriptions`,
                        icon: CreditCard
                      },
                      {
                        label: "Unread alerts",
                        value: workspace.metrics.unreadAlerts,
                        footnote: `${workspace.metrics.pendingPayments} pending and ${workspace.metrics.overduePayments} overdue`,
                        icon: Bell
                      },
                      {
                        label: "Duplicate tools",
                        value: workspace.metrics.duplicateTools,
                        footnote: `${workspace.metrics.underused} underused or unused`,
                        icon: AlertTriangle
                      },
                      {
                        label: "Next renewal",
                        value: workspace.metrics.nextRenewalDate ? formatDate(workspace.metrics.nextRenewalDate) : "No upcoming renewals",
                        footnote: "Review seats before the next billing event",
                        icon: CalendarClock
                      }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.label}
                          className="sg-kpi-card"
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 }
                          }}
                        >
                          <div className="sg-kpi-top">
                            <span className="sg-kpi-label">{item.label}</span>
                            <Icon size={18} />
                          </div>
                          <div className="sg-kpi-value">{item.value}</div>
                          <div className="sg-kpi-footnote">{item.footnote}</div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.section>

                <div className="sg-content-grid">
                  <motion.section
                    className="sg-visual-cost"
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <div>
                      <h3>Department load</h3>
                      <p>Current monthly cost by team.</p>
                    </div>
                    <div className="sg-cost-layers">
                      {workspace.reports.departmentSpend.map((entry, index) => {
                        const highest = Math.max(...workspace.reports.departmentSpend.map((item) => item.total), 1);
                        const width = `${(entry.total / highest) * 100}%`;
                        return (
                          <div className="sg-cost-layer" key={entry.name}>
                            <strong>{entry.name}</strong>
                            <div className="sg-cost-track">
                              <motion.div
                                className="sg-cost-fill"
                                style={{ width, background: categoryAccent[index % categoryAccent.length] }}
                                initial={{ width: 0 }}
                                animate={{ width }}
                                transition={{ duration: 0.8, delay: index * 0.08 }}
                              />
                            </div>
                            <span>{formatCurrency(entry.total, workspace.business.currency)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.section>

                  <motion.section
                    className="sg-panel"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <div className="sg-panel-header">
                      <div>
                        <h2 className="sg-panel-title">Alert queue</h2>
                        <p className="sg-panel-copy">Renewals, payments, and overlap.</p>
                      </div>
                    </div>

                    <div className="sg-alert-list">
                      {workspace.alerts.slice(0, 4).map((alert) => (
                        <div className="sg-alert" key={alert.id}>
                          <div>
                            <strong>{alert.title}</strong>
                            <span>{alert.body}</span>
                          </div>
                          <div className={`sg-status ${statusToneMap[alert.severity === "high" ? "overdue" : "pending"]}`}>
                            {alert.severity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                </div>

                <section className="sg-panel">
                  <div className="sg-panel-header">
                    <div>
                      <h2 className="sg-panel-title">Go to</h2>
                      <p className="sg-panel-copy">Jump to the next task.</p>
                    </div>
                  </div>

                  <div className="sg-quick-grid">
                    {quickActions.map((action) => (
                      <button className="sg-quick-card" type="button" key={action.title} onClick={() => setActiveView(action.id)}>
                        <div>
                          <h4>{action.title}</h4>
                          <p>{action.detail}</p>
                        </div>
                        <ArrowRight size={18} />
                      </button>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            {activeView === "subscriptions" ? (
              <motion.section
                className="sg-panel"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="sg-panel-header">
                  <div>
                    <h2 className="sg-panel-title">Subscriptions</h2>
                    <p className="sg-panel-copy">Search, filter, and edit contracts.</p>
                  </div>
                  <button className="sg-button" type="button" onClick={openCreateSubscription}>
                    <Plus size={18} /> New subscription
                  </button>
                </div>

                <div className="sg-overview-strip sg-overview-strip-compact">
                  <div className="sg-overview-pill">
                    <span>Total</span>
                    <strong>{workspace.subscriptions.length}</strong>
                  </div>
                  <div className="sg-overview-pill">
                    <span>Active</span>
                    <strong>{workspace.metrics.activeCount}</strong>
                  </div>
                  <div className="sg-overview-pill">
                    <span>Filtered</span>
                    <strong>{filteredSubscriptions.length}</strong>
                  </div>
                </div>

                <div className="sg-toolbar">
                  <div className="sg-search">
                    <Search size={18} />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search subscriptions"
                    />
                  </div>

                  <div className="sg-chip-row">
                    <button
                      className={`sg-chip ${selectedStatus === "all" ? "is-active" : ""}`}
                      type="button"
                      onClick={() => setSelectedStatus("all")}
                    >
                      All statuses
                    </button>
                    {["active", "inactive", "canceled"].map((status) => (
                      <button
                        key={status}
                        className={`sg-chip ${selectedStatus === status ? "is-active" : ""}`}
                        type="button"
                        onClick={() => setSelectedStatus(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sg-chip-row" style={{ marginBottom: 16 }}>
                  <button
                    className={`sg-chip ${selectedCategory === "all" ? "is-active" : ""}`}
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All categories
                  </button>
                  {workspace.categories.map((category) => (
                    <button
                      key={category.id}
                      className={`sg-chip ${selectedCategory === category.id ? "is-active" : ""}`}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                <table className="sg-table">
                  <thead>
                    <tr>
                      <th>Subscription</th>
                      <th>Department</th>
                      <th>Renewal</th>
                      <th>Status</th>
                      <th>Usage</th>
                      <th>Monthly view</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map((subscription) => (
                      <tr key={subscription.id}>
                        <td data-label="Subscription">
                          <div className="sg-subscription-main">
                            <VendorMark
                              logoKey={vendorById.get(subscription.vendorId)?.logoKey}
                              category={categoryById.get(subscription.categoryId)?.name.toLowerCase()}
                              domain={vendorById.get(subscription.vendorId)?.website}
                            />
                            <div>
                              <div className="sg-subscription-name">{subscription.toolName}</div>
                              <div className="sg-subscription-meta">
                                {vendorById.get(subscription.vendorId)?.name} - {subscription.planName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td data-label="Department">
                          {departmentById.get(subscription.departmentId)?.name || "Unassigned"}
                        </td>
                        <td data-label="Renewal">{formatDate(subscription.renewalDate)}</td>
                        <td data-label="Status">
                          <span className={`sg-status ${statusToneMap[subscription.status]}`}>{subscription.status}</span>
                        </td>
                        <td data-label="Usage">
                          <span className={`sg-status ${statusToneMap[subscription.usageStatus]}`}>
                            {subscription.usageStatus.replace("_", " ")}
                          </span>
                        </td>
                        <td data-label="Monthly view">
                          {formatCurrency(
                            subscription.billingCycle === "annual"
                              ? subscription.cost / 12
                              : subscription.billingCycle === "quarterly"
                                ? subscription.cost / 3
                                : subscription.cost,
                            subscription.currency
                          )}
                        </td>
                        <td data-label="Actions">
                          <div className="sg-inline-actions">
                            <button
                              className="sg-icon-button"
                              type="button"
                              onClick={() => setDrawerSubscription(subscription.id)}
                              aria-label={`Open ${subscription.toolName}`}
                            >
                              <ArrowRight size={18} />
                            </button>
                            <button
                              className="sg-icon-button"
                              type="button"
                              onClick={() => openEditSubscription(subscription)}
                              aria-label={`Edit ${subscription.toolName}`}
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              className="sg-icon-button"
                              type="button"
                              onClick={() => workspaceState.deleteSubscription(subscription.id)}
                              aria-label={`Delete ${subscription.toolName}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.section>
            ) : null}


            {activeView === "reports" ? (() => {
              // Create enhanced graph data on the fly
              const healthDistribution = [
                { name: 'Healthy', value: 0 },
                { name: 'Underused', value: 0 },
                { name: 'Duplicate candidates', value: 0 },
                { name: 'Unused', value: 0 }
              ];

              workspace.subscriptions.forEach(sub => {
                if (sub.usageStatus === 'healthy') healthDistribution[0].value += sub.cost;
                else if (sub.usageStatus === 'underused') healthDistribution[1].value += sub.cost;
                else if (sub.usageStatus === 'duplicate_candidate') healthDistribution[2].value += sub.cost;
                else if (sub.usageStatus === 'unused') healthDistribution[3].value += sub.cost;
              });

              const topCostly = [...workspace.subscriptions]
                .sort((a, b) => b.cost - a.cost)
                .slice(0, 5)
                .map(sub => ({ name: sub.toolName.length > 20 ? sub.toolName.substring(0, 18) + '...' : sub.toolName, total: sub.cost }));

              return (
                <motion.section
                  className="sg-panel"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="sg-panel-header">
                    <div>
                      <h2 className="sg-panel-title">Reports & Analytics</h2>
                      <p className="sg-panel-copy">Detailed breakdown of organizational spend.</p>
                    </div>
                    <button className="sg-button" type="button" onClick={exportSubscriptionsCsv}>
                      <FileDown size={18} /> Export Data
                    </button>
                  </div>

                  <div className="sg-report-grid">
                    <div className="sg-surface sg-panel" style={{ gridColumn: '1 / -1' }}>
                      <h4 className="sg-panel-title" style={{ fontSize: 16 }}>Payment pipeline (Next 12 Months)</h4>
                      <div className="sg-chart-shell" style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={workspace.reports.monthlyTrend}>
                            <defs>
                              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(16, 21, 18, 0.08)" />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value), workspace.business.currency)} />
                            <Area type="monotone" dataKey="total" stroke="#2563eb" fill="url(#spendGradient)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="sg-surface sg-panel">
                      <h4 className="sg-panel-title" style={{ fontSize: 16 }}>Department consumption</h4>
                      <div className="sg-chart-shell">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={workspace.reports.departmentSpend} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(16, 21, 18, 0.08)" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} style={{ fontSize: 11 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => formatCurrency(Number(value), workspace.business.currency)} />
                            <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                              {workspace.reports.departmentSpend.map((entry, index) => (
                                <Cell key={entry.name} fill={categoryAccent[index % categoryAccent.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="sg-surface sg-panel">
                      <h4 className="sg-panel-title" style={{ fontSize: 16 }}>Top expensive tools</h4>
                      <div className="sg-chart-shell">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topCostly}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(16, 21, 18, 0.08)" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                            <YAxis tickLine={false} axisLine={false} width={30} tick={{ fontSize: 11 }} tickFormatter={(val) => `${val / 1000}k`} />
                            <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => formatCurrency(Number(value), workspace.business.currency)} />
                            <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#f59e0b" barSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="sg-surface sg-panel">
                      <h4 className="sg-panel-title" style={{ fontSize: 16 }}>Category distribution</h4>
                      <div className="sg-chart-shell">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip formatter={(value) => formatCurrency(Number(value), workspace.business.currency)} />
                            <Pie
                              data={workspace.reports.categorySpend}
                              dataKey="total"
                              nameKey="name"
                              innerRadius={65}
                              outerRadius={95}
                              paddingAngle={3}
                            >
                              {workspace.reports.categorySpend.map((entry, index) => (
                                <Cell key={entry.name} fill={categoryAccent[index % categoryAccent.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="sg-surface sg-panel">
                      <h4 className="sg-panel-title" style={{ fontSize: 16 }}>Efficiency risk (Spend by Usage)</h4>
                      <div className="sg-chart-shell">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip formatter={(value) => formatCurrency(Number(value), workspace.business.currency)} />
                            <Pie
                              data={healthDistribution.filter(x => x.value > 0)}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={0}
                              outerRadius={95}
                              paddingAngle={1}
                            >
                              {healthDistribution.filter(x => x.value > 0).map((entry, index) => {
                                const colorMap = { 'Healthy': '#16a34a', 'Underused': '#f59e0b', 'Duplicate candidates': '#ef4444', 'Unused': '#64748b' };
                                return <Cell key={entry.name} fill={colorMap[entry.name]} />
                              })}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </motion.section>
              );
            })() : null}

            {activeView === "ai" ? (
              <motion.section
                className="sg-panel"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="sg-panel-header">
                  <div>
                    <h2 className="sg-panel-title">AI Center</h2>
                    <p className="sg-panel-copy" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} style={{ color: 'var(--green)' }} />
                      Intelligent recommendations, waste detection, and savings opportunities.
                    </p>
                  </div>
                  <motion.button
                    className="sg-button"
                    type="button"
                    onClick={() => workspaceState.runAnalysis()}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 15, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                      style={{ display: 'inline-flex', marginRight: 6 }}
                    >
                      <Sparkles size={18} />
                    </motion.div>
                    Analyze workspace
                  </motion.button>
                </div>

                {latestAnalysis ? (
                  <motion.div
                    className="sg-analysis-grid"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
                    }}
                  >
                    <motion.div
                      className="sg-ai-card"
                      variants={{
                        hidden: { opacity: 0, scale: 0.95, y: 15 },
                        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 15 } }
                      }}
                      whileHover={{ scale: 1.01, boxShadow: "0 10px 25px rgba(22, 163, 74, 0.08)" }}
                    >
                      <h4><Sparkles size={16} style={{ display: "inline-block", marginRight: 6, color: "var(--green)" }} /> {latestAnalysis.headline}</h4>
                      <p className="sg-panel-copy">{latestAnalysis.summary}</p>
                      <p className="sg-note">
                        Generated {formatDate(latestAnalysis.generatedAt.slice(0, 10))}
                        {latestAnalysis.warning ? ` - ${latestAnalysis.warning}` : ""}
                      </p>
                    </motion.div>

                    <motion.div
                      className="sg-ai-card"
                      variants={{
                        hidden: { opacity: 0, scale: 0.95, y: 15 },
                        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 15 } }
                      }}
                      whileHover={{ scale: 1.01, boxShadow: "0 10px 25px rgba(22, 163, 74, 0.08)" }}
                    >
                      <h4>Savings opportunities</h4>
                      <ul>
                        {latestAnalysis.savingsOpportunities?.map((item) => (
                          <motion.li key={item.title} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25, duration: 0.4 }}>
                            <strong>{item.title}:</strong> {item.detail} <span style={{ color: "var(--green)", fontWeight: 600 }}>({item.estimatedSavings})</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>

                    <motion.div
                      className="sg-ai-card"
                      variants={{
                        hidden: { opacity: 0, scale: 0.95, y: 15 },
                        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 15 } }
                      }}
                      whileHover={{ scale: 1.01, boxShadow: "0 10px 25px rgba(245, 158, 11, 0.08)" }}
                    >
                      <h4>Renewal risks</h4>
                      <ul>
                        {latestAnalysis.renewalRisks?.map((risk) => (
                          <motion.li key={risk.title} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.4 }}>
                            <strong>{risk.title}:</strong> {risk.detail} <span style={{ color: "var(--orange)" }}>({risk.dueDate})</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>

                    <motion.div
                      className="sg-ai-card"
                      variants={{
                        hidden: { opacity: 0, scale: 0.95, y: 15 },
                        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 15 } }
                      }}
                      whileHover={{ scale: 1.01, boxShadow: "0 10px 25px rgba(37, 99, 235, 0.08)" }}
                    >
                      <h4>Recommended actions</h4>
                      <ul>
                        {latestAnalysis.recommendedActions?.map((action) => (
                          <motion.li key={action} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.45, duration: 0.4 }}>
                            {action}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="sg-empty"
                    style={{ marginBottom: 40 }}
                    initial={{ opacity: 0, scale: 0.92, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
                      <Bot size={40} style={{ color: "var(--muted)", marginBottom: 12 }} />
                    </motion.div>
                    Run an AI analysis to calculate insights against your latest financial data.
                  </motion.div>
                )}
              </motion.section>
            ) : null}

            {activeView === "settings" ? (
              <motion.section
                className="sg-panel"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="sg-panel-header">
                  <div>
                    <h2 className="sg-panel-title">Settings</h2>
                    <p className="sg-panel-copy">Payments, teams, and system status.</p>
                  </div>
                </div>

                <div className="sg-settings-grid">
                  <form className="sg-surface sg-panel" onSubmit={handleSavePayment}>
                    <h3 className="sg-panel-title" style={{ fontSize: 18 }}>Log a payment</h3>
                    <p className="sg-panel-copy">Add a paid, pending, or overdue entry.</p>
                    <label className="sg-field">
                      <span>Subscription</span>
                      <select
                        value={paymentForm.subscriptionId}
                        onChange={(event) =>
                          setPaymentForm((current) => ({ ...current, subscriptionId: event.target.value }))
                        }
                        required
                      >
                        <option value="">Select a subscription</option>
                        {workspace.subscriptions.map((subscription) => (
                          <option key={subscription.id} value={subscription.id}>
                            {subscription.toolName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="sg-form-grid">
                      <label className="sg-field">
                        <span>Amount</span>
                        <input
                          type="number"
                          min="0"
                          value={paymentForm.amount}
                          onChange={(event) =>
                            setPaymentForm((current) => ({ ...current, amount: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label className="sg-field">
                        <span>Status</span>
                        <select
                          value={paymentForm.status}
                          onChange={(event) =>
                            setPaymentForm((current) => ({ ...current, status: event.target.value }))
                          }
                        >
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </label>
                    </div>
                    <div className="sg-form-grid">
                      <label className="sg-field">
                        <span>Due date</span>
                        <input
                          type="date"
                          value={paymentForm.dueDate}
                          onChange={(event) =>
                            setPaymentForm((current) => ({ ...current, dueDate: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label className="sg-field">
                        <span>Paid at</span>
                        <input
                          type="date"
                          value={paymentForm.paidAt}
                          onChange={(event) =>
                            setPaymentForm((current) => ({ ...current, paidAt: event.target.value }))
                          }
                        />
                      </label>
                    </div>
                    <label className="sg-field">
                      <span>Reference</span>
                      <input
                        value={paymentForm.reference}
                        onChange={(event) =>
                          setPaymentForm((current) => ({ ...current, reference: event.target.value }))
                        }
                        placeholder="Invoice or card reference"
                      />
                    </label>
                    <label className="sg-field">
                      <span>Notes</span>
                      <textarea
                        value={paymentForm.notes}
                        onChange={(event) =>
                          setPaymentForm((current) => ({ ...current, notes: event.target.value }))
                        }
                        placeholder="Optional context for the payment record"
                      />
                    </label>
                    <button className="sg-button" type="submit">
                      Save payment
                    </button>
                  </form>

                  <div className="sg-stack">
                    <form className="sg-surface sg-panel" onSubmit={handleSaveWorkspace}>
                      <h3 className="sg-panel-title" style={{ fontSize: 18 }}>Workspace profile</h3>
                      <p className="sg-panel-copy">Set the company name shown across the app.</p>
                      <label className="sg-field">
                        <span>Company name</span>
                        <input
                          value={workspaceName}
                          onChange={(event) => setWorkspaceName(event.target.value)}
                          placeholder="Northstar Creative"
                          required
                        />
                      </label>
                      <button
                        className="sg-button-secondary"
                        type="submit"
                        disabled={workspaceState.busy || !workspaceName.trim()}
                      >
                        Save company name
                      </button>
                    </form>

                    <form
                      className="sg-surface sg-panel"
                      onSubmit={(event) => {
                        event.preventDefault();
                        workspaceState.addDepartment(departmentName);
                        setDepartmentName("");
                      }}
                    >
                      <h3 className="sg-panel-title" style={{ fontSize: 18 }}>Departments</h3>
                      <p className="sg-panel-copy">Keep ownership clean.</p>
                      <label className="sg-field">
                        <span>New department</span>
                        <input
                          value={departmentName}
                          onChange={(event) => setDepartmentName(event.target.value)}
                          placeholder="Sales"
                        />
                      </label>
                      <button className="sg-button-secondary" type="submit">
                        <Plus size={16} /> Add department
                      </button>
                      <div className="sg-list" style={{ marginTop: 14 }}>
                        {workspace.departments.map((department) => (
                          <div className="sg-list-item" key={department.id}>
                            <div className="sg-list-copy">
                              <strong>{department.name}</strong>
                              <span>{workspace.subscriptions.filter((entry) => entry.departmentId === department.id).length} subscriptions</span>
                            </div>
                            <span className="sg-status tone-green">active</span>
                          </div>
                        ))}
                      </div>
                    </form>

                    <div className="sg-surface sg-panel">
                      <h3 className="sg-panel-title" style={{ fontSize: 18 }}>System</h3>
                      <p className="sg-panel-copy">Connection and runtime status.</p>
                      <div className="sg-list">
                        <div className="sg-list-item">
                          <div className="sg-list-copy">
                            <strong>Authentication</strong>
                            <span>Supabase authentication is active for this workspace.</span>
                          </div>
                          <span className="sg-status tone-green">live ready</span>
                        </div>
                        <div className="sg-list-item">
                          <div className="sg-list-copy">
                            <strong>AI analysis</strong>
                            <span>Groq first, local fallback.</span>
                          </div>
                          <span className="sg-status tone-blue">hybrid</span>
                        </div>
                        <div className="sg-list-item">
                          <div className="sg-list-copy">
                            <strong>Workspace data</strong>
                            <span>Operational data is loaded from your live Supabase workspace.</span>
                          </div>
                          <span className="sg-status tone-green">connected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            ) : null}
          </section>
        </div>
      </div>

      <AnimatePresence>
        {isSubscriptionFormOpen && activeView === "subscriptions" ? (
          <motion.div
            className="sg-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsSubscriptionFormOpen(false);
              setEditingSubscription(null);
              setSubscriptionForm(emptySubscriptionForm);
              setCustomVendorName("");
            }}
          >
            <motion.aside
              className="sg-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sg-drawer-head">
                <div>
                  <h3>{editingSubscription ? "Update subscription" : "New subscription"}</h3>
                  <p className="sg-panel-copy">Contract details.</p>
                </div>
                <button
                  className="sg-icon-button"
                  type="button"
                  onClick={() => {
                    setIsSubscriptionFormOpen(false);
                    setEditingSubscription(null);
                    setSubscriptionForm(emptySubscriptionForm);
                    setCustomVendorName("");
                  }}
                  aria-label="Close form"
                >
                  <ArrowRight size={18} />
                </button>
              </div>

              <form className="sg-stack" onSubmit={handleSaveSubscription}>
                <label className="sg-field">
                  <span>Tool name</span>
                  <input
                    value={subscriptionForm.toolName}
                    onChange={(event) =>
                      setSubscriptionForm((current) => ({ ...current, toolName: event.target.value }))
                    }
                    required
                  />
                </label>
                <div className="sg-form-grid">
                  <label className="sg-field">
                    <span>Vendor</span>
                    <select
                      value={subscriptionForm.vendorId}
                      onChange={(event) => {
                        const nextVendorId = event.target.value;
                        setSubscriptionForm((current) => ({ ...current, vendorId: nextVendorId }));

                        if (nextVendorId !== CUSTOM_VENDOR_ID) {
                          setCustomVendorName("");
                        }
                      }}
                      required
                    >
                      {workspace.vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                      <option value={CUSTOM_VENDOR_ID}>Other</option>
                    </select>
                  </label>
                  <label className="sg-field">
                    <span>Department</span>
                    <select
                      value={subscriptionForm.departmentId}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, departmentId: event.target.value }))
                      }
                      required
                    >
                      {workspace.departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {subscriptionForm.vendorId === CUSTOM_VENDOR_ID ? (
                  <label className="sg-field">
                    <span>Custom vendor name</span>
                    <input
                      value={customVendorName}
                      onChange={(event) => setCustomVendorName(event.target.value)}
                      placeholder="Netflix"
                      required
                    />
                  </label>
                ) : null}
                <div className="sg-form-grid">
                  <label className="sg-field">
                    <span>Category</span>
                    <select
                      value={subscriptionForm.categoryId}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, categoryId: event.target.value }))
                      }
                      required
                    >
                      {workspace.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="sg-field">
                    <span>Plan</span>
                    <input
                      value={subscriptionForm.planName}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, planName: event.target.value }))
                      }
                      required
                    />
                  </label>
                </div>
                <div className="sg-form-grid">
                  <label className="sg-field">
                    <span>Cost</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={subscriptionForm.cost}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, cost: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="sg-field">
                    <span>Billing cycle</span>
                    <select
                      value={subscriptionForm.billingCycle}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, billingCycle: event.target.value }))
                      }
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </label>
                </div>
                <div className="sg-form-grid">
                  <label className="sg-field">
                    <span>Renewal date</span>
                    <input
                      type="date"
                      value={subscriptionForm.renewalDate}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, renewalDate: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="sg-field">
                    <span>Next billing date</span>
                    <input
                      type="date"
                      value={subscriptionForm.nextBillingDate}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, nextBillingDate: event.target.value }))
                      }
                      required
                    />
                  </label>
                </div>
                <div className="sg-form-grid">
                  <label className="sg-field">
                    <span>Status</span>
                    <select
                      value={subscriptionForm.status}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, status: event.target.value }))
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </label>
                  <label className="sg-field">
                    <span>Usage</span>
                    <select
                      value={subscriptionForm.usageStatus}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, usageStatus: event.target.value }))
                      }
                    >
                      <option value="healthy">Healthy</option>
                      <option value="underused">Underused</option>
                      <option value="unused">Unused</option>
                      <option value="duplicate_candidate">Duplicate candidate</option>
                    </select>
                  </label>
                </div>
                <div className="sg-form-grid">
                  <label className="sg-field">
                    <span>Seats</span>
                    <input
                      type="number"
                      min="1"
                      value={subscriptionForm.seats}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, seats: event.target.value }))
                      }
                    />
                  </label>
                  <label className="sg-field">
                    <span>Auto renew</span>
                    <select
                      value={subscriptionForm.autoRenew ? "yes" : "no"}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({
                          ...current,
                          autoRenew: event.target.value === "yes"
                        }))
                      }
                    >
                      <option value="yes">Enabled</option>
                      <option value="no">Disabled</option>
                    </select>
                  </label>
                </div>
                <label className="sg-field">
                  <span>Notes</span>
                  <textarea
                    value={subscriptionForm.notes}
                    onChange={(event) =>
                      setSubscriptionForm((current) => ({ ...current, notes: event.target.value }))
                    }
                  />
                </label>
                <button className="sg-button" type="submit" disabled={workspaceState.busy}>
                  {editingSubscription ? "Save changes" : "Create subscription"}
                </button>
              </form>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSubscription ? (
          <motion.div
            className="sg-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerSubscription(null)}
          >
            <motion.aside
              className="sg-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sg-drawer-head">
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <VendorMark
                    logoKey={vendorById.get(selectedSubscription.vendorId)?.logoKey}
                    category={categoryById.get(selectedSubscription.categoryId)?.name.toLowerCase()}
                    domain={vendorById.get(selectedSubscription.vendorId)?.website}
                  />
                  <div>
                    <h3 style={{ margin: 0 }}>{selectedSubscription.toolName}</h3>
                    <p className="sg-panel-copy" style={{ margin: "4px 0 0" }}>
                      {vendorById.get(selectedSubscription.vendorId)?.name} - {selectedSubscription.planName}
                    </p>
                  </div>
                </div>
                <button className="sg-icon-button" type="button" onClick={() => setDrawerSubscription(null)}>
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="sg-stack">
                <div className="sg-list-item">
                  <div className="sg-list-copy">
                    <strong>Department</strong>
                    <span>{departmentById.get(selectedSubscription.departmentId)?.name || "Unassigned"}</span>
                  </div>
                  <Building2 size={18} />
                </div>
                <div className="sg-list-item">
                  <div className="sg-list-copy">
                    <strong>Billing cadence</strong>
                    <span>
                      {billingCycleLabels[selectedSubscription.billingCycle]} - next bill {formatDate(selectedSubscription.nextBillingDate)}
                    </span>
                  </div>
                  <CalendarClock size={18} />
                </div>
                <div className="sg-list-item">
                  <div className="sg-list-copy">
                    <strong>Usage profile</strong>
                    <span>{selectedSubscription.usageStatus.replace("_", " ")}</span>
                  </div>
                  <span className={`sg-status ${statusToneMap[selectedSubscription.usageStatus]}`}>
                    {selectedSubscription.usageStatus.replace("_", " ")}
                  </span>
                </div>
                <div className="sg-list-item">
                  <div className="sg-list-copy">
                    <strong>Notes</strong>
                    <span>{selectedSubscription.notes || "No notes yet."}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <h4 style={{ margin: 0, fontSize: 18 }}>Payment history</h4>
                <div className="sg-list" style={{ marginTop: 12 }}>
                  {selectedSubscriptionPayments.map((payment) => (
                    <div className="sg-list-item" key={payment.id}>
                      <div className="sg-list-copy">
                        <strong>{formatCurrency(payment.amount, payment.currency)}</strong>
                        <span>
                          Due {formatDate(payment.dueDate)}
                          {payment.paidAt ? ` - paid ${formatDate(payment.paidAt)}` : ""}
                        </span>
                      </div>
                      <span className={`sg-status ${statusToneMap[payment.status]}`}>{payment.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

