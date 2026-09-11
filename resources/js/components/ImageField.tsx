import { useState } from "react";
import { Upload, X } from "lucide-react";
import { uploadUrl } from "../lib/upload-response";
export default function ImageField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const upload = async (file?: File) => {
    if (!file) return;
    setError("");
    if (file.size > 4 * 1024 * 1024) {
      setError("اختر صورة أصغر من 4 ميغابايت.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const cookie = document.cookie.split("; ").find((item) => item.startsWith("XSRF-TOKEN="));
      const csrf = cookie ? decodeURIComponent(cookie.substring("XSRF-TOKEN=".length)) : "";
      const response = await fetch("/media", {
        method: "POST",
        credentials: "same-origin",
        body,
        headers: { Accept: "application/json", "X-XSRF-TOKEN": csrf },
      });
      onChange(await uploadUrl(response));
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر رفع الصورة.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="image-field">
      <span>{label}</span>
      <div className="image-upload-row">
        {value && <img src={value} alt="معاينة الصورة المختارة" />}
        <label className="upload-button">
          <Upload size={17} />
          <span>{busy ? "جارٍ رفع الصورة..." : "ارفع صورة من جهازك"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {value && (
          <button type="button" aria-label="إزالة الصورة" onClick={() => onChange("")}>
            <X size={16} />
          </button>
        )}
      </div>
      <small>JPG أو PNG أو WebP. حتى 4 ميغابايت و4096 بكسل.</small>
      <label className="image-url-label">
        أو استخدم رابط HTTPS
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir="ltr"
          placeholder="https://..."
        />
      </label>
      {error && (
        <p className="form-errors" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
