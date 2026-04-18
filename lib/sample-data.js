import { addDays, addMonths, format, subDays, subMonths } from "date-fns";

import { DEFAULT_VENDOR_CATALOG } from "@/lib/default-vendors";

const today = new Date();

export function createSampleWorkspace(options = {}) {
  const businessName = options.businessName?.trim() || "Northstar Creative";

  return {
    business: {
      id: "business-demo",
      name: businessName,
      currency: "USD",
      renewalWindowDays: 30
    },
    departments: [
      { id: "dept-ops", name: "Operations", accentColor: "#16a34a" },
      { id: "dept-marketing", name: "Marketing", accentColor: "#f59e0b" },
      { id: "dept-finance", name: "Finance", accentColor: "#2563eb" },
      { id: "dept-cx", name: "Customer Success", accentColor: "#ef4444" }
    ],
    categories: [
      { id: "cat-communication", name: "Communication", accentColor: "#16a34a" },
      { id: "cat-marketing", name: "Marketing", accentColor: "#f59e0b" },
      { id: "cat-productivity", name: "Productivity", accentColor: "#2563eb" },
      { id: "cat-hosting", name: "Hosting", accentColor: "#ef4444" },
      { id: "cat-finance", name: "Finance", accentColor: "#16a34a" }
    ],
    vendors: DEFAULT_VENDOR_CATALOG,
    subscriptions: [
      {
        id: "sub-slack",
        toolName: "Slack",
        vendorId: "vendor-slack",
        departmentId: "dept-ops",
        categoryId: "cat-communication",
        planName: "Business+",
        cost: 148,
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: format(addDays(today, 12), "yyyy-MM-dd"),
        nextBillingDate: format(addDays(today, 12), "yyyy-MM-dd"),
        status: "active",
        usageStatus: "healthy",
        autoRenew: true,
        seats: 19,
        notes: "Core internal communication stack."
      },
      {
        id: "sub-zoom-marketing",
        toolName: "Zoom",
        vendorId: "vendor-zoom",
        departmentId: "dept-marketing",
        categoryId: "cat-communication",
        planName: "Workplace Pro",
        cost: 189,
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: format(addDays(today, 18), "yyyy-MM-dd"),
        nextBillingDate: format(addDays(today, 18), "yyyy-MM-dd"),
        status: "active",
        usageStatus: "underused",
        autoRenew: true,
        seats: 14,
        notes: "Campaign standups, webinars, and ad-hoc client calls."
      },
      {
        id: "sub-zoom-cx",
        toolName: "Zoom",
        vendorId: "vendor-zoom",
        departmentId: "dept-cx",
        categoryId: "cat-communication",
        planName: "Workplace Pro",
        cost: 189,
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: format(addDays(today, 18), "yyyy-MM-dd"),
        nextBillingDate: format(addDays(today, 18), "yyyy-MM-dd"),
        status: "active",
        usageStatus: "healthy",
        autoRenew: true,
        seats: 10,
        notes: "Customer onboarding and live training sessions."
      },
      {
        id: "sub-quickbooks",
        toolName: "QuickBooks",
        vendorId: "vendor-quickbooks",
        departmentId: "dept-finance",
        categoryId: "cat-finance",
        planName: "Advanced",
        cost: 210,
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: format(addDays(today, 7), "yyyy-MM-dd"),
        nextBillingDate: format(addDays(today, 7), "yyyy-MM-dd"),
        status: "active",
        usageStatus: "healthy",
        autoRenew: true,
        seats: 5,
        notes: "Accounting, invoicing, and finance reconciliation."
      },
      {
        id: "sub-figma",
        toolName: "Figma",
        vendorId: "vendor-figma",
        departmentId: "dept-marketing",
        categoryId: "cat-productivity",
        planName: "Professional",
        cost: 96,
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: format(addDays(today, 24), "yyyy-MM-dd"),
        nextBillingDate: format(addDays(today, 24), "yyyy-MM-dd"),
        status: "active",
        usageStatus: "healthy",
        autoRenew: true,
        seats: 8,
        notes: "Design reviews and asset production."
      },
      {
        id: "sub-vercel",
        toolName: "Vercel",
        vendorId: "vendor-vercel",
        departmentId: "dept-ops",
        categoryId: "cat-hosting",
        planName: "Pro",
        cost: 92,
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: format(addDays(today, 10), "yyyy-MM-dd"),
        nextBillingDate: format(addDays(today, 10), "yyyy-MM-dd"),
        status: "active",
        usageStatus: "healthy",
        autoRenew: true,
        seats: 4,
        notes: "Customer portal and internal tooling hosting."
      },
      {
        id: "sub-hubspot",
        toolName: "HubSpot",
        vendorId: "vendor-hubspot",
        departmentId: "dept-marketing",
        categoryId: "cat-marketing",
        planName: "Marketing Hub Pro",
        cost: 960,
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: format(addDays(today, 31), "yyyy-MM-dd"),
        nextBillingDate: format(addDays(today, 31), "yyyy-MM-dd"),
        status: "active",
        usageStatus: "underused",
        autoRenew: true,
        seats: 12,
        notes: "Paid because of legacy workflows that only a few teammates still touch."
      },
      {
        id: "sub-google",
        toolName: "Google Workspace",
        vendorId: "vendor-google",
        departmentId: "dept-ops",
        categoryId: "cat-productivity",
        planName: "Business Standard",
        cost: 144,
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: format(addDays(today, 14), "yyyy-MM-dd"),
        nextBillingDate: format(addDays(today, 14), "yyyy-MM-dd"),
        status: "active",
        usageStatus: "healthy",
        autoRenew: true,
        seats: 18,
        notes: "Email, docs, drive, and admin controls."
      },
      {
        id: "sub-notion",
        toolName: "Notion",
        vendorId: "vendor-notion",
        departmentId: "dept-cx",
        categoryId: "cat-productivity",
        planName: "Plus",
        cost: 72,
        currency: "USD",
        billingCycle: "monthly",
        renewalDate: format(addDays(today, 20), "yyyy-MM-dd"),
        nextBillingDate: format(addDays(today, 20), "yyyy-MM-dd"),
        status: "inactive",
        usageStatus: "unused",
        autoRenew: false,
        seats: 6,
        notes: "Legacy docs workspace from the onboarding team."
      }
    ],
    payments: [
      {
        id: "pay-1",
        subscriptionId: "sub-slack",
        amount: 148,
        currency: "USD",
        dueDate: format(subDays(today, 18), "yyyy-MM-dd"),
        paidAt: format(subDays(today, 18), "yyyy-MM-dd"),
        status: "paid",
        source: "manual",
        reference: "INV-1101",
        notes: "Auto-card payment confirmed."
      },
      {
        id: "pay-2",
        subscriptionId: "sub-zoom-marketing",
        amount: 189,
        currency: "USD",
        dueDate: format(subDays(today, 5), "yyyy-MM-dd"),
        paidAt: format(subDays(today, 4), "yyyy-MM-dd"),
        status: "paid",
        source: "manual",
        reference: "INV-1120",
        notes: "Paid after QBR review."
      },
      {
        id: "pay-3",
        subscriptionId: "sub-zoom-cx",
        amount: 189,
        currency: "USD",
        dueDate: format(subDays(today, 5), "yyyy-MM-dd"),
        paidAt: format(subDays(today, 5), "yyyy-MM-dd"),
        status: "paid",
        source: "manual",
        reference: "INV-1121",
        notes: "Customer success budget."
      },
      {
        id: "pay-4",
        subscriptionId: "sub-quickbooks",
        amount: 210,
        currency: "USD",
        dueDate: format(subDays(today, 26), "yyyy-MM-dd"),
        paidAt: format(subDays(today, 25), "yyyy-MM-dd"),
        status: "paid",
        source: "manual",
        reference: "QB-990",
        notes: "Quarter close was smooth."
      },
      {
        id: "pay-5",
        subscriptionId: "sub-hubspot",
        amount: 960,
        currency: "USD",
        dueDate: format(subDays(today, 2), "yyyy-MM-dd"),
        paidAt: null,
        status: "pending",
        source: "manual",
        reference: "HS-821",
        notes: "Finance is holding payment until marketing team review."
      },
      {
        id: "pay-6",
        subscriptionId: "sub-figma",
        amount: 96,
        currency: "USD",
        dueDate: format(subDays(today, 16), "yyyy-MM-dd"),
        paidAt: format(subDays(today, 16), "yyyy-MM-dd"),
        status: "paid",
        source: "manual",
        reference: "FG-118",
        notes: "Design team annualized this last cycle."
      },
      {
        id: "pay-7",
        subscriptionId: "sub-vercel",
        amount: 92,
        currency: "USD",
        dueDate: format(subMonths(today, 1), "yyyy-MM-dd"),
        paidAt: format(subMonths(today, 1), "yyyy-MM-dd"),
        status: "paid",
        source: "manual",
        reference: "VE-184",
        notes: "Infrastructure card."
      },
      {
        id: "pay-8",
        subscriptionId: "sub-google",
        amount: 144,
        currency: "USD",
        dueDate: format(subDays(today, 12), "yyyy-MM-dd"),
        paidAt: format(subDays(today, 11), "yyyy-MM-dd"),
        status: "paid",
        source: "manual",
        reference: "GO-444",
        notes: "Workspace renewal."
      }
    ],
    alerts: [],
    aiAnalyses: [
      {
        id: "analysis-demo",
        generatedAt: format(subDays(today, 1), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        source: "seed",
        headline: "Two Zoom licenses and one underused marketing hub are driving avoidable spend.",
        summary:
          "Northstar Creative is carrying duplicate meeting tooling across two departments and a high-cost marketing platform with low engagement.",
        savingsOpportunities: [
          {
            title: "Consolidate Zoom ownership",
            detail: "One shared workspace would remove a duplicated license block across marketing and customer success.",
            impact: "medium",
            estimatedSavings: "$189/mo"
          }
        ],
        renewalRisks: [
          {
            title: "QuickBooks renews in 7 days",
            detail: "Finance should confirm the current plan still matches active seats before renewal.",
            dueDate: format(addDays(today, 7), "yyyy-MM-dd")
          }
        ],
        recommendedActions: [
          "Review HubSpot adoption with marketing leadership.",
          "Assign one Zoom owner and retire the second workspace.",
          "Convert inactive Notion seats into a cancellation or lighter plan."
        ]
      }
    ]
  };
}
