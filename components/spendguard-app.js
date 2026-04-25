"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
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
  Send,
  Settings2,
  Sparkles,
  Check,
  Trash2,
  Users,
  X,
  Briefcase,
  Megaphone,
  Terminal,
  Box,
  PenTool,
  Shield,
  Calculator,
  LifeBuoy,
  MessageSquare,
  Globe
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

import { VendorMark } from "@/components/vendor-mark";
import { DEFAULT_VENDOR_CATALOG } from "@/lib/default-vendors";
import { useSpendGuardAuth } from "@/lib/use-spendguard-auth";
import { useSpendGuardWorkspace } from "@/lib/use-spendguard-workspace";
import { VisualPicker } from "@/components/visual-picker";
import {
  billingCycleLabels,
  downloadCsv,
  formatCurrency,
  formatDate,
  getSubscriptionName,
  statusToneMap
} from "@/lib/workspace";

const CUSTOM_VENDOR_ID = "__custom__";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "reports", label: "Reports", icon: FileDown },
  { id: "ai", label: "AI Center", icon: Bot },
  { id: "settings", label: "Settings", icon: Settings2 }
];

const DEPARTMENT_ICONS = {
  Operations: Settings2,
  Marketing: Megaphone,
  HR: Users,
  Sales: Briefcase,
  Engineering: Terminal,
  Product: Box,
  Design: PenTool,
  Legal: Shield,
  Finance: Calculator,
  "Customer Success": LifeBuoy,
};

const CATEGORY_ICONS = {
  Communication: MessageSquare,
  Engineering: Terminal,
  Marketing: Megaphone,
  Finance: Calculator,
  Security: Shield,
  Productivity: Sparkles,
  Design: PenTool,
  Sales: Briefcase,
  Hosting: Globe,
};

const chartColors = ["#16a34a", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const emptySubscriptionForm = {
  vendorId: "",
  customVendorName: "",
  departmentId: "",
  categoryId: "",
  planName: "",
  cost: 49,
  currency: "USD",
  billingCycle: "monthly",
  renewalDate: "",
  nextBillingDate: "",
  status: "active",
  notes: ""
};

function LogoPreloader({ workspace }) {
  const domains = useMemo(() => {
    if (!workspace) return [];
    const set = new Set();
    workspace.vendors.forEach(v => {
      if (v.website) {
        try {
          const d = v.website.includes('://') ? new URL(v.website).hostname : v.website;
          set.add(d);
        } catch (e) {}
      }
    });
    return Array.from(set);
  }, [workspace]);

  return (
    <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
      {domains.map(domain => (
        <React.Fragment key={domain}>
          <img src={`https://logo.clearbit.com/${domain}`} alt="" />
          <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} alt="" />
        </React.Fragment>
      ))}
    </div>
  );
}

function ChatLoadingState({ workspace }) {
  const vendors = useMemo(() => {
    if (!workspace) return [];
    // Just take 10 random vendors for the animation
    return [...workspace.vendors].sort(() => 0.5 - Math.random()).slice(0, 8);
  }, [workspace]);

  return (
    <div className="sg-chat-message is-assistant" style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none' }}>
      <div className="sg-chat-loading">
        <div className="sg-loading-label">Analyzing Workspace Context...</div>
        <div className="sg-loading-logos">
          {vendors.map((v, i) => (
            <motion.div
              key={v.id}
              className="sg-loading-logo-item"
              animate={{ 
                opacity: [0.2, 1, 0.2],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: i * 0.15 
              }}
            >
              <VendorMark logoKey={v.logoKey} domain={v.website} />
            </motion.div>
          ))}
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ fontSize: 10, marginLeft: 4 }}
          >
            ●●●
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function FormattedChatMessage({ content, workspaceState, workspace }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let nextStepsBlock = [];
  let isInNextSteps = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Section headers
    if (trimmed.startsWith("###")) {
      const title = trimmed.replace(/^#+\s*/, "");
      if (title.toLowerCase().includes("next steps") || title.toLowerCase().includes("recommendation")) {
        isInNextSteps = true;
        return;
      }
      elements.push(<h3 key={`h3-${index}`}>{title}</h3>);
      return;
    }

    // Check for vendor tag: [ANYTHING:logoKey|website]
    const vendorMatch = trimmed.match(/\[[^:\]]+:([^|\]]*)\|([^\]]*)\]\s*(.*)/);
    // Also check if it's a list item containing a vendor tag
    const listItemVendorMatch = trimmed.match(/^(\*|-|\d+\.)\s*\[[^:\]]+:([^|\]]*)\|([^\]]*)\]\s*(.*)/);

    if (vendorMatch || listItemVendorMatch) {
      const logoKey = vendorMatch ? vendorMatch[1] : listItemVendorMatch[2];
      const website = vendorMatch ? vendorMatch[2] : listItemVendorMatch[3];
      const rest = vendorMatch ? vendorMatch[3] : listItemVendorMatch[4];
      
      const formattedRest = rest.split("**").map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
      
      const card = (
        <div key={`vendor-${index}`} className="sg-chat-vendor-card">
          <VendorMark logoKey={logoKey} domain={website} />
          <div className="sg-chat-vendor-info">{formattedRest}</div>
        </div>
      );

      if (isInNextSteps) {
        nextStepsBlock.push(card);
      } else {
        elements.push(card);
      }
      return;
    }

    // Skip hidden AI action tags
    if (trimmed.startsWith("[ACTION:") || trimmed.startsWith("[PROPOSAL:")) {
      return;
    }

    // Standard list items
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || /^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^(\*|-|\d+\.)\s*/, "");
      const formatted = text.split("**").map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
      const item = (
        <div key={`li-${index}`} className="sg-chat-list-item">
          <div>{formatted}</div>
        </div>
      );

      if (isInNextSteps) {
        nextStepsBlock.push(item);
      } else {
        elements.push(item);
      }
      return;
    }

    // Standard paragraphs
    const formattedParagraph = trimmed.split("**").map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
    const p = <p key={`p-${index}`}>{formattedParagraph}</p>;
    
    if (isInNextSteps) {
      nextStepsBlock.push(p);
    } else {
      elements.push(p);
    }
  });

  return (
    <div className="sg-chat-formatted">
      {elements}
      {nextStepsBlock.length > 0 && (
        <div className="sg-chat-next-steps">
          <h4>Recommendations & Next Steps</h4>
          {nextStepsBlock}
        </div>
      )}
    </div>
  );
}

function LoadingScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(Math.floor(Math.random() * DEFAULT_VENDOR_CATALOG.length));
    }, 1200);
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
              className="sg-loader-logo-wrap"
              initial={{ opacity: 0, scale: 0.6, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.25, y: -15 }}
              transition={{ duration: 0.45, ease: "circOut" }}
            >
              <VendorMark logoKey={vendor.logoKey} domain={vendor.website} />
            </motion.div>
          </AnimatePresence>
          <div className="sg-loader-glow" />
        </div>
        <div className="sg-loader-text">
          <div className="sg-loader-status">Preparing workspace...</div>
          <p>
            Loading <strong>{vendor.name}</strong> context
          </p>
        </div>
        <div className="sg-loader-track">
          <motion.div
            className="sg-loader-progress"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "easeInOut" }}
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
          className="sg-landing-logo-wrap"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          <VendorMark logoKey={vendor.logoKey} domain={vendor.website} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AssistantMark({ size = 32 }) {
  return (
    <Image
      src="/favicon.png"
      alt="SpendGuard AI"
      width={size}
      height={size}
      className="sg-assistant-mark"
    />
  );
}

function monthlyValue(subscription) {
  if (subscription.billingCycle === "annual") {
    return subscription.cost / 12;
  }

  if (subscription.billingCycle === "quarterly") {
    return subscription.cost / 3;
  }

  return subscription.cost;
}

export default function SpendGuardApp() {
  const auth = useSpendGuardAuth();
  const workspaceState = useSpendGuardWorkspace(auth.mode, auth.session);
  const workspace = workspaceState.workspace;
  const [activeView, setActiveView] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [drawerSubscription, setDrawerSubscription] = useState(null);
  const [isSubscriptionFormOpen, setIsSubscriptionFormOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [subscriptionForm, setSubscriptionForm] = useState(emptySubscriptionForm);
  const [subscriptionFormError, setSubscriptionFormError] = useState("");
  const [authTab, setAuthTab] = useState("login");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    fullName: "",
    businessName: ""
  });
  const [departmentName, setDepartmentName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "I can review vendor spend, renewals, duplicates, and cost trends from this workspace."
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatThreadEndRef = useRef(null);

  useEffect(() => {
    if (workspace?.business?.name) {
      setWorkspaceName(workspace.business.name);
    }
  }, [workspace?.business?.name]);

  useEffect(() => {
    chatThreadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, isChatLoading]);

  const departmentById = useMemo(
    () => new Map((workspace?.departments || []).map((department) => [department.id, department])),
    [workspace?.departments]
  );
  const vendorById = useMemo(
    () => new Map((workspace?.vendors || []).map((vendor) => [vendor.id, vendor])),
    [workspace?.vendors]
  );
  const categoryById = useMemo(
    () => new Map((workspace?.categories || []).map((category) => [category.id, category])),
    [workspace?.categories]
  );

  const filteredSubscriptions = useMemo(() => {
    if (!workspace) {
      return [];
    }

    return workspace.subscriptions.filter((subscription) => {
      const name = getSubscriptionName(subscription, workspace);
      const matchesSearch = [name, subscription.planName]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "all" || subscription.status === selectedStatus;
      const matchesCategory = selectedCategory === "all" || subscription.categoryId === selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchTerm, selectedCategory, selectedStatus, workspace]);

  const selectedSubscription = drawerSubscription
    ? workspace?.subscriptions.find((subscription) => subscription.id === drawerSubscription)
    : null;

  function openCreateSubscription() {
    setEditingSubscription(null);
    setSubscriptionFormError("");
    setIsSubscriptionFormOpen(true);
    setSubscriptionForm({
      ...emptySubscriptionForm,
      vendorId: workspace?.vendors[0]?.id || "",
      departmentId: workspace?.departments[0]?.id || "",
      categoryId: workspace?.categories[0]?.id || ""
    });
  }

  function openEditSubscription(subscription) {
    setEditingSubscription(subscription.id);
    setSubscriptionFormError("");
    setIsSubscriptionFormOpen(true);
    setSubscriptionForm({
      ...emptySubscriptionForm,
      ...subscription,
      customVendorName: ""
    });
  }

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
    setSubscriptionFormError("");

    if (!subscriptionForm.vendorId) {
      setSubscriptionFormError("Select a vendor before saving this subscription.");
      return;
    }

    if (subscriptionForm.vendorId === CUSTOM_VENDOR_ID && !subscriptionForm.customVendorName.trim()) {
      setSubscriptionFormError("Enter a custom vendor name before saving this subscription.");
      return;
    }

    if (!subscriptionForm.departmentId) {
      setSubscriptionFormError("Select a department before saving this subscription.");
      return;
    }

    if (!subscriptionForm.categoryId) {
      setSubscriptionFormError("Select a category before saving this subscription.");
      return;
    }

    if (!subscriptionForm.planName.trim()) {
      setSubscriptionFormError("Enter a plan name before saving this subscription.");
      return;
    }

    if (!Number.isFinite(Number(subscriptionForm.cost)) || Number(subscriptionForm.cost) < 0) {
      setSubscriptionFormError("Enter a valid subscription cost before saving.");
      return;
    }

    if (!subscriptionForm.renewalDate) {
      setSubscriptionFormError("Choose the next renewal date before saving this subscription.");
      return;
    }

    const saved = await workspaceState.upsertSubscription({
      ...subscriptionForm,
      vendorId: subscriptionForm.vendorId === CUSTOM_VENDOR_ID ? "" : subscriptionForm.vendorId,
      customVendorName:
        subscriptionForm.vendorId === CUSTOM_VENDOR_ID ? subscriptionForm.customVendorName.trim() : "",
      planName: subscriptionForm.planName.trim(),
      nextBillingDate: subscriptionForm.renewalDate,
      id: editingSubscription || undefined,
      cost: Number(subscriptionForm.cost)
    });

    if (!saved) {
      return;
    }

    setEditingSubscription(null);
    setIsSubscriptionFormOpen(false);
    setSubscriptionForm(emptySubscriptionForm);
  }

  async function handleSaveWorkspace(event) {
    event.preventDefault();
    const nextName = workspaceName.trim();

    if (!nextName) {
      return;
    }

    await workspaceState.updateBusiness({ name: nextName });
    setWorkspaceName(nextName);
  }

  async function handleSendChat(event) {
    event.preventDefault();

    if (!chatInput.trim() || isChatLoading || !workspace) {
      return;
    }

    const userMessage = { role: "user", content: chatInput.trim() };
    setChatMessages((current) => [...current, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
          workspace
        })
      });
      const data = await response.json();
      
      setChatMessages((current) => [
        ...current,
        response.ok
          ? data
          : { role: "assistant", content: data.message || "I could not process that request." }
      ]);
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        { role: "assistant", content: "Connection error. Please try again." }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }

  function exportSubscriptionsCsv() {
    if (!workspace) {
      return;
    }

    const rows = [
      ["Vendor", "Department", "Category", "Plan", "Cost", "Billing cycle", "Renewal date", "Status"],
      ...workspace.subscriptions.map((subscription) => [
        getSubscriptionName(subscription, workspace),
        departmentById.get(subscription.departmentId)?.name || "",
        categoryById.get(subscription.categoryId)?.name || "",
        subscription.planName,
        subscription.cost,
        subscription.billingCycle,
        subscription.renewalDate,
        subscription.status
      ])
    ];

    downloadCsv("spendguard-subscriptions.csv", rows);
  }

  if (auth.loading || workspaceState.loading) {
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
                        onChange={(event) =>
                          setAuthForm((current) => ({ ...current, fullName: event.target.value }))
                        }
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
                      onChange={(event) =>
                        setAuthForm((current) => ({ ...current, password: event.target.value }))
                      }
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

  const topCostly = [...workspace.subscriptions]
    .sort((left, right) => right.cost - left.cost)
    .slice(0, 5)
    .map((subscription) => ({
      name: getSubscriptionName(subscription, workspace),
      total: subscription.cost
    }));
  const selectedVendor = selectedSubscription ? vendorById.get(selectedSubscription.vendorId) : null;

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
            <button className="sg-button-ghost" type="button" onClick={exportSubscriptionsCsv}>
              <FileDown size={18} /> Export subscriptions
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
                    {isActive ? (
                      <motion.div
                        layoutId="nav-glow"
                        className="sg-nav-indicator"
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    ) : null}
                    <span style={{ position: "relative", zIndex: 1 }}>
                      {item.id === "ai" ? <AssistantMark size={20} /> : <Icon size={18} />}
                    </span>
                    <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="sg-sidebar-metrics">
              <div className="sg-sidebar-metric">
                <span>Vendors</span>
                <strong>{workspace.vendors.length}</strong>
              </div>
              <div className="sg-sidebar-metric">
                <span>Duplicates</span>
                <strong>{workspace.metrics.duplicateTools}</strong>
              </div>
              <div className="sg-sidebar-metric">
                <span>Active</span>
                <strong>{workspace.metrics.activeCount}</strong>
              </div>
            </div>
          </aside>

          <section className="sg-main">
            {activeView === "dashboard" ? (
              <>
                <section className="sg-panel">
                  <div className="sg-panel-header">
                    <div>
                      <h2 className="sg-panel-title">Overview</h2>
                      <p className="sg-panel-copy">Spend, renewals, and vendor overlap.</p>
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
                      <span>Active subscriptions</span>
                      <strong>{workspace.metrics.activeCount}</strong>
                    </div>
                    <div className="sg-overview-pill">
                      <span>Renewal watch</span>
                      <strong>
                        {workspace.metrics.nextRenewalDate ? formatDate(workspace.metrics.nextRenewalDate) : "Clear"}
                      </strong>
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
                        label: "Tracked vendors",
                        value: workspace.vendors.length,
                        footnote: `${workspace.subscriptions.length} subscription records`,
                        icon: Building2
                      },
                      {
                        label: "Duplicate vendors",
                        value: workspace.metrics.duplicateTools,
                        footnote: "Same vendor across multiple records",
                        icon: Users
                      },
                      {
                        label: "Next renewal",
                        value: workspace.metrics.nextRenewalDate
                          ? formatDate(workspace.metrics.nextRenewalDate)
                          : "No upcoming renewals",
                        footnote: "Review plan and owner before renewal",
                        icon: CalendarClock
                      }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div className="sg-kpi-card" key={item.label}>
                          <div className="sg-kpi-top">
                            <span className="sg-kpi-label">{item.label}</span>
                            <Icon size={18} />
                          </div>
                          <div className="sg-kpi-value">{item.value}</div>
                          <div className="sg-kpi-footnote">{item.footnote}</div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <div className="sg-content-grid">
                  <section className="sg-visual-cost">
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
                                style={{ width, background: chartColors[index % chartColors.length] }}
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
                  </section>

                  <section className="sg-panel">
                    <div className="sg-panel-header">
                      <div>
                        <h2 className="sg-panel-title">Upcoming renewals</h2>
                        <p className="sg-panel-copy">Active subscriptions sorted by next date.</p>
                      </div>
                    </div>
                    <div className="sg-list">
                      {workspace.reports.renewals.slice(0, 5).map((renewal) => (
                        <div className="sg-list-item" key={renewal.id}>
                          <div className="sg-list-copy">
                            <strong>{renewal.name}</strong>
                            <span>{renewal.department}</span>
                          </div>
                          <span className="sg-status tone-blue">{formatDate(renewal.renewalDate)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </>
            ) : null}

            {activeView === "subscriptions" ? (
              <section className="sg-panel">
                <div className="sg-panel-header">
                  <div>
                    <h2 className="sg-panel-title">Subscriptions</h2>
                    <p className="sg-panel-copy">Search, filter, and edit vendor subscriptions.</p>
                  </div>
                  <button className="sg-button" type="button" onClick={openCreateSubscription}>
                    <Plus size={18} /> New subscription
                  </button>
                </div>

                <div className="sg-toolbar">
                  <div className="sg-search">
                    <Search size={18} />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search vendors or plans"
                    />
                  </div>
                  <div className="sg-chip-row">
                    {["all", "active", "inactive", "canceled", "paused"].map((status) => (
                      <button
                        key={status}
                        className={`sg-chip ${selectedStatus === status ? "is-active" : ""}`}
                        type="button"
                        onClick={() => setSelectedStatus(status)}
                      >
                        {status === "all" ? "All statuses" : status}
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
                      <th>Vendor</th>
                      <th>Department</th>
                      <th>Renewal</th>
                      <th>Status</th>
                      <th>Monthly view</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map((subscription) => {
                      const vendor = vendorById.get(subscription.vendorId);
                      const name = getSubscriptionName(subscription, workspace);
                      return (
                        <tr key={subscription.id} className="sg-interactive-row">
                          <td data-label="Vendor">
                            <div className="sg-subscription-main">
                              <div className="sg-vendor-mark-container">
                                <VendorMark
                                  logoKey={vendor?.logoKey}
                                  category={categoryById.get(subscription.categoryId)?.name.toLowerCase()}
                                  domain={vendor?.website}
                                />
                              </div>
                              <div className="sg-subscription-info">
                                <div className="sg-subscription-name">{name}</div>
                                <div className="sg-subscription-meta">
                                  {subscription.planName} • {categoryById.get(subscription.categoryId)?.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td data-label="Department">
                            {departmentById.get(subscription.departmentId)?.name || "Unassigned"}
                          </td>
                          <td data-label="Renewal">{formatDate(subscription.renewalDate)}</td>
                          <td data-label="Status">
                            <span className={`sg-status ${statusToneMap[subscription.status]}`}>
                              {subscription.status}
                            </span>
                          </td>
                          <td data-label="Monthly view">
                            {formatCurrency(monthlyValue(subscription), subscription.currency)}
                          </td>
                          <td data-label="Actions">
                            <div className="sg-inline-actions">
                              <button
                                className="sg-icon-button"
                                type="button"
                                onClick={() => setDrawerSubscription(subscription.id)}
                                aria-label={`Open ${name}`}
                              >
                                <ArrowRight size={18} />
                              </button>
                              <button
                                className="sg-icon-button"
                                type="button"
                                onClick={() => openEditSubscription(subscription)}
                                aria-label={`Edit ${name}`}
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                className="sg-icon-button"
                                type="button"
                                onClick={() => workspaceState.deleteSubscription(subscription.id)}
                                aria-label={`Delete ${name}`}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
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
                    <h2 className="sg-panel-title">Reports & Analytics</h2>
                    <p className="sg-panel-copy">Detailed breakdown of organizational spend.</p>
                  </div>
                  <button className="sg-button" type="button" onClick={exportSubscriptionsCsv}>
                    <FileDown size={18} /> Export Data
                  </button>
                </div>

                <div className="sg-report-grid">
                  <div className="sg-surface sg-panel" style={{ gridColumn: "1 / -1" }}>
                    <h4 className="sg-panel-title" style={{ fontSize: 16, marginBottom: 24 }}>
                      Renewal projection (Next 12 Months)
                    </h4>
                    <div className="sg-chart-shell" style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={workspace.reports.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#2563eb"
                            fill="url(#spendGradient)"
                            strokeWidth={3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="sg-surface sg-panel">
                    <h4 className="sg-panel-title" style={{ fontSize: 16, marginBottom: 24 }}>
                      Department consumption
                    </h4>
                    <div className="sg-chart-shell">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={workspace.reports.departmentSpend}
                          layout="vertical"
                          margin={{ top: 0, right: 0, left: 30, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(16, 21, 18, 0.08)" />
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            width={80}
                            style={{ fontSize: 11 }}
                          />
                          <Tooltip
                            cursor={{ fill: "transparent" }}
                            formatter={(value) => formatCurrency(Number(value), workspace.business.currency)}
                          />
                          <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                            {workspace.reports.departmentSpend.map((entry, index) => (
                              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="sg-surface sg-panel">
                    <h4 className="sg-panel-title" style={{ fontSize: 16, marginBottom: 24 }}>
                      Top expensive vendors
                    </h4>
                    <div className="sg-chart-shell">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topCostly}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(16, 21, 18, 0.08)" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            width={30}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => `${value / 1000}k`}
                          />
                          <Tooltip
                            cursor={{ fill: "transparent" }}
                            formatter={(value) => formatCurrency(Number(value), workspace.business.currency)}
                          />
                          <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#f59e0b" barSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="sg-surface sg-panel">
                    <h4 className="sg-panel-title" style={{ fontSize: 16, marginBottom: 24 }}>
                      Category distribution
                    </h4>
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
                              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="sg-surface sg-panel">
                    <h4 className="sg-panel-title" style={{ fontSize: 16, marginBottom: 24 }}>
                      Renewal status mix
                    </h4>
                    <div className="sg-chart-shell">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip formatter={(value) => `${value} subscription${Number(value) === 1 ? "" : "s"}`} />
                          <Pie
                            data={["active", "inactive", "paused", "canceled"]
                              .map((status) => ({
                                name: status,
                                value: workspace.subscriptions.filter((entry) => entry.status === status).length
                              }))
                              .filter((entry) => entry.value > 0)}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={0}
                            outerRadius={95}
                            paddingAngle={1}
                          >
                            {["#16a34a", "#f59e0b", "#2563eb", "#ef4444"].map((color) => (
                              <Cell key={color} fill={color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.section>
            ) : null}

            {activeView === "ai" ? (
              <section className="sg-panel sg-ai-panel">
                <div className="sg-panel-header">
                  <div>
                    <h2 className="sg-panel-title">AI Center</h2>
                    <p className="sg-panel-copy">Ask questions about vendor spend and upcoming renewals.</p>
                  </div>
                  <AssistantMark size={36} />
                </div>
                <div className="sg-chat-thread">
                  {chatMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`sg-chat-message ${message.role === "assistant" ? "is-assistant" : "is-user"}`}
                    >
                      {message.role === "assistant" ? (
                        <FormattedChatMessage 
                          content={message.content} 
                          workspaceState={workspaceState}
                          workspace={workspace}
                        />
                      ) : (
                        <span>{message.content}</span>
                      )}
                    </div>
                  ))}
                  {isChatLoading ? (
                    <ChatLoadingState workspace={workspace} />
                  ) : null}
                  <div ref={chatThreadEndRef} />
                </div>
                <form className="sg-chat-form" onSubmit={handleSendChat}>
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Ask about renewals, duplicate vendors, or monthly spend"
                  />
                  <button className="sg-button" type="submit" disabled={isChatLoading}>
                    <Send size={18} /> Send
                  </button>
                </form>
              </section>
            ) : null}

            {activeView === "settings" ? (
              <section className="sg-panel">
                <div className="sg-panel-header">
                  <div>
                    <h2 className="sg-panel-title">Settings</h2>
                    <p className="sg-panel-copy">Workspace name and team structure.</p>
                  </div>
                </div>

                <div className="sg-settings-grid">
                  <form className="sg-settings-card" onSubmit={handleSaveWorkspace}>
                    <h3>Workspace</h3>
                    <label className="sg-field">
                      <span>Business name</span>
                      <input
                        value={workspaceName}
                        onChange={(event) => setWorkspaceName(event.target.value)}
                        required
                      />
                    </label>
                    <button className="sg-button" type="submit" disabled={workspaceState.busy}>
                      Save workspace
                    </button>
                  </form>

                  <form
                    className="sg-settings-card"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      await workspaceState.addDepartment(departmentName);
                      setDepartmentName("");
                    }}
                  >
                    <h3>Departments</h3>
                    <label className="sg-field">
                      <span>New department</span>
                      <input
                        value={departmentName}
                        onChange={(event) => setDepartmentName(event.target.value)}
                        placeholder="Legal"
                      />
                    </label>
                    <button className="sg-button-secondary" type="submit" disabled={workspaceState.busy}>
                      <Plus size={18} /> Add department
                    </button>
                    <div className="sg-chip-row" style={{ marginTop: 16 }}>
                      {workspace.departments.map((department) => (
                        <span className="sg-chip is-static" key={department.id}>
                          {department.name}
                        </span>
                      ))}
                    </div>
                  </form>
                </div>
              </section>
            ) : null}
          </section>
        </div>
      </div>

      <AnimatePresence>
        {isSubscriptionFormOpen ? (
          <motion.div
            className="sg-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSubscriptionFormOpen(false)}
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
                  <h3>{editingSubscription ? "Update vendor subscription" : "Create vendor subscription"}</h3>
                </div>
                <button className="sg-icon-button" type="button" onClick={() => setIsSubscriptionFormOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              {subscriptionFormError || workspaceState.error ? (
                <div className="sg-alert tone-red" style={{ marginBottom: 20 }}>
                  <strong>{subscriptionFormError || workspaceState.error}</strong>
                </div>
              ) : null}

              <form className="sg-stack" onSubmit={handleSaveSubscription}>
                <VisualPicker
                  label="Vendor"
                  value={subscriptionForm.vendorId}
                  options={[
                    ...workspace.vendors,
                    { id: CUSTOM_VENDOR_ID, name: "Custom Vendor", logoKey: "default", website: "" }
                  ]}
                  onChange={(id) =>
                    setSubscriptionForm((current) => ({
                      ...current,
                      vendorId: id,
                      customVendorName: id === CUSTOM_VENDOR_ID ? current.customVendorName : ""
                    }))
                  }
                  renderIcon={(vendor) => (
                    <VendorMark
                      logoKey={vendor.logoKey}
                      domain={vendor.website}
                    />
                  )}
                  placeholder="Select vendor"
                  searchPlaceholder="Search vendors..."
                  allowCustom
                  onCustomClick={(name) => {
                    setSubscriptionForm((current) => ({
                      ...current,
                      vendorId: CUSTOM_VENDOR_ID,
                      customVendorName: name
                    }));
                  }}
                />

                {subscriptionForm.vendorId === CUSTOM_VENDOR_ID ? (
                  <label className="sg-field">
                    <span>Custom vendor name</span>
                    <input
                      value={subscriptionForm.customVendorName}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, customVendorName: event.target.value }))
                      }
                      placeholder="Netflix"
                      required
                      style={{ textAlign: "left" }}
                    />
                  </label>
                ) : null}

                <div className="sg-form-grid">
                  <VisualPicker
                    label="Department"
                    value={subscriptionForm.departmentId}
                    options={workspace.departments}
                    onChange={(id) =>
                      setSubscriptionForm((current) => ({ ...current, departmentId: id }))
                    }
                    renderIcon={(dept) => {
                      const Icon = DEPARTMENT_ICONS[dept.name] || Building2;
                      return <Icon size={18} />;
                    }}
                    placeholder="Select department"
                    searchPlaceholder="Search departments..."
                  />
                  <VisualPicker
                    label="Category"
                    value={subscriptionForm.categoryId}
                    options={workspace.categories}
                    onChange={(id) =>
                      setSubscriptionForm((current) => ({ ...current, categoryId: id }))
                    }
                    renderIcon={(cat) => {
                      const Icon = CATEGORY_ICONS[cat.name] || Sparkles;
                      return <Icon size={18} />;
                    }}
                    placeholder="Select category"
                    searchPlaceholder="Search categories..."
                  />
                </div>

                <div className="sg-form-grid">
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
                </div>

                <div className="sg-form-grid">
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
                  <label className="sg-field">
                    <span>Next renewal date</span>
                    <input
                      type="date"
                      value={subscriptionForm.renewalDate}
                      onChange={(event) =>
                        setSubscriptionForm((current) => ({ ...current, renewalDate: event.target.value }))
                      }
                      required
                    />
                  </label>
                </div>

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
                    <option value="paused">Paused</option>
                  </select>
                </label>

                <label className="sg-field">
                  <span>Internal notes</span>
                  <textarea
                    value={subscriptionForm.notes}
                    onChange={(event) =>
                      setSubscriptionForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    placeholder="Purpose of vendor, owner contact, and contract links..."
                    style={{ textAlign: "left", minHeight: 120 }}
                  />
                </label>

                <button className="sg-button" type="submit" disabled={workspaceState.busy}>
                  {workspaceState.busy ? "Saving..." : editingSubscription ? "Save changes" : "Create subscription"}
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
                    logoKey={selectedVendor?.logoKey}
                    category={categoryById.get(selectedSubscription.categoryId)?.name.toLowerCase()}
                    domain={selectedVendor?.website}
                  />
                  <div>
                    <h3 style={{ margin: 0 }}>{getSubscriptionName(selectedSubscription, workspace)}</h3>
                    <p className="sg-panel-copy" style={{ margin: "4px 0 0" }}>
                      {selectedSubscription.planName}
                    </p>
                  </div>
                </div>
                <button className="sg-icon-button" type="button" onClick={() => setDrawerSubscription(null)}>
                  <X size={18} />
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
                      {billingCycleLabels[selectedSubscription.billingCycle]} - next bill{" "}
                      {formatDate(selectedSubscription.nextBillingDate)}
                    </span>
                  </div>
                  <CalendarClock size={18} />
                </div>
                <div className="sg-list-item">
                  <div className="sg-list-copy">
                    <strong>Status</strong>
                    <span>{selectedSubscription.status}</span>
                  </div>
                  <span className={`sg-status ${statusToneMap[selectedSubscription.status]}`}>
                    {selectedSubscription.status}
                  </span>
                </div>
                <div className="sg-list-item">
                  <div className="sg-list-copy">
                    <strong>Notes</strong>
                    <span>{selectedSubscription.notes || "No notes yet."}</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
