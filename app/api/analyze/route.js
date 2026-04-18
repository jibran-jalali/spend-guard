import { NextResponse } from "next/server";

import { analyzeWorkspaceLocally, normalizeAnalysisPayload } from "@/lib/workspace";

function safeParseJSON(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

export async function POST(request) {
  const payload = await request.json();
  const snapshot = payload?.snapshot || payload;

  if (!snapshot || !Array.isArray(snapshot.subscriptions)) {
    return NextResponse.json({ error: "A workspace snapshot is required." }, { status: 400 });
  }

  const heuristic = analyzeWorkspaceLocally(snapshot);

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ analysis: heuristic, source: "heuristic" });
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const prompt = `
You are a spend optimization analyst for a subscription management app.
Return valid JSON with the exact shape:
{
  "headline": "short string",
  "summary": "short paragraph",
  "savingsOpportunities": [{"title":"", "detail":"", "impact":"low|medium|high", "estimatedSavings":"$0"}],
  "renewalRisks": [{"title":"", "detail":"", "dueDate":"YYYY-MM-DD"}],
  "recommendedActions": ["", "", ""]
}

Analyze this business snapshot:
${JSON.stringify(normalizeAnalysisPayload(snapshot), null, 2)}
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You produce structured subscription-spend recommendations in strict JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Groq analysis failed.");
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;
    const parsed = safeParseJSON(content);

    if (!parsed) {
      throw new Error("Groq did not return valid JSON.");
    }

    return NextResponse.json({
      analysis: {
        ...heuristic,
        ...parsed,
        generatedAt: new Date().toISOString(),
        source: "groq",
        model
      },
      source: "groq"
    });
  } catch (error) {
    return NextResponse.json({
      analysis: {
        ...heuristic,
        warning: "Groq analysis failed, so SpendGuard returned a local heuristic readout instead."
      },
      source: "heuristic",
      error: error.message
    });
  }
}
