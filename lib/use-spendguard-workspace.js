"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_VENDOR_CATALOG } from "@/lib/default-vendors";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/browser";
import {
  createAlertRecords,
  createDemoWorkspace,
  createProjectedPayments,
  getVendorLogoKey,
  getDemoSession,
  loadDemoWorkspace,
  normalizeWorkspace,
  saveDemoWorkspace,
  slugifyVendorName,
  setDemoSession
} from "@/lib/workspace";

const blankForm = {
  toolName: "",
  vendorId: "",
  departmentId: "",
  categoryId: "",
  planName: "",
  cost: 0,
  currency: "USD",
  billingCycle: "monthly",
  renewalDate: "",
  nextBillingDate: "",
  status: "active",
  usageStatus: "healthy",
  autoRenew: true,
  seats: 1,
  notes: ""
};

export function useSpendGuardWorkspace(mode, session) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const sessionUserId = session?.user?.id || null;
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const persistDemoWorkspace = useCallback((nextWorkspace) => {
    const normalized = normalizeWorkspace(nextWorkspace);
    setWorkspace(normalized);
    saveDemoWorkspace(normalized);
    setLastSync(new Date().toISOString());
  }, []);

  const hydrateDemoWorkspace = useCallback(() => {
    const demoWorkspace = loadDemoWorkspace();
    setWorkspace(demoWorkspace);
    setLastSync(new Date().toISOString());
    setLoading(false);
  }, []);

  const loadLiveWorkspace = useCallback(async () => {
    if (!supabase || !sessionUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let { data: profile } = await supabase
        .from("profiles")
        .select("id, business_id, full_name, role")
        .eq("id", sessionUserId)
        .maybeSingle();

      if (!profile) {
        const {
          data: { session: currentSession }
        } = await supabase.auth.getSession();

        await fetch("/api/bootstrap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentSession?.access_token || ""}`
          }
        });

        const retry = await supabase
          .from("profiles")
          .select("id, business_id, full_name, role")
          .eq("id", sessionUserId)
          .maybeSingle();
        profile = retry.data;
      }

      if (!profile?.business_id) {
        throw new Error("No business profile was found for this account.");
      }

      const [
        businessResult,
        departmentsResult,
        categoriesResult,
        vendorsResult,
        subscriptionsResult,
        paymentsResult,
        alertsResult,
        analysesResult
      ] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, currency, renewal_window_days")
          .eq("id", profile.business_id)
          .single(),
        supabase.from("departments").select("*").eq("business_id", profile.business_id),
        supabase.from("subscription_categories").select("*").eq("business_id", profile.business_id),
        supabase.from("vendors").select("*").eq("business_id", profile.business_id),
        supabase.from("subscriptions").select("*").eq("business_id", profile.business_id),
        supabase.from("payments").select("*").eq("business_id", profile.business_id),
        supabase.from("alerts").select("*").eq("business_id", profile.business_id),
        supabase
          .from("ai_analyses")
          .select("*")
          .eq("business_id", profile.business_id)
          .order("created_at", { ascending: false })
      ]);

      let vendorRows = vendorsResult.data || [];

      if (!vendorRows.length) {
        const seededVendors = await supabase
          .from("vendors")
          .insert(
            DEFAULT_VENDOR_CATALOG.map((vendor) => ({
              business_id: profile.business_id,
              name: vendor.name,
              logo_key: vendor.logoKey,
              website: vendor.website
            }))
          )
          .select("*");

        vendorRows = seededVendors.data || [];
      }

      const liveWorkspace = normalizeWorkspace({
        business: businessResult.data,
        departments: departmentsResult.data || [],
        categories: categoriesResult.data || [],
        vendors: vendorRows,
        subscriptions: subscriptionsResult.data || [],
        payments: paymentsResult.data || [],
        alerts: alertsResult.data || [],
        aiAnalyses: analysesResult.data || []
      });

      setWorkspace(
        liveWorkspace.alerts.length
          ? liveWorkspace
          : normalizeWorkspace({
              ...liveWorkspace,
              alerts: createAlertRecords(liveWorkspace)
            })
      );
      setLastSync(new Date().toISOString());
    } catch (nextError) {
      setError(nextError.message);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [sessionUserId, supabase]);

  useEffect(() => {
    if (mode === "live" && isSupabaseConfigured()) {
      setLoading(true);
      loadLiveWorkspace();
      return;
    }

    setWorkspace(null);
    setLoading(false);
  }, [loadLiveWorkspace, mode]);

  async function resolveVendor(payload) {
    const customVendorName = payload.customVendorName?.trim();

    if (!customVendorName) {
      return {
        vendorId: payload.vendorId,
        nextVendors: workspace?.vendors || []
      };
    }

    const normalizedName = customVendorName.toLowerCase();
    const existingVendor = (workspace?.vendors || []).find(
      (vendor) => vendor.name.trim().toLowerCase() === normalizedName
    );

    if (existingVendor) {
      return {
        vendorId: existingVendor.id,
        nextVendors: workspace.vendors
      };
    }

    if (mode === "demo") {
      const vendorId = `vendor-${slugifyVendorName(customVendorName) || Math.random().toString(36).slice(2, 10)}`;
      const nextVendor = {
        id: vendorId,
        name: customVendorName,
        logoKey: getVendorLogoKey(customVendorName),
        website: ""
      };

      return {
        vendorId,
        nextVendors: [...workspace.vendors, nextVendor]
      };
    }

    const { data: insertedVendor, error: insertError } = await supabase
      .from("vendors")
      .insert({
        business_id: workspace.business.id,
        name: customVendorName,
        logo_key: getVendorLogoKey(customVendorName),
        website: ""
      })
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    return {
      vendorId: insertedVendor.id,
      nextVendors: workspace.vendors
    };
  }

  async function upsertSubscription(payload) {
    if (!workspace) {
      setError("Workspace is still loading. Please try again in a moment.");
      return false;
    }

    setBusy(true);
    setError(null);

    try {
      const { vendorId: resolvedVendorId, nextVendors } = await resolveVendor(payload);

      if (mode === "demo") {
        const nextSubscriptions = payload.id
          ? workspace.subscriptions.map((subscription) =>
              subscription.id === payload.id
                ? { ...subscription, ...payload, vendorId: resolvedVendorId }
                : subscription
            )
          : [
              {
                ...blankForm,
                ...payload,
                vendorId: resolvedVendorId,
                id: `sub-${Math.random().toString(36).slice(2, 10)}`
              },
              ...workspace.subscriptions
            ];

        const projected = createProjectedPayments(nextSubscriptions, workspace.payments, 6);
        persistDemoWorkspace({
          ...workspace,
          vendors: nextVendors,
          subscriptions: nextSubscriptions,
          payments: [...workspace.payments.filter((entry) => entry.source !== "system"), ...projected],
          alerts: createAlertRecords({
            ...workspace,
            vendors: nextVendors,
            subscriptions: nextSubscriptions,
            payments: [...workspace.payments.filter((entry) => entry.source !== "system"), ...projected]
          })
        });
        return true;
      }

      const record = {
        business_id: workspace.business.id,
        tool_name: payload.toolName,
        vendor_id: resolvedVendorId,
        department_id: payload.departmentId,
        category_id: payload.categoryId,
        plan_name: payload.planName,
        cost: Number(payload.cost || 0),
        currency: payload.currency,
        billing_cycle: payload.billingCycle,
        renewal_date: payload.renewalDate,
        status: payload.status,
        usage_status: payload.usageStatus,
        auto_renew: payload.autoRenew,
        seats: Number(payload.seats || 0),
        notes: payload.notes
      };

      if (payload.id) {
        const { error: updateError } = await supabase.from("subscriptions").update(record).eq("id", payload.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase.from("subscriptions").insert(record);

        if (insertError) {
          throw insertError;
        }
      }

      await loadLiveWorkspace();
      return true;
    } catch (nextError) {
      setError(nextError.message || "Subscription could not be saved.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function deleteSubscription(id) {
    if (!workspace) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (mode === "demo") {
        const nextSubscriptions = workspace.subscriptions.filter((subscription) => subscription.id !== id);
        const nextPayments = workspace.payments.filter((payment) => payment.subscriptionId !== id);

        persistDemoWorkspace({
          ...workspace,
          subscriptions: nextSubscriptions,
          payments: nextPayments,
          alerts: createAlertRecords({
            ...workspace,
            subscriptions: nextSubscriptions,
            payments: nextPayments
          })
        });
        return;
      }

      await supabase.from("payments").delete().eq("subscription_id", id);
      await supabase.from("alerts").delete().eq("subscription_id", id);
      await supabase.from("subscriptions").delete().eq("id", id);
      await loadLiveWorkspace();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setBusy(false);
    }
  }

  async function addPayment(payment) {
    if (!workspace) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const record = {
        id: `pay-${Math.random().toString(36).slice(2, 10)}`,
        subscriptionId: payment.subscriptionId,
        amount: Number(payment.amount || 0),
        currency: payment.currency || workspace.business.currency,
        dueDate: payment.dueDate,
        paidAt: payment.paidAt || null,
        status: payment.status,
        source: "manual",
        reference: payment.reference || "",
        notes: payment.notes || ""
      };

      if (mode === "demo") {
        const nextPayments = [record, ...workspace.payments.filter((entry) => entry.id !== record.id)];
        persistDemoWorkspace({
          ...workspace,
          payments: nextPayments,
          alerts: createAlertRecords({
            ...workspace,
            payments: nextPayments
          })
        });
        return;
      }

      await supabase.from("payments").insert({
        business_id: workspace.business.id,
        subscription_id: record.subscriptionId,
        amount: record.amount,
        currency: record.currency,
        due_date: record.dueDate,
        paid_at: record.paidAt,
        status: record.status,
        source: record.source,
        reference: record.reference,
        notes: record.notes
      });
      await loadLiveWorkspace();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setBusy(false);
    }
  }

  async function addDepartment(name) {
    if (!workspace || !name.trim()) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (mode === "demo") {
        persistDemoWorkspace({
          ...workspace,
          departments: [
            ...workspace.departments,
            {
              id: `dept-${Math.random().toString(36).slice(2, 10)}`,
              name: name.trim(),
              accentColor: "#16a34a"
            }
          ]
        });
        return;
      }

      await supabase.from("departments").insert({
        business_id: workspace.business.id,
        name: name.trim(),
        accent_color: "#16a34a"
      });
      await loadLiveWorkspace();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateBusiness(payload) {
    if (!workspace) {
      return;
    }

    const nextName = payload.name?.trim();

    if (!nextName) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (mode === "demo") {
        persistDemoWorkspace({
          ...workspace,
          business: {
            ...workspace.business,
            name: nextName
          }
        });

        const demoSession = getDemoSession();

        if (demoSession) {
          setDemoSession({
            ...demoSession,
            businessName: nextName
          });
        }

        return;
      }

      await supabase.from("businesses").update({ name: nextName }).eq("id", workspace.business.id);
      await loadLiveWorkspace();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setBusy(false);
    }
  }

  async function markAlertRead(id) {
    if (!workspace) {
      return;
    }

    if (mode === "demo") {
      persistDemoWorkspace({
        ...workspace,
        alerts: workspace.alerts.map((alert) =>
          alert.id === id ? { ...alert, isRead: true } : alert
        )
      });
      return;
    }

    await supabase.from("alerts").update({ is_read: true }).eq("id", id);
    await loadLiveWorkspace();
  }

  async function dismissAlert(id) {
    if (!workspace) {
      return;
    }

    if (mode === "demo") {
      persistDemoWorkspace({
        ...workspace,
        alerts: workspace.alerts.filter((alert) => alert.id !== id)
      });
      return;
    }

    await supabase.from("alerts").delete().eq("id", id);
    await loadLiveWorkspace();
  }

  async function runAnalysis(scope = "workspace") {
    if (!workspace) {
      return null;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          scope,
          snapshot: workspace
        })
      });

      const result = await response.json();
      const analysis = result.analysis;

      if (mode === "demo") {
        persistDemoWorkspace({
          ...workspace,
          aiAnalyses: [
            {
              id: `analysis-${Math.random().toString(36).slice(2, 10)}`,
              ...analysis
            },
            ...workspace.aiAnalyses
          ]
        });
        return analysis;
      }

      await supabase.from("ai_analyses").insert({
        business_id: workspace.business.id,
        trigger_source: "manual",
        scope: { scope },
        summary: analysis.summary,
        recommendations: analysis,
        metrics_snapshot: workspace.metrics,
        is_stale: false
      });
      await loadLiveWorkspace();
      return analysis;
    } catch (nextError) {
      setError(nextError.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  function resetDemoWorkspace() {
    const freshWorkspace = createDemoWorkspace({
      businessName: workspace?.business?.name
    });
    persistDemoWorkspace(freshWorkspace);
  }

  return {
    workspace,
    loading,
    busy,
    error,
    lastSync,
    upsertSubscription,
    deleteSubscription,
    addPayment,
    addDepartment,
    updateBusiness,
    markAlertRead,
    dismissAlert,
    runAnalysis
  };
}
