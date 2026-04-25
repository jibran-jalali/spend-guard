import { addDays, format } from "date-fns";

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
        notes: "Core internal communication stack."
      },
      {
        id: "sub-zoom-marketing",
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
        notes: "Campaign standups, webinars, and ad-hoc client calls."
      },
      {
        id: "sub-zoom-cx",
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
        notes: "Customer onboarding and live training sessions."
      },
      {
        id: "sub-quickbooks",
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
        notes: "Accounting, invoicing, and finance reconciliation."
      },
      {
        id: "sub-figma",
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
        notes: "Design reviews and asset production."
      },
      {
        id: "sub-vercel",
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
        notes: "Customer portal and internal tooling hosting."
      },
      {
        id: "sub-hubspot",
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
        notes: "Paid because of legacy workflows that only a few teammates still touch."
      },
      {
        id: "sub-google",
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
        notes: "Email, docs, drive, and admin controls."
      },
      {
        id: "sub-notion",
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
        notes: "Legacy docs workspace from the onboarding team."
      }
    ]
  };
}
