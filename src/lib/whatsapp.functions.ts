import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WhatsappStatus = {
  connected: boolean;
  displayPhone?: string | null;
  phoneNumberId?: string | null;
  defaultTemplate?: string | null;
  templateLang?: string | null;
  isActive?: boolean;
  verifiedName?: string | null;
  error?: string | null;
};

const GRAPH = "https://graph.facebook.com/v21.0";

/** حالة الربط للمتجر (بدون كشف رمز الوصول). */
export const getWhatsappStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { businessId: string }) => ({ businessId: String(data.businessId) }))
  .handler(async ({ data, context }): Promise<WhatsappStatus> => {
    const { data: row } = await context.supabase
      .from("whatsapp_accounts")
      .select("phone_number_id, display_phone, default_template, template_lang, is_active")
      .eq("business_id", data.businessId)
      .maybeSingle();
    if (!row) return { connected: false };
    return {
      connected: true,
      displayPhone: row.display_phone,
      phoneNumberId: row.phone_number_id,
      defaultTemplate: row.default_template,
      templateLang: row.template_lang,
      isActive: row.is_active,
    };
  });

/** حفظ بيانات ربط واتساب بزنس بعد التحقق منها لدى ميتا. */
export const connectWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    businessId: string;
    phoneNumberId: string;
    accessToken: string;
    wabaId?: string;
    defaultTemplate?: string;
    templateLang?: string;
  }) => ({
    businessId: String(data.businessId),
    phoneNumberId: String(data.phoneNumberId).trim().slice(0, 64),
    accessToken: String(data.accessToken).trim().slice(0, 1000),
    wabaId: String(data.wabaId ?? "").trim().slice(0, 64),
    defaultTemplate: String(data.defaultTemplate ?? "").trim().slice(0, 128),
    templateLang: String(data.templateLang ?? "ar").trim().slice(0, 12),
  }))
  .handler(async ({ data, context }): Promise<WhatsappStatus> => {
    // تحقق من ملكية المتجر عبر RLS
    const { data: biz } = await context.supabase
      .from("businesses")
      .select("id")
      .eq("id", data.businessId)
      .maybeSingle();
    if (!biz) return { connected: false, error: "لا تملك صلاحية على هذا المتجر" };

    const res = await fetch(
      `${GRAPH}/${encodeURIComponent(data.phoneNumberId)}?fields=display_phone_number,verified_name`,
      { headers: { Authorization: `Bearer ${data.accessToken}` } },
    );
    const json = (await res.json()) as {
      display_phone_number?: string;
      verified_name?: string;
      error?: { message?: string };
    };
    if (!res.ok) {
      return { connected: false, error: json.error?.message ?? "تعذر التحقق من بيانات واتساب" };
    }

    const { error } = await context.supabase.from("whatsapp_accounts").upsert(
      {
        business_id: data.businessId,
        phone_number_id: data.phoneNumberId,
        waba_id: data.wabaId || null,
        display_phone: json.display_phone_number ?? null,
        access_token: data.accessToken,
        default_template: data.defaultTemplate || null,
        template_lang: data.templateLang || "ar",
        is_active: true,
      },
      { onConflict: "business_id" },
    );
    if (error) return { connected: false, error: error.message };

    return {
      connected: true,
      displayPhone: json.display_phone_number ?? null,
      verifiedName: json.verified_name ?? null,
      phoneNumberId: data.phoneNumberId,
      defaultTemplate: data.defaultTemplate || null,
      templateLang: data.templateLang || "ar",
      isActive: true,
    };
  });

/** إلغاء الربط. */
export const disconnectWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { businessId: string }) => ({ businessId: String(data.businessId) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("whatsapp_accounts")
      .delete()
      .eq("business_id", data.businessId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type SendResult = { phone: string; ok: boolean; error?: string };

/** إرسال تلقائي عبر واتساب كلاود API — نص حر أو قالب معتمد. */
export const sendWhatsappMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    businessId: string;
    mode: "text" | "template";
    templateName?: string;
    templateLang?: string;
    messages: { phone: string; body: string; params?: string[] }[];
  }) => ({
    businessId: String(data.businessId),
    mode: data.mode === "template" ? ("template" as const) : ("text" as const),
    templateName: String(data.templateName ?? "").trim().slice(0, 128),
    templateLang: String(data.templateLang ?? "ar").trim().slice(0, 12),
    messages: (data.messages ?? []).slice(0, 200).map((m) => ({
      phone: String(m.phone).replace(/\D/g, "").slice(0, 20),
      body: String(m.body ?? "").slice(0, 4000),
      params: (m.params ?? []).slice(0, 6).map((p) => String(p).slice(0, 200)),
    })),
  }))
  .handler(async ({ data, context }): Promise<{ results: SendResult[] }> => {
    const { data: acc } = await context.supabase
      .from("whatsapp_accounts")
      .select("phone_number_id, access_token, is_active")
      .eq("business_id", data.businessId)
      .maybeSingle();
    if (!acc || !acc.is_active) throw new Error("لم يتم ربط واتساب بزنس لهذا المتجر");

    const results: SendResult[] = [];
    for (const m of data.messages) {
      if (!m.phone) {
        results.push({ phone: m.phone, ok: false, error: "رقم غير صالح" });
        continue;
      }
      const payload =
        data.mode === "template"
          ? {
              messaging_product: "whatsapp",
              to: m.phone,
              type: "template",
              template: {
                name: data.templateName,
                language: { code: data.templateLang || "ar" },
                ...(m.params && m.params.length
                  ? {
                      components: [
                        {
                          type: "body",
                          parameters: m.params.map((p) => ({ type: "text", text: p })),
                        },
                      ],
                    }
                  : {}),
              },
            }
          : {
              messaging_product: "whatsapp",
              to: m.phone,
              type: "text",
              text: { preview_url: false, body: m.body },
            };

      try {
        const res = await fetch(`${GRAPH}/${encodeURIComponent(acc.phone_number_id)}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${acc.access_token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { error?: { message?: string } };
        if (!res.ok) {
          results.push({ phone: m.phone, ok: false, error: json.error?.message ?? "فشل الإرسال" });
        } else {
          results.push({ phone: m.phone, ok: true });
        }
      } catch (e) {
        results.push({ phone: m.phone, ok: false, error: (e as Error).message });
      }
    }
    return { results };
  });
