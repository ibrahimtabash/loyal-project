import { Link } from '@inertiajs/react';
import { ArrowLeft, Gift, ShoppingBag, Sparkles } from 'lucide-react';

export default function MotionSections() {
  return <>
    <section className="ravo-depth-section ravo-depth-points">
      <div className="depth-copy"><span className="wisal-kicker">LOYALTY / بُعد جديد للعلاقة</span><h2>قيمة تتراكم.<br />وعلاقة تكبر.</h2><p>حوّل نقاط المنتجات إلى مكافآت يختارها عملاؤك. تجربة واضحة تبدأ بطلب وتستمر مع كل زيارة.</p><a href="#how-it-works" className="wisal-pill wisal-pill-dark">اكتشف كيف <ArrowLeft size={18} /></a></div>
      <div className="depth-scene coin-scene" aria-hidden="true"><div className="depth-orbit orbit-one" /><div className="depth-orbit orbit-two" /><div className="depth-coin"><div className="coin-front"><Sparkles size={66} strokeWidth={1.2} /><b>M</b><small>EVERY VISIT COUNTS</small></div><div className="coin-back"><Gift size={72} strokeWidth={1.2} /><span>MADAR</span></div>{Array.from({length: 12}, (_, i) => <i key={i} className="coin-edge" style={{ transform: `translateZ(${i-6}px)` }} />)}</div><span className="depth-satellite satellite-a"><Gift /></span><span className="depth-satellite satellite-b"><ShoppingBag /></span></div>
    </section>
    <section className="ravo-depth-section ravo-depth-store">
      <div className="depth-copy"><span className="wisal-kicker">COMMERCE / متجرك بكل أبعاده</span><h2>هويتك في الواجهة.<br />طموحك في كل تفصيلة.</h2><p>المنتجات والطلبات والعملاء، ضمن تجربة واحدة. اختر تصميمك وشارك متجرك وابدأ رحلتك.</p><Link href="/register" className="wisal-pill wisal-pill-light">اصنع متجرك <ArrowLeft size={18} /></Link></div>
      <div className="depth-scene store-scene" aria-hidden="true"><div className="depth-browser browser-back"><span>عملاؤك</span><UsersIllustration /></div><div className="depth-browser browser-middle"><span>مكافآت تستحق العودة</span><Gift size={74} strokeWidth={1} /><b>كل زيارة إلها قيمة</b></div><div className="depth-browser browser-front"><header><b>متجرك</b><ShoppingBag size={15} /></header><img src="/images/interior.jpg" alt="" loading="lazy" width="600" height="400" /><footer>تفاصيل تشبهك.<ArrowLeft size={16} /></footer></div></div>
    </section>
  </>;
}
function UsersIllustration() { return <div className="depth-people">{['م','س','ن'].map(letter => <span key={letter}>{letter}</span>)}</div>; }
