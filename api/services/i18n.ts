import type { LanguageCode } from "../../shared/types.js";

export const LANGUAGES: Record<LanguageCode, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  ar: { label: "العربية", flag: "🇸🇦" },
  ur: { label: "اردو", flag: "🇵🇰" },
};

type Templates = Record<string, Record<LanguageCode, string | ((vars: Record<string, unknown>) => string)>>;

const templates: Templates = {
  language_prompt: {
    en: "Welcome! Please select your language: 1 for English, 2 for Arabic, 3 for Urdu.",
    ar: "مرحباً! يرجى اختيار اللغة: اخحتر 1 للإنجليزية، 2 للعربية، 3 للأردية.",
    ur: "خوش آمدید! براہ کرم اپنی زبان منتخب کریں: انگریزی کے لئے 1، عربی کے لئے 2، اردو کے لئے 3۔",
  },
  language_selected: {
    en: (vars) => `Language set to ${vars.language_label}. How can I help you?`,
    ar: (vars) => `تم ضبط اللغة على ${vars.language_label}. كيف يمكنني مساعدتك؟`,
    ur: (vars) => `زبان ${vars.language_label} منتخب ہوئی۔ کیسے مدد کر سکتا ہوں؟`,
  },
  order_status: {
    en: (vars) =>
      `Order ${vars.order_number} is currently ${vars.status}. ` +
      (vars.tracking_url
        ? `Tracking URL: ${vars.tracking_url}. `
        : "") +
      (vars.eta
        ? `Estimated delivery: ${vars.eta}. `
        : "") +
      "Would you like me to send the tracking link to your WhatsApp?",
    ar: (vars) =>
      `الطلب ${vars.order_number} حالياً ${vars.status}. ` +
      (vars.tracking_url
        ? `رابط التتبع: ${vars.tracking_url}. `
        : "") +
      (vars.eta
        ? `التسليم المتوقع: ${vars.eta}. `
        : "") +
      "هل ترغب في إرسال رابط التتبع إلى واتساب؟",
    ur: (vars) =>
      `آرڈر ${vars.order_number} موجوداً ${vars.status}۔ ` +
      (vars.tracking_url
        ? `ٹریکنگ یوآر ایل: ${vars.tracking_url}۔ `
        : "") +
      (vars.eta
        ? `تھوڑے وقت میں ڈیلیوری: ${vars.eta}۔ `
        : "") +
      "کیا آپ چاہتے ہیں کہ میں ٹریکنگ لنک آپ کے واٹساپ پر بھیج دوں؟",
  },
  order_not_found: {
    en: "I couldn't find an order with that number. Please double-check and try again, or I can connect you with an agent.",
    ar: "لم أتمكن من العثور على طلب برقم ذلك. يرجى التحقق مرة أخرى، أو يمكنني توصيل معلوماتك بوكلاء الدعم.",
    ur: "میرا اس نمبر کے ساتھ کوئی آرڈر نہیں ملا۔ براہ کرم دوبارہ جانچیں، یا میں آپ کو ایجنٹ سے جوڑ سکتا ہوں۔",
  },
  order_lookup_failed: {
    en: "I'm sorry, I'm having trouble looking up that order right now. Would you like me to create a ticket and request a callback from our team?",
    ar: "أنا آسف، أواجه صعوبة في البحث عن هذا الطلب الآن. هل ترغب في إنشاء تذيسة وطلب مكالمة عائدة من فريقنا؟",
    ur: "میرے معذرت کے ساتھ، میں ابھی آرڈر تلاش کرنے میں مشکل دہلا رہا ہوں۔ کیا آپ چاہتے ہیں کہ میں ایک ٹچیٹ بناؤں اور ہمارے ٹیم سے ایک کال بیک کی درخواست کروں؟",
  },
  ticket_created: {
    en: (vars) =>
      `I've created a support ticket (${vars.ticket_id}) for your ${vars.category} issue regarding order ${vars.order_number}. An agent will follow up. Would you like a callback?`,
    ar: (vars) =>
      `لقد أنشأت تذيسة دعم (${vars.ticket_id}) لمشكلك ${vars.category} بشأن الطلب ${vars.order_number}. سيتابعك أحد العمال. هل ترغب في مكالمة عائدة؟`,
    ur: (vars) =>
      `میں نے آپ کے ${vars.category} کے مسئلے کے لئے ایک مدد ٹچیٹ (${vars.ticket_id}) بنا دیا ہے آرڈر ${vars.order_number} کے بارے میں۔ ایک ایجنٹ فالو اپ کرے گا۔ کیا آپ چاہتے ہیں کہ ایک کال بیک کی درخواست کروں؟`,
  },
  callback_created: {
    en: (vars) => `I've requested a callback (ID: ${vars.callback_id}). Someone will call you at ${vars.phone} shortly.`,
    ar: (vars) => `لقد طلبت مكالمة عائدة (المعرف: ${vars.callback_id}). سيتواصل معك أحد أفرادنا هاتفياً على ${vars.phone} في غضون دقائق.`,
    ur: (vars) => `میں نے ایک کال بیک کی درخواست کر دی ہے (آئی ڈی: ${vars.callback_id})۔ کوئی آپ سے ${vars.phone} پر جلد از جلد رابطہ کرے گا۔`,
  },
  whatsapp_sent: {
    en: "I've sent the tracking link to your WhatsApp. You can continue the conversation there.",
    ar: "لقد أرسلت رابطة التتبع إلى واتساب. يمكنك المتابعة بالمحادثة هناك.",
    ur: "میرا نے ٹریکنگ لنک آپ کے واٹساپ پر بھیج دیا ہے۔ آپ وہاں سے مزید گفتگی جاری رکھ سکتے ہیں۔",
  },
  welcome_back: {
    en: "Welcome back! How can I help you?",
    ar: "مرحباً بعودتك! كيف يمكنني مساعدتك؟",
    ur: "خوش آمدیاں! کیسے مدد کر سکتا ہوں؟",
  },
  clarify: {
    en: "I'm not sure I understood. Could you rephrase that? You can ask about order tracking, delivery issues, or returns.",
    ar: "ليستم متأكداً من فهمي. هل يمكنك إعادة صياغته؟ يمكنك السؤال عن تتبع الطلبات، المشاكل في التسليم، أو الإرجاعات.",
    ur: "مجھے یقین نہیں ہے کہ میں نے سمجھا۔ کیا آپ اسے دوبارہ لکھ سکتے ہیں؟ آپ مگر آرڈر ٹریکنگ، ڈیلیوری مسائل، یا ریٹرنز کے بارے میں پوچھ سکتے ہیں۔",
  },
  ask_order_number: {
    en: "Could you please provide your order number?",
    ar: "هل يمكنك تقديم رقم طلبك من فضلك؟",
    ur: "براہ کرم اپنا آرڈر نمبر فراہ کریں۟?",
  },
  ask_issue_details: {
    en: "I'll help you log this issue. Could you describe the problem and your order number?",
    ar: "سأساعدك في تسجيل هذه المشكلة. هل يمكنك وصف المشكلة ورقم طلبك؟",
    ur: "میرا آپ کی اس مسئلے کو ریکارڈ کرنے میں مدد دوں گا۔ براہ کرم مسئلے اور آرڈر نمبر کو وضاحت کریں۟?",
  },
  ask_phone: {
    en: "May I have your phone number for the callback?",
    ar: "هل لدي رقم هاتفك للمكالمة العائدة؟",
    ur: "کیا آپ مجھے اپنا فون نمبر دے سکتے ہیں کال بیک کے لئے؟",
  },
  session_ended: {
    en: "Thank you for calling. Goodbye!",
    ar: "شكراً لك. وداعاً!",
    ur: "شکریہ آپ کا بلانگ گیا۔ خدا حافظ!",
  },
  whatsapp_message_template: {
    en: (vars) => `Your order ${vars.order_number} is ${vars.status}. Track here: ${vars.tracking_url || "N/A"}`,
    ar: (vars) => `طلبك ${vars.order_number} هو ${vars.status}. تتبعه هنا: ${vars.tracking_url || "N/A"}`,
    ur: (vars) => `آپ کا آرڈر ${vars.order_number} ${vars.status} ہے۔ یہاں ڈھونڈیں: ${vars.tracking_url || "N/A"}`,
  },
  whatsapp_ticket_template: {
    en: (vars) => `Ticket ${vars.ticket_id} created for order ${vars.order_number}. Status: ${vars.status}. We'll follow up soon.`,
    ar: (vars) => `تذيسة ${vars.ticket_id} أنشئتها للطلب ${vars.order_number}. الحالة: ${vars.status}. سنتواصل معك قريباً.`,
    ur: (vars) => `ٹچیٹ ${vars.ticket_id} آرڈر ${vars.order_number} کے لئے بنایا گیا۔ اسٹیٹس: ${vars.status}۔ ہم جلد از جلد فالو اپ کریں گے۔`,
  },
};

export function t(key: string, lang: LanguageCode, vars: Record<string, unknown> = {}): string {
  const langTemplates = templates[key];
  if (!langTemplates) return `[missing: ${key}]`;
  const tmpl = langTemplates[lang] ?? langTemplates.en;
  if (typeof tmpl === "function") return tmpl(vars);
  return tmpl as string;
}

export function languageLabel(lang: LanguageCode): string {
  return LANGUAGES[lang].label;
}
