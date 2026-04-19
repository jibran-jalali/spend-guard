import { NextResponse } from "next/server";

export const runtime = "edge";

function buildSystemContext(workspace) {
  return `
You are SpendGuard AI, a financial operations assistant for a SaaS management platform.

Workspace Context:
- Business: ${workspace.business.name}
- Total Subscriptions: ${workspace.subscriptions.length}
- Total Departments: ${workspace.departments.length}
- Total Categories: ${workspace.categories.length}

Subscription Data:
${JSON.stringify(
  workspace.subscriptions.map((subscription) => ({
    tool: subscription.toolName,
    plan: subscription.planName,
    cost: subscription.cost,
    billing: subscription.billingCycle,
    renew: subscription.renewalDate,
    status: subscription.status,
    usage: subscription.usageStatus
  }))
)}

Guidelines:
- Be professional, concise, and insightful.
- Help the user find savings, identify waste, and manage renewals.
- If asked about specific tools, refer to the data provided.
- Mention currency as ${workspace.business.currency}.
- Prefer concrete next steps over generic finance advice.
- Do not invent tools, costs, dates, vendors, departments, or payment records that are not in the workspace snapshot.
`.trim();
}

function buildFallbackReply(workspace) {
  const totalSubscriptions = workspace?.subscriptions?.length || 0;
  const underusedCount = (workspace?.subscriptions || []).filter((subscription) =>
    ["underused", "unused"].includes(subscription.usageStatus)
  ).length;
  const upcomingRenewals = (workspace?.subscriptions || [])
    .filter((subscription) => subscription.status === "active" && subscription.renewalDate)
    .sort((left, right) => new Date(left.renewalDate).getTime() - new Date(right.renewalDate).getTime())
    .slice(0, 3)
    .map((subscription) => subscription.toolName);

  const renewalText = upcomingRenewals.length
    ? `Closest renewals: ${upcomingRenewals.join(", ")}.`
    : "No immediate renewals are flagged in the current snapshot.";

  return `AI chat is not configured right now, but I can still give you a quick workspace read: ${totalSubscriptions} subscriptions are tracked, ${underusedCount} are marked underused or unused, and ${renewalText}`;
}

export async function POST(req) {
  try {
    const { messages, workspace } = await req.json();

    if (!workspace?.business || !Array.isArray(workspace?.subscriptions)) {
      return NextResponse.json(
        { message: "A valid workspace snapshot is required for chat." },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          role: "assistant",
          content: buildFallbackReply(workspace)
        },
        { status: 200 }
      );
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_CHAT_MODEL || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        max_tokens: 700,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: buildSystemContext(workspace)
          },
          ...(messages || []).map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: String(message.content || "")
          }))
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Groq chat request failed.");
    }

    const data = await response.json();
    const content = String(data?.choices?.[0]?.message?.content || "").trim();

    return NextResponse.json({
      role: "assistant",
      content: content || "I couldn't generate a response just now. Please try again."
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        role: "assistant",
        content: "I hit an issue processing that request. Please try again in a moment."
      },
      { status: 200 }
    );
  }
}
