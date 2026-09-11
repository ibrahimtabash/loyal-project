import { createServerFn } from "@tanstack/react-start";

export type ReceiptView = {
  status: "ok" | "claimed" | "not_found";
  amount?: number | undefined;
  points?: number | undefined;
  businessName?: string | undefined;
  currency?: string | undefined;
  needsPhone?: boolean | undefined;
  balance?: number | undefined;
};

export const getReceipt = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => ({ token: String(data.token).slice(0, 64) }))
  .handler(async ({ data }): Promise<ReceiptView> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: r } = await supabaseAdmin
      .from("receipts")
      .select("id, amount, points, claimed_at, customer_id, business_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!r) return { status: "not_found" };

    const { data: b } = await supabaseAdmin
      .from("businesses")
      .select("name, currency")
      .eq("id", r.business_id)
      .maybeSingle();

    let balance: number | undefined;
    if (r.customer_id) {
      const { data: c } = await supabaseAdmin
        .from("customers")
        .select("points_balance")
        .eq("id", r.customer_id)
        .maybeSingle();
      balance = c?.points_balance ?? undefined;
    }

    return {
      status: r.claimed_at ? "claimed" : "ok",
      amount: Number(r.amount),
      points: r.points,
      businessName: b?.name ?? "",
      currency: b?.currency ?? "SAR",
      needsPhone: !r.customer_id,
      balance,
    };
  });

export const claimReceipt = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; phone?: string | undefined }) => ({
    token: String(data.token).slice(0, 64),
    phone: data.phone ? String(data.phone).trim().slice(0, 20) : undefined,
  }))
  .handler(async ({ data }): Promise<ReceiptView> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: r } = await supabaseAdmin
      .from("receipts")
      .select("id, amount, points, claimed_at, customer_id, business_id, phone")
      .eq("token", data.token)
      .maybeSingle();
    if (!r) return { status: "not_found" };

    const { data: b } = await supabaseAdmin
      .from("businesses")
      .select("name, currency")
      .eq("id", r.business_id)
      .maybeSingle();
    const base = { businessName: b?.name ?? "", currency: b?.currency ?? "SAR", amount: Number(r.amount), points: r.points };

    let customerId = r.customer_id;
    if (!customerId) {
      const phone = data.phone || r.phone;
      if (!phone) return { status: "ok", ...base, needsPhone: true };
      const { data: existing } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("business_id", r.business_id)
        .eq("phone", phone)
        .maybeSingle();
      if (existing) {
        customerId = existing.id;
      } else {
        const { data: created, error } = await supabaseAdmin
          .from("customers")
          .insert({ business_id: r.business_id, name: phone, phone })
          .select("id")
          .single();
        if (error) throw new Error("تعذّر إنشاء حساب العميل");
        customerId = created.id;
      }
    }

    if (r.claimed_at) {
      const { data: c } = await supabaseAdmin
        .from("customers")
        .select("points_balance")
        .eq("id", customerId)
        .maybeSingle();
      return { status: "claimed", ...base, balance: c?.points_balance ?? undefined };
    }

    const { error: txError } = await supabaseAdmin.from("transactions").insert({
      business_id: r.business_id,
      customer_id: customerId,
      type: "earn",
      points: r.points,
      amount: Number(r.amount),
      note: "نقاط فاتورة عبر رمز QR",
    });
    if (txError) throw new Error("تعذّر إضافة النقاط");

    await supabaseAdmin
      .from("receipts")
      .update({ claimed_at: new Date().toISOString(), customer_id: customerId })
      .eq("id", r.id);

    const { data: c } = await supabaseAdmin
      .from("customers")
      .select("points_balance")
      .eq("id", customerId)
      .maybeSingle();

    return { status: "claimed", ...base, balance: c?.points_balance ?? undefined };
  });
