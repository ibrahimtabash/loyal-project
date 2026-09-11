export async function uploadUrl(response: Response): Promise<string> {
  if (response.status === 401 || response.status === 419 || response.redirected) {
    throw new Error("انتهت جلسة الدخول. حدّث الصفحة وسجّل دخولك ثم أعد رفع الصورة.");
  }
  if (response.status === 413) throw new Error("حجم الصورة أكبر من الحد المسموح. اختر صورة حتى 4 ميغابايت.");
  if (response.status === 429) throw new Error("رفعت صوراً كثيرة خلال وقت قصير. انتظر دقيقة وحاول مجدداً.");

  // Do not expose HTML, PHP notices, or debug traces to the user, even with a JSON content-type.
  let result: { url?: unknown; errors?: { image?: unknown } };
  try {
    result = await response.json();
    if (!result || typeof result !== "object") throw new Error();
  } catch {
    throw new Error("تعذّر رفع الصورة بسبب خطأ في استجابة الخادم. حاول مجدداً، وإذا تكرر الخطأ تواصل مع الدعم.");
  }
  if (!response.ok) {
    const messages = result.errors?.image;
    throw new Error(response.status === 422 && Array.isArray(messages) && typeof messages[0] === "string"
      ? messages[0] : "تعذّر حفظ الصورة على الخادم. حاول مجدداً.");
  }
  if (typeof result.url !== "string" || !/^\/media\/\d+\/[a-f0-9-]+\.(?:jpg|jpeg|png|webp)$/.test(result.url)) {
    throw new Error("لم يُرجع الخادم رابط صورة صالحاً. حاول مجدداً.");
  }
  return result.url;
}
