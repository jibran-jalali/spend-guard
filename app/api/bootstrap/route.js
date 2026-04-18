import { NextResponse } from "next/server";

import { DEFAULT_VENDOR_CATALOG } from "@/lib/default-vendors";
import { createAdminClient, createTokenClient, hasSupabaseAdminEnv } from "@/lib/supabase/server";

const DEFAULT_DEPARTMENTS = [
  { name: "Operations", accent_color: "#16a34a" },
  { name: "Marketing", accent_color: "#f59e0b" },
  { name: "Finance", accent_color: "#2563eb" }
];

const DEFAULT_CATEGORIES = [
  { name: "Communication", accent_color: "#16a34a", description: "Messaging, calling, meetings" },
  { name: "Marketing", accent_color: "#f59e0b", description: "Campaign tools and growth subscriptions" },
  { name: "Productivity", accent_color: "#2563eb", description: "Collaboration and planning tools" },
  { name: "Hosting", accent_color: "#ef4444", description: "Cloud, hosting, and infrastructure" }
];

export async function POST(request) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json(
      { error: "Supabase service credentials are missing." },
      { status: 503 }
    );
  }

  const authorization = request.headers.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
  }

  const token = authorization.replace("Bearer ", "");
  const userClient = createTokenClient(token);
  const admin = createAdminClient();

  const {
    data: { user },
    error: userError
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unable to verify the signed-in user." }, { status: 401 });
  }

  const { data: existingProfile, error: profileLookupError } = await admin
    .from("profiles")
    .select("id, business_id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    return NextResponse.json({ error: profileLookupError.message }, { status: 500 });
  }

  if (existingProfile) {
    return NextResponse.json({ profile: existingProfile, bootstrapState: "existing" });
  }

  const businessName =
    user.user_metadata?.business_name ||
    `${(user.email || "SpendGuard").split("@")[0]}'s Workspace`;
  const fullName = user.user_metadata?.full_name || user.email || "SpendGuard Admin";

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .insert({ name: businessName })
    .select("id, name, currency, renewal_window_days")
    .single();

  if (businessError) {
    return NextResponse.json({ error: businessError.message }, { status: 500 });
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      id: user.id,
      business_id: business.id,
      full_name: fullName,
      role: "admin"
    })
    .select("id, business_id, full_name, role")
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await admin.from("departments").insert(
    DEFAULT_DEPARTMENTS.map((department) => ({
      ...department,
      business_id: business.id
    }))
  );

  await admin.from("subscription_categories").insert(
    DEFAULT_CATEGORIES.map((category) => ({
      ...category,
      business_id: business.id
    }))
  );

  await admin.from("vendors").insert(
    DEFAULT_VENDOR_CATALOG.map((vendor) => ({
      business_id: business.id,
      name: vendor.name,
      logo_key: vendor.logoKey,
      website: vendor.website
    }))
  );

  return NextResponse.json({
    business,
    profile,
    bootstrapState: "created"
  });
}
