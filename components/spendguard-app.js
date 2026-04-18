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
import { VendorMark } from "@/components/vendor-mark";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "reports", label: "Reports", icon: FileDown },
  { id: "ai", label: "AI Center", icon: Bot },
  { id: "settings", label: "Settings", icon: Settings2 }
];

const categoryAccent = ["#16a34a", "#f59e0b", "#2563eb", "#ef4444"];
const quickActions = [
  {
    id: "subscriptions",
    title: "Manage subscriptions",
    detail: "Contracts, owners, and renewals"
  },
  {
    id: "reports",
    title: "Open reports",
    detail: "Spend by team and category"
  },
  {
    id: "ai",
    title: "Run AI review",
    detail: "Waste, overlap, and savings"
  },
  {
    id: "settings",
    title: "Update workspace",
    detail: "Payments, teams, and status"
  }
];

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

  if (auth.loading || workspaceState.loading || (auth.mode !== "guest" && !workspace)) {
    return (
      <main className="sg-page">
        <div className="sg-app-shell">
          <div className="sg-panel">
            <strong>Loading SpendGuard</strong>
            <p className="sg-panel-copy">Preparing the workspace.</p>
          </div>
        </div>
      </main>
    );
  }

  if (auth.mode === "guest") {
    return (
      <main className="sg-page">
        <div className="sg-auth-shell">
          <motion.section
            className="sg-brand-panel"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <Image src="/logo.png" alt="SpendGuard" width={220} height={110} className="sg-brand-logo" />
            <div className="sg-brand-hero">
              <span className="sg-brand-kicker">
                <ShieldCheck size={16} /> Subscription operations
              </span>
              <h1 className="sg-brand-title">Control every renewal before it turns into a finance problem.</h1>
              <p className="sg-brand-copy">
                SpendGuard keeps vendors, owners, billing cadence, payment history, and savings review in one
                operating layer.
              </p>
              <div className="sg-brand-points">
                <div className="sg-brand-point">
                  <CalendarClock size={18} />
                  <div>
                    <strong>Renewal visibility</strong>
                    <span>See upcoming contracts by owner, vendor, and billing date.</span>
                  </div>
                </div>
                <div className="sg-brand-point">
                  <CreditCard size={18} />
                  <div>
                    <strong>Payment context</strong>
                    <span>Keep recurring charges and references attached to the right subscription.</span>
                  </div>
                </div>
                <div className="sg-brand-point">
                  <Sparkles size={18} />
                  <div>
                    <strong>AI review</strong>
                    <span>Spot overlap, underused tools, and savings opportunities before renewal.</span>
                  </div>
                </div>
              </div>
              <div className="sg-brand-signal">
                <span>Workspace-scoped access</span>
                <span>Operational reporting</span>
                <span>Vendor oversight</span>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="sg-auth-panel"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
          >
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
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={activeView === item.id ? "is-active" : ""}
                    onClick={() => setActiveView(item.id)}
                  >
                    <Icon size={18} /> {item.label}
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

                  <div className="sg-kpi-grid">
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
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35 }}
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
                  </div>
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
                      <button className="sg-quick-card" type="button" key={action.id} onClick={() => setActiveView(action.id)}>
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

            {activeView === "reports" ? (
              <motion.section
                className="sg-panel"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="sg-panel-header">
                  <div>
                    <h2 className="sg-panel-title">Reports</h2>
                    <p className="sg-panel-copy">Spend by team, category, and month.</p>
                  </div>
                </div>

                <div className="sg-report-grid">
                  <div className="sg-surface sg-panel">
                    <h3 className="sg-panel-title" style={{ fontSize: 18 }}>Department spend</h3>
                    <div className="sg-chart-shell">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workspace.reports.departmentSpend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(16, 21, 18, 0.08)" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value), workspace.business.currency)} />
                          <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                            {workspace.reports.departmentSpend.map((entry, index) => (
                              <Cell key={entry.name} fill={categoryAccent[index % categoryAccent.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="sg-surface sg-panel">
                    <h3 className="sg-panel-title" style={{ fontSize: 18 }}>Category mix</h3>
                    <div className="sg-chart-shell">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip formatter={(value) => formatCurrency(Number(value), workspace.business.currency)} />
                          <Pie
                            data={workspace.reports.categorySpend}
                            dataKey="total"
                            nameKey="name"
                            innerRadius={70}
                            outerRadius={110}
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
                    <h3 className="sg-panel-title" style={{ fontSize: 18 }}>Payment trend</h3>
                    <div className="sg-chart-shell">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={workspace.reports.monthlyTrend}>
                          <defs>
                            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(16, 21, 18, 0.08)" />
                          <XAxis dataKey="month" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value), workspace.business.currency)} />
                          <Area type="monotone" dataKey="total" stroke="#16a34a" fill="url(#spendGradient)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="sg-surface sg-panel">
                    <h3 className="sg-panel-title" style={{ fontSize: 18 }}>Duplicate and renewal watch</h3>
                    <div className="sg-list">
                      {workspace.reports.duplicates.map((group) => (
                        <div className="sg-list-item" key={group[0].toolName}>
                          <div className="sg-list-copy">
                            <strong>{group[0].toolName}</strong>
                            <span>{group.map((entry) => entry.department).join(", ")}</span>
                          </div>
                          <span className="sg-status tone-blue">duplicate</span>
                        </div>
                      ))}
                      {workspace.reports.renewals.slice(0, 3).map((renewal) => (
                        <div className="sg-list-item" key={renewal.id}>
                          <div className="sg-list-copy">
                            <strong>{renewal.toolName}</strong>
                            <span>
                              {renewal.department} - {formatDate(renewal.renewalDate)}
                            </span>
                          </div>
                          <span className="sg-status tone-orange">renewal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.section>
            ) : null}

            {activeView === "ai" ? (
              <motion.section
                className="sg-panel"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="sg-panel-header">
                  <div>
                    <h2 className="sg-panel-title">AI center</h2>
                    <p className="sg-panel-copy">Fresh read on waste, overlap, and renewals.</p>
                  </div>
                  <button className="sg-button" type="button" onClick={() => workspaceState.runAnalysis()}>
                    <Sparkles size={18} /> Analyze now
                  </button>
                </div>

                {latestAnalysis ? (
                  <div className="sg-analysis-grid">
                    <div className="sg-ai-card">
                      <h4>{latestAnalysis.headline}</h4>
                      <p className="sg-panel-copy">{latestAnalysis.summary}</p>
                      <p className="sg-note">
                        Generated {formatDate(latestAnalysis.generatedAt.slice(0, 10))}
                        {latestAnalysis.warning ? ` - ${latestAnalysis.warning}` : ""}
                      </p>
                    </div>

                    <div className="sg-ai-card">
                      <h4>Savings opportunities</h4>
                      <ul>
                        {latestAnalysis.savingsOpportunities?.map((item) => (
                          <li key={item.title}>
                            <strong>{item.title}:</strong> {item.detail} ({item.estimatedSavings})
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="sg-ai-card">
                      <h4>Renewal risks</h4>
                      <ul>
                        {latestAnalysis.renewalRisks?.map((risk) => (
                          <li key={risk.title}>
                            <strong>{risk.title}:</strong> {risk.detail} ({risk.dueDate})
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="sg-ai-card">
                      <h4>Recommended actions</h4>
                      <ul>
                        {latestAnalysis.recommendedActions?.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="sg-empty">
                    Run the first AI analysis.
                  </div>
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
                <div>
                  <h3>{selectedSubscription.toolName}</h3>
                  <p className="sg-panel-copy">
                    {vendorById.get(selectedSubscription.vendorId)?.name} - {selectedSubscription.planName}
                  </p>
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

