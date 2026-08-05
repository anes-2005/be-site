import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

export type Lang = 'en' | 'ar';

const STORAGE_KEY = 'be_lang';
const PROMPT_KEY = 'be_lang_prompted';

export interface LangContextValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  promptShown: boolean;
  dismissPrompt: () => void;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  dir: 'ltr',
  setLang: () => {},
  t: (k) => k,
  promptShown: false,
  dismissPrompt: () => {},
});

type Dict = Record<string, string>;

const en: Dict = {
  // Navigation
  'nav.home': 'Home',
  'nav.store': 'Store',
  'nav.about': 'About',
  'nav.preorder': 'Preorder',
  'nav.instagram': 'Instagram',

  // Hero
  'hero.debut': 'The Debut',
  'hero.soldOut': 'Sold Out',

  // Collection section
  'collection.eyebrow': 'Collection',
  'collection.title': 'The Debut',

  // Why Preorder
  'whyPreorder.eyebrow': 'Why Preorder',
  'whyPreorder.title': 'A considered way to make.',
  'whyPreorder.description': 'Preordering is not a wait — it is the point. Each piece exists because someone chose it first.',

  'whyPreorder.card1.title': 'Limited Collection',
  'whyPreorder.card1.body': 'A fixed run of 100 pieces. Once they are reserved, no more will be made.',
  'whyPreorder.card2.title': 'Premium Materials',
  'whyPreorder.card2.body': 'Selected fabrics and finishes, cut and assembled to a luxury standard.',
  'whyPreorder.card3.title': 'Made Only For Those Who Reserve',
  'whyPreorder.card3.body': 'Each piece is produced to order for the person who claimed it — nothing surplus.',

  // Gallery preview
  'preview.eyebrow': 'Preview',
  'preview.title': 'Inside the collection.',

  // Stock
  'stock.eyebrow': 'Availability',
  'stock.label': 'Pieces Remaining',
  'stock.soldOut': 'Sold Out',
  'stock.piecesRemaining': 'pieces remaining',
  'stock.loading': 'Loading…',

  // Reserve section
  'reserve.eyebrow': 'Reserve',
  'reserve.title': 'Secure your piece.',
  'reserve.description': 'Complete the form below. We will confirm your reservation and reach out with next steps.',
  'reserve.button': 'Reserve a piece',

  // Preorder form
  'form.eyebrow': 'Reserve',
  'form.title': 'Preorder Form',
  'form.soldOut': 'Sold Out',
  'form.fullName': 'Full Name',
  'form.fullNameReq': 'Full name is required.',
  'form.firstName': 'First Name',
  'form.firstNameReq': 'First name is required.',
  'form.lastName': 'Last Name',
  'form.lastNameReq': 'Last name is required.',
  'form.phone': 'Phone Number',
  'form.phoneReq': 'Phone number is required.',
  'form.phoneInvalid': 'Enter a valid phone number.',
  'form.email': 'Email Address',
  'form.emailReq': 'Email is required.',
  'form.emailInvalid': 'Enter a valid email address.',
  'form.wilaya': 'Wilaya',
  'form.wilayaReq': 'Select your wilaya.',
  'form.wilayaPlaceholder': 'Select your province',
  'form.size': 'Size',
  'form.sizeReq': 'Select a size.',
  'form.sizePlaceholder': 'Select size',
  'form.quantity': 'Quantity',
  'form.quantityReq': 'Quantity must be at least 1.',
  'form.quantityRemaining': 'Only {n} pieces remaining.',
  'form.deliveryMethod': 'Delivery Method',
  'form.deliveryMethodReq': 'Select a delivery method.',
  'form.homeDelivery': 'Home Delivery',
  'form.officePickup': 'Office Pickup',
  'form.municipality': 'Municipality',
  'form.municipalityReq': 'Select your municipality.',
  'form.municipalityPlaceholder': 'Select your municipality',
  'form.wilayaDisabled': 'Delivery is not available for this wilaya.',
  'form.acknowledged': 'I understand this is a preorder. Production begins after reservation and shipping follows completion.',
  'form.acknowledgedReq': 'Please confirm this is a preorder.',
  'form.submit': 'Reserve My Piece',
  'form.submitting': 'Reserving…',
  'form.serverError': 'Something went wrong. Please try again.',
  'form.success.title': 'Thank you.',
  'form.success.body': 'Your preorder has been received. We will contact you shortly to confirm the details.',
  'form.success.button': 'Back to Home',
  'form.remaining': '{remaining} of {max} remaining.',

  // Store page
  'store.eyebrow': 'Store',
  'store.title': 'All Collections',
  'store.description': 'Every collection we release lives here. Each is a limited preorder — made only for those who reserve.',
  'store.empty': 'No collections published yet.',

  // Collection page
  'collectionPage.back': 'Store',
  'collectionPage.eyebrow': 'Collection',
  'collectionPage.reserve': 'Reserve My Piece',
  'collectionPage.soldOut': 'Sold Out',
  'collectionPage.theCollection': 'The Collection',
  'collectionPage.gallery.eyebrow': 'Gallery',
  'collectionPage.gallery.title': 'A closer look.',
  'collectionPage.reserve.eyebrow': 'Reserve',
  'collectionPage.reserve.title': 'Preorder this collection.',
  'collectionPage.reserve.descAvailable': 'Complete the form to secure your piece.',
  'collectionPage.reserve.descSoldOut': 'This collection is fully reserved.',
  'collectionPage.notFound': 'Collection not found',
  'collectionPage.notFoundButton': 'Back to Store',

  // Collection card
  'card.available': 'Available',
  'card.comingSoon': 'Coming Soon',
  'card.soldOut': 'Sold Out',
  'card.remaining': 'Remaining',
  'card.viewCollection': 'View Collection →',

  // About page
  'about.eyebrow': 'About',
  'about.follow.eyebrow': 'Follow',
  'about.follow.title': 'Stay close.',
  'about.follow.description': 'We share updates and releases on Instagram.',

  // Confirmation page
  'confirmation.eyebrow': 'Confirmed',
  'confirmation.title': 'Thank you.',
  'confirmation.body': 'Your preorder has been received successfully.',
  'confirmation.body2': 'We will contact you shortly.',
  'confirmation.returnHome': 'Return Home',
  'confirmation.continueShopping': 'Continue Shopping',

  // Footer
  'footer.rights': 'All rights reserved.',

  // 404 / not found
  'notFound.title': 'Page not found',
  'notFound.button': 'Return Home',

  // Maintenance / site offline
  'offline.title': 'Something new is coming.',
  'offline.body': 'We are preparing our next release. Please check back soon.',
  'offline.seoTitle': 'be — Coming Soon',
  'offline.seoDescription': 'Something new is coming.',

  // Admin login
  'admin.login.title': 'Sign in',
  'admin.login.subtitle': 'Enter the admin password to continue.',
  'admin.login.password': 'Password',
  'admin.login.submit': 'Sign In',
  'admin.login.error': 'Incorrect password.',
  'admin.login.adminLabel': 'Admin',
  'admin.login.restricted': 'Access is restricted to authorized administrators.',

  // Brand Story
  'story.eyebrow': 'Our Story',
  'story.minRead': 'min read',
  'story.editorial': 'Editorial',
  'story.continue': 'Continue the journey',
  'story.defaultHeroTitle': 'BE is not a brand. It is a philosophy.',
  'story.defaultHeroSubtitle': 'Before you wear it, understand why it exists.',
  'story.defaultCta': 'Explore Collections',
  'story.defaultFinal': 'You are not buying clothing. You are choosing who you want to become.',

  // Language switcher
  'lang.en': 'EN',
  'lang.ar': 'العربية',
  'lang.switchToArabic': 'العربية',
  'lang.switchToEnglish': 'EN',

  // Translation prompt
  'prompt.title': 'Would you like to browse this website in Arabic?',
  'prompt.translate': 'Translate to Arabic',
  'prompt.continue': 'Continue in English',
};

const ar: Dict = {
  // Navigation
  'nav.home': 'الرئيسية',
  'nav.store': 'المتجر',
  'nav.about': 'من نحن',
  'nav.preorder': 'الحجز المسبق',
  'nav.instagram': 'انستغرام',

  // Hero
  'hero.debut': 'الإصدار الأول',
  'hero.soldOut': 'نفدت الكمية',

  // Collection section
  'collection.eyebrow': 'المجموعة',
  'collection.title': 'الإصدار الأول',

  // Why Preorder
  'whyPreorder.eyebrow': 'لماذا الحجز المسبق',
  'whyPreorder.title': 'طريقة مدروعة في الصنع.',
  'whyPreorder.description': 'الحجز المسبق ليس انتظاراً — بل هو الهدف. كل قطعة موجودة لأن شخصاً ما اختارها أولاً.',

  'whyPreorder.card1.title': 'مجموعة محدودة',
  'whyPreorder.card1.body': 'إنتاج محدود بـ 100 قطعة. بمجرد حجزها، لن تُصنع المزيد.',
  'whyPreorder.card2.title': 'خامات فاخرة',
  'whyPreorder.card2.body': 'أقمشة وتشطيبات مختارة، مقصوصة ومجمّعة وفقاً لمعايير فاخرة.',
  'whyPreorder.card3.title': 'تصنع فقط لمن يحجز',
  'whyPreorder.card3.body': 'كل قطعة تُصنع حسب الطلب للشخص الذي حجزها — لا فائض.',

  // Gallery preview
  'preview.eyebrow': 'معاينة',
  'preview.title': 'داخل المجموعة.',

  // Stock
  'stock.eyebrow': 'التوفر',
  'stock.label': 'القطع المتبقية',
  'stock.soldOut': 'نفدت الكمية',
  'stock.piecesRemaining': 'قطعة متبقية',
  'stock.loading': 'جارٍ التحميل…',

  // Reserve section
  'reserve.eyebrow': 'احجز',
  'reserve.title': 'احجز قطعتك.',
  'reserve.description': 'أكمل النموذج أدناه. سنؤكد حجزك ونتواصل معك للخطوات التالية.',
  'reserve.button': 'احجز قطعة',

  // Preorder form
  'form.eyebrow': 'احجز',
  'form.title': 'نموذج الحجز المسبق',
  'form.soldOut': 'نفدت الكمية',
  'form.fullName': 'الاسم الكامل',
  'form.fullNameReq': 'الاسم الكامل مطلوب.',
  'form.firstName': 'الاسم الأول',
  'form.firstNameReq': 'الاسم الأول مطلوب.',
  'form.lastName': 'اللقب',
  'form.lastNameReq': 'اللقب مطلوب.',
  'form.phone': 'رقم الهاتف',
  'form.phoneReq': 'رقم الهاتف مطلوب.',
  'form.phoneInvalid': 'أدخل رقم هاتف صحيح.',
  'form.email': 'البريد الإلكتروني',
  'form.emailReq': 'البريد الإلكتروني مطلوب.',
  'form.emailInvalid': 'أدخل بريداً إلكترونياً صحيحاً.',
  'form.wilaya': 'الولاية',
  'form.wilayaReq': 'اختر ولايتك.',
  'form.wilayaPlaceholder': 'اختر ولايتك',
  'form.size': 'المقاس',
  'form.sizeReq': 'اختر مقاساً.',
  'form.sizePlaceholder': 'اختر المقاس',
  'form.quantity': 'الكمية',
  'form.quantityReq': 'يجب أن تكون الكمية 1 على الأقل.',
  'form.quantityRemaining': 'بقيت {n} قطع فقط.',
  'form.deliveryMethod': 'طريقة التوصيل',
  'form.deliveryMethodReq': 'اختر طريقة التوصيل.',
  'form.homeDelivery': 'التوصيل للمنزل',
  'form.officePickup': 'الاستلام من المكتب',
  'form.municipality': 'البلدية',
  'form.municipalityReq': 'اختر بلديتك.',
  'form.municipalityPlaceholder': 'اختر بلديتك',
  'form.wilayaDisabled': 'التوصيل غير متاح لهذه الولاية.',
  'form.acknowledged': 'أفهم أن هذا حجز مسبق. يبدأ الإنتاج بعد الحجز ويتبعه الشحن عند الاكتمال.',
  'form.acknowledgedReq': 'يرجى تأكيد أن هذا حجز مسبق.',
  'form.submit': 'احجز قطعتي',
  'form.submitting': 'جارٍ الحجز…',
  'form.serverError': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
  'form.success.title': 'شكراً لك.',
  'form.success.body': 'تم استلام حجزك المسبق. سنتواصل معك قريباً لتأكيد التفاصيل.',
  'form.success.button': 'العودة للرئيسية',
  'form.remaining': 'بقيت {remaining} من {max}.',

  // Store page
  'store.eyebrow': 'المتجر',
  'store.title': 'كل المجموعات',
  'store.description': 'كل مجموعة نطلقها موجودة هنا. كل واحدة حجز مسبق محدود — تصنع فقط لمن يحجزها.',
  'store.empty': 'لا توجد مجموعات منشورة بعد.',

  // Collection page
  'collectionPage.back': 'المتجر',
  'collectionPage.eyebrow': 'المجموعة',
  'collectionPage.reserve': 'احجز قطعتي',
  'collectionPage.soldOut': 'نفدت الكمية',
  'collectionPage.theCollection': 'المجموعة',
  'collectionPage.gallery.eyebrow': 'المعرض',
  'collectionPage.gallery.title': 'نظرة أقرب.',
  'collectionPage.reserve.eyebrow': 'احجز',
  'collectionPage.reserve.title': 'احجز هذه المجموعة.',
  'collectionPage.reserve.descAvailable': 'أكمل النموذج لتأمين قطعتك.',
  'collectionPage.reserve.descSoldOut': 'هذه المجموعة محجوزة بالكامل.',
  'collectionPage.notFound': 'المجموعة غير موجودة',
  'collectionPage.notFoundButton': 'العودة للمتجر',

  // Collection card
  'card.available': 'متاح',
  'card.comingSoon': 'قريباً',
  'card.soldOut': 'نفدت الكمية',
  'card.remaining': 'المتبقي',
  'card.viewCollection': 'عرض المجموعة ←',

  // About page
  'about.eyebrow': 'من نحن',
  'about.follow.eyebrow': 'تابعنا',
  'about.follow.title': 'ابقَ قريباً.',
  'about.follow.description': 'نشارك التحديثات والإصدارات على انستغرام.',

  // Confirmation page
  'confirmation.eyebrow': 'تم التأكيد',
  'confirmation.title': 'شكراً لك.',
  'confirmation.body': 'تم استلام حجزك المسبق بنجاح.',
  'confirmation.body2': 'سنتواصل معك قريباً.',
  'confirmation.returnHome': 'العودة للرئيسية',
  'confirmation.continueShopping': 'متابعة التسوق',

  // Footer
  'footer.rights': 'جميع الحقوق محفوظة.',

  // 404 / not found
  'notFound.title': 'الصفحة غير موجودة',
  'notFound.button': 'العودة للرئيسية',

  // Maintenance / site offline
  'offline.title': 'شيء جديد قادم.',
  'offline.body': 'نحن نجهز إصدارنا القادم. يرجى العودة قريباً.',
  'offline.seoTitle': 'be — قريباً',
  'offline.seoDescription': 'شيء جديد قادم.',

  // Admin login
  'admin.login.title': 'تسجيل الدخول',
  'admin.login.subtitle': 'أدخل كلمة مرور المسؤول للمتابعة.',
  'admin.login.password': 'كلمة المرور',
  'admin.login.submit': 'دخول',
  'admin.login.error': 'كلمة المرور غير صحيحة.',
  'admin.login.adminLabel': 'المسؤول',
  'admin.login.restricted': 'الدخول مخصص للمسؤولين المصرح لهم فقط.',

  // Brand Story
  'story.eyebrow': 'قصتنا',
  'story.minRead': 'دقيقة قراءة',
  'story.editorial': 'مقال تحريري',
  'story.continue': 'تابع الرحلة',
  'story.defaultHeroTitle': 'be ليست علامة تجارية. بل فلسفة.',
  'story.defaultHeroSubtitle': 'قبل أن ترتديها، افهم لماذا وُجدت.',
  'story.defaultCta': 'استكشف المجموعات',
  'story.defaultFinal': 'أنت لا تشتري ملابس. أنت تختار من تريد أن تصبح.',

  // Language switcher
  'lang.en': 'EN',
  'lang.ar': 'العربية',
  'lang.switchToArabic': 'العربية',
  'lang.switchToEnglish': 'EN',

  // Translation prompt
  'prompt.title': 'هل تفضل تصفح الموقع باللغة العربية؟',
  'prompt.translate': 'الترجمة إلى العربية',
  'prompt.continue': 'المتابعة بالإنجليزية',
};

const dicts: Record<Lang, Dict> = { en, ar };

function readLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'ar' || v === 'en') return v;
  } catch { /* ignore */ }
  return 'en';
}

function readPrompted(): boolean {
  try {
    return localStorage.getItem(PROMPT_KEY) === '1';
  } catch {
    return false;
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readLang());
  const [promptShown, setPromptShown] = useState<boolean>(() => !readPrompted());

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  const dismissPrompt = useCallback(() => {
    setPromptShown(false);
    try { localStorage.setItem(PROMPT_KEY, '1'); } catch { /* ignore */ }
  }, []);

  const t = useCallback((key: string) => {
    return dicts[lang][key] ?? dicts.en[key] ?? key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, dir, setLang, t, promptShown, dismissPrompt }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

// Helper to interpolate {n} style placeholders
export function tInterpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
