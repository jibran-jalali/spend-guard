import { NextResponse } from "next/server";

export const runtime = "edge";

function buildSystemContext(workspace) {
  if (!workspace) return "No workspace data.";
  const vendors = (workspace.vendors || []).slice(0, 20).map(v => v.name).join(", ");
  return `You are SpendGuard AI. Business: ${workspace.business?.name}. Subscriptions: ${workspace.subscriptions.length}. Vendors: ${vendors}. Handle analysis.`;
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
