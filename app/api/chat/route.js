import { NextResponse } from "next/server";

export const runtime = "edge";

function getSubscriptionName(subscription, workspace) {
  const vendor = (workspace?.vendors || []).find((entry) => entry.id === subscription?.vendorId);
  return vendor?.name || subscription?.vendorName || "Unknown vendor";
}

function getMonthlyValue(subscription) {
  const cost = Number(subscription?.cost || 0);

  if (subscription?.billingCycle === "annual") {
    return cost / 12;
  }

  if (subscription?.billingCycle === "quarterly") {
    return cost / 3;
  }

  return cost;
}

function sumBy(items, getKey, getValue) {
  const totals = new Map();

  for (const item of items) {
    const key = getKey(item);
    totals.set(key, (totals.get(key) || 0) + getValue(item));
  }

  return [...totals.entries()]
    .map(([name, total]) => ({ name, monthlySpend: Math.round(total * 100) / 100 }))
    .sort((left, right) => right.monthlySpend - left.monthlySpend);
}

function findDuplicateSubscriptions(activeSubscriptions, workspace) {
  const usage = new Map();
  const departmentById = new Map((workspace.departments || []).map((department) => [department.id, department.name]));

  for (const subscription of activeSubscriptions) {
    const name = getSubscriptionName(subscription, workspace);
    const key = name.trim().toLowerCase();
    const entries = usage.get(key) || [];
    entries.push({
      vendor: name,
      department: departmentById.get(subscription.departmentId) || "Unassigned",
      cost: Number(subscription.cost || 0),
      billingCycle: subscription.billingCycle || "monthly"
    });
    usage.set(key, entries);
  }

  return [...usage.values()].filter((entries) => entries.length > 1);
}

function buildSystemContext(workspace) {
  if (!workspace) {
    return "You are SpendGuard AI. No workspace data was provided, so ask the user to load or create a workspace before giving specific spend analysis.";
  }

  const departments = workspace.departments || [];
  const categories = workspace.categories || [];
  const subscriptions = workspace.subscriptions || [];
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "active");
  const departmentById = new Map(departments.map((department) => [department.id, department.name]));
  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const monthlySpend = activeSubscriptions.reduce((total, subscription) => total + getMonthlyValue(subscription), 0);
  const currency = workspace.business?.currency || "USD";

  const subscriptionRows = subscriptions
    .map((subscription) => ({
      vendor: getSubscriptionName(subscription, workspace),
      plan: subscription.planName || "No plan",
      department: departmentById.get(subscription.departmentId) || "Unassigned",
      category: categoryById.get(subscription.categoryId) || "Other",
      cost: Number(subscription.cost || 0),
      billingCycle: subscription.billingCycle || "monthly",
      monthlyEquivalent: Math.round(getMonthlyValue(subscription) * 100) / 100,
      status: subscription.status || "active",
      renewalDate: subscription.renewalDate || "No renewal date",
      nextBillingDate: subscription.nextBillingDate || "No next billing date",
      notes: subscription.notes || ""
    }))
    .sort((left, right) => right.monthlyEquivalent - left.monthlyEquivalent);

  const context = {
    role: "SpendGuard AI",
    instruction:
      "Answer only from this workspace data. If the data is missing or uncertain, say so clearly. Focus on subscription spend, renewals, duplicates, department/category costs, and practical savings recommendations.",
    business: {
      name: workspace.business?.name || "SpendGuard Business",
      currency,
      renewalWindowDays: workspace.business?.renewalWindowDays || 30
    },
    summary: {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      monthlySpend: Math.round(monthlySpend * 100) / 100,
      yearlySpend: Math.round(monthlySpend * 12 * 100) / 100,
      vendorCount: (workspace.vendors || []).length
    },
    departmentSpend: sumBy(
      activeSubscriptions,
      (subscription) => departmentById.get(subscription.departmentId) || "Unassigned",
      getMonthlyValue
    ),
    categorySpend: sumBy(
      activeSubscriptions,
      (subscription) => categoryById.get(subscription.categoryId) || "Other",
      getMonthlyValue
    ),
    upcomingRenewals: [...subscriptionRows]
      .filter((subscription) => subscription.status === "active")
      .sort((left, right) => new Date(left.renewalDate).getTime() - new Date(right.renewalDate).getTime())
      .slice(0, 10),
    duplicateSubscriptions: findDuplicateSubscriptions(activeSubscriptions, workspace),
    subscriptions: subscriptionRows.slice(0, 40)
  };

  return `You are SpendGuard AI. Use this current workspace context:\n${JSON.stringify(context, null, 2)}`;
}

export async function POST(req) {
  try {
    const { messages, workspace } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ role: "assistant", content: "API Key missing." });
    }

    // Using a smaller model (8b) to avoid rate limits / quota issues
    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        messages: [
          { role: "system", content: buildSystemContext(workspace) },
          ...(messages || []).slice(-3).map(m => ({ role: m.role, content: String(m.content) }))
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || "connection issues";
      return NextResponse.json({ 
        role: "assistant", 
        content: `I hit an API snag (${response.status}: ${msg}). Please check if your Groq quota is exceeded or the key is valid.` 
      });
    }

    const data = await response.json();
    return NextResponse.json({
      role: "assistant",
      content: data.choices[0].message.content
    });
  } catch (error) {
    return NextResponse.json({ role: "assistant", content: "I'm having a technical problem. Please try again." });
  }
}
