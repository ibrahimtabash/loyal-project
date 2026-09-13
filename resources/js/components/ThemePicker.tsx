import { Check } from 'lucide-react';
import { storeThemes } from '../lib/store-themes';

export default function ThemePicker({ value, onChange }: { value: string; onChange: (id: string, accent: string) => void }) {
  return <fieldset className="theme-picker">
    <legend>تصميم المتجر</legend>
    <p>خمس هويات مختلفة. اختر التصميم ثم احفظ الإعدادات لتطبيقه على متجرك.</p>
    <div className="theme-options">
      {storeThemes.map((theme) => <label key={theme.id} className={`theme-option ${value === theme.id ? 'is-selected' : ''}`}>
        <input type="radio" name="store-theme" value={theme.id} checked={value === theme.id} onChange={() => onChange(theme.id, theme.accent)} />
        <span className={`theme-mini theme-mini-${theme.id}`} aria-hidden="true">
          <span className="mini-header"><b>{theme.name}</b><span>المجموعة · عن المتجر</span><i>◯</i></span>
          <span className="mini-hero"><span><small>{theme.eyebrow}</small><b>مساحة<br />لما تحبّه.</b><i>اكتشف المجموعة ←</i></span><span className="mini-photo" /></span>
          <span className="mini-products">{[0, 1, 2].map((n) => <span key={n}><i /><b /><small /></span>)}</span>
        </span>
        <span className="theme-option-title"><strong>{theme.name}</strong><span>{theme.label}</span>{value === theme.id && <Check size={17} />}</span>
        <span className="theme-option-description">{theme.description}</span>
      </label>)}
    </div>
    <p>يبدأ كل ثيم بلونه المقترح؛ يمكنك تعديل لون العلامة بعد الاختيار.</p>
  </fieldset>;
}
