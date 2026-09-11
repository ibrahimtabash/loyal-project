export const storeThemes = [
  { id: 'roots', name: 'جذور', label: 'طبيعي وهادئ', description: 'ألوان ترابية، مقدمة مقسومة وصور دافئة. للمنزل والمنتجات الطبيعية.', accent: '#243d32', eyebrow: 'تفاصيل صغيرة، أثر جميل', collection: 'اختيارات تشبهك', action: 'اكتشف المجموعة' },
  { id: 'luxe', name: 'أُبهة', label: 'فاخر وسينمائي', description: 'صورة غامرة، درجات داكنة ومساحات واسعة. للعطور والمجوهرات والأزياء.', accent: '#75532d', eyebrow: 'حضور لا يشبه سواه', collection: 'مجموعة تستحق الاقتناء', action: 'استكشف المختارات' },
  { id: 'studio', name: 'ستوديو', label: 'بسيط وتحريري', description: 'تكوين أبيض نظيف، خطوط واضحة وصور كبيرة. للتصميم والأثاث والفنون.', accent: '#242424', eyebrow: 'أقلّ، وأجمل', collection: 'التصميم في التفاصيل', action: 'تصفّح المنتجات' },
  { id: 'pulse', name: 'نبض', label: 'جريء ومرح', description: 'ألوان حيوية، حواف مستديرة وتكوين غير متماثل. للهدايا والستايل الشبابي.', accent: '#6236ba', eyebrow: 'على ذوقك. وعلى مزاجك.', collection: 'اختَر القطعة التي تعبّر عنك', action: 'شوف الجديد' },
  { id: 'market', name: 'سوق', label: 'عملي ومنظّم', description: 'مقدمة مختصرة وبطاقات أفقية وتصنيفات واضحة. للغذائيات والكتالوجات الكبيرة.', accent: '#075e69', eyebrow: 'كل احتياجاتك في مكان واحد', collection: 'تسوّق حسب احتياجك', action: 'ابدأ التسوّق' },
] as const;

export function getStoreTheme(id?: string) {
  return storeThemes.find((theme) => theme.id === id) || storeThemes[0];
}
