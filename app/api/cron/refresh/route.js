import { NextResponse } from "next/server";

import { createAlertRecords, createProjectedPayments, normalizeWorkspace } from "@/lib/workspace";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({
      refreshed: false,
      reason: "Supabase admin credentials are not configured."
    });
  }

  const admin = createAdminClient();
  const { data: businesses, error: businessesError } = await admin
    .from("businesses")
    .select("id, name, currency, renewal_window_days");

  if (businessesError) {
    return NextResponse.json({ error: businessesError.message }, { status: 500 });
  }

  const results = [];

  for (const business of businesses || []) {
    const [departmentsResult, categoriesResult, vendorsResult, subscriptionsResult, paymentsResult] =
      await Promise.all([
        admin.from("departments").select("*").eq("business_id", business.id),
        admin.from("subscription_categories").select("*").eq("business_id", business.id),
        admin.from("vendors").select("*").eq("business_id", business.id),
        admin.from("subscriptions").select("*").eq("business_id", business.id),
        admin.from("payments").select("*").eq("business_id", business.id)
      ]);

    const workspace = normalizeWorkspace({
      business,
      departments: departmentsResult.data || [],
      categories: categoriesResult.data || [],
      vendors: vendorsResult.data || [],
      subscriptions: subscriptionsResult.data || [],
      payments: paymentsResult.data || [],
      alerts: [],
      aiAnalyses: []
    });

    const projectedPayments = createProjectedPayments(workspace.subscriptions, workspace.payments, 6).map(
      (payment) => ({
        business_id: business.id,
        subscription_id: payment.subscriptionId,
        amount: payment.amount,
        currency: payment.currency,
        due_date: payment.dueDate,
        paid_at: null,
        status: payment.status,
        source: payment.source,
        reference: payment.reference,
        notes: payment.notes
      })
    );

    const alerts = createAlertRecords(workspace).map((alert) => ({
      business_id: business.id,
      subscription_id: alert.subscriptionId || null,
      title: alert.title,
      body: alert.body,
      type: alert.type,
      severity: alert.severity,
      due_at: alert.dueAt || null,
      status: alert.status,
      is_read: alert.isRead,
      metadata: alert.metadata
    }));

    await admin
      .from("payments")
      .delete()
      .eq("business_id", business.id)
      .eq("source", "system")
      .gte("due_date", new Date().toISOString().slice(0, 10));

    if (projectedPayments.length) {
      await admin.from("payments").insert(projectedPayments);
    }

    await admin
      .from("alerts")
      .delete()
      .eq("business_id", business.id)
      .eq("status", "system");

    if (alerts.length) {
      await admin.from("alerts").insert(
        alerts.map((alert) => ({
          ...alert,
          status: "system"
        }))
      );
    }

    results.push({
      businessId: business.id,
      businessName: business.name,
      alertsCreated: alerts.length,
      projectedPaymentsCreated: projectedPayments.length
    });
  }

  return NextResponse.json({
    refreshed: true,
    processedBusinesses: results.length,
    results
  });
}
