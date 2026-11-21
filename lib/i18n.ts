// Pure i18n helpers (safe to import from server and client code).

export const LOCALES = ['en', 'fr', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
export const dirOf = (l: Locale) => (l === 'ar' ? 'rtl' : 'ltr');
export const DATE_LOCALE: Record<Locale, string> = { en: 'en-US', fr: 'fr-FR', ar: 'ar-MA' }; // ar-MA keeps Latin digits

/** Translated value of an item's field: `title_fr` / `title_ar`, falling back to the English `title`. */
export function tr(o: Record<string, string> | undefined, key: string, locale: Locale): string {
  return (locale !== 'en' && o?.[`${key}_${locale}`]) || o?.[key] || '';
}

export const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

const en = {
  nav: { about: 'About', projects: 'Projects', education: 'Education', experience: 'Experience', blog: 'Blog', templates: 'Templates', contact: 'Contact', menu: 'Open menu', language: 'Language', theme: 'Toggle theme' },
  c: { home: 'Home', admin: 'Admin', arrow: '→', back: '←', all: 'All', minRead: '{n} min read', min: '{n} min' },
  hero: {
    viewProjects: 'View projects', getInTouch: 'Get in touch', available: 'Available for new projects', unavailable: 'Not available right now',
    openTo: 'Open to {v}', badge: 'OPEN FOR WORK · OPEN FOR WORK · ',
  },
  about: {
    kicker: 'about', heading: 'I like small, well-named things and interfaces nobody has to think about.', headingHl: 'well-named things',
    based: 'Based in', langs: 'Languages', currently: 'Currently', openTo: 'Open to', noPhoto: 'Add your photo in Admin › Profile', alt: 'Portrait of {name}',
    competences: 'Core competences', hint: 'scroll to speed up, hover to slow down',
  },
  projects: { kicker: 'projects', title: 'Selected work', filter: 'Filter projects', none: 'No projects yet.', live: 'Live demo', code: 'Source code', more: 'Show {n} more projects', less: 'Show fewer', prev: 'Previous project', next: 'Next project' },
  education: {
    kicker: 'academic path', title: 'Where I learned the fundamentals', snapshot: 'At a glance', timeline: 'Timeline', degrees: 'Degrees', certs: 'Certifications', years: 'Years of study', degree: 'Degree',
    certsTitle: 'Certifications & courses', certsSub: 'Credentials earned along the way.', verify: 'Verify', credential: 'ID', none: 'No certifications yet.',
  },
  experience: { kicker: 'experience', title: "Where I've shipped" },
  contact: {
    kicker: 'contact', title: "Got a problem worth solving? Let's talk.", name: 'Name', namePh: 'Your name', email: 'Email', emailPh: 'you@company.com',
    message: 'Message', messagePh: 'What are you building?', send: 'Send message', sending: 'Sending…', sentTitle: 'Message sent.',
    sentBody: 'Thanks for reaching out. I will get back to you soon.', error: 'Something went wrong. Please try again.',
    info: 'Your information will only be used to respond to your message.', available: 'Available',
    reply: 'I usually reply within 24 hours.', copy: 'Copy', copied: 'Copied', findMe: 'Find me on', topic: 'What is it about?', topics: ['Project', 'Job offer', 'Collaboration', 'Just saying hi'], sentKicker: 'Message sent', another: 'Send another message', chars: '{n} / 4000'
  },
  blog: {
    title: 'Notes from the terminal.', hl: 'terminal.', sub: 'Writing on architecture, code and the craft of shipping software.',
    filter: 'Filter by topic', search: 'Search posts', searchPh: 'Type to filter…', noMatch: 'No posts match.', noMatchHint: 'Try another topic or clear the search.',
    featured: 'Featured', readPost: 'Read post', read: 'Read', none: 'No posts published yet.', back: 'All posts', draft: 'Draft preview', keep: 'Keep reading', notFound: 'Post not found',
    toc: 'On this page', copy: 'Copy', copied: 'Copied', copyLink: 'Copy link', linkCopied: 'Link copied', writtenBy: 'Written by', share: 'Share',
  },
  templates: {
    title: 'Starters, ready to clone.', hl: 'ready to clone.', sub: 'Boilerplates and project kits I use myself, so you can skip the first week of setup.',
    filter: 'Filter by category', count: '{n} templates', get: 'Get template', none: 'No templates yet.',
  },
};
export type Dict = typeof en;

const fr: Dict = {
  nav: { about: 'À propos', projects: 'Projets', education: 'Formation', experience: 'Expérience', blog: 'Blog', templates: 'Modèles', contact: 'Contact', menu: 'Ouvrir le menu', language: 'Langue', theme: 'Changer de thème' },
  c: { home: 'Accueil', admin: 'Admin', arrow: '→', back: '←', all: 'Tous', minRead: '{n} min de lecture', min: '{n} min' },
  hero: {
    viewProjects: 'Voir les projets', getInTouch: 'Me contacter', available: 'Disponible pour de nouveaux projets', unavailable: "Pas disponible pour l'instant",
    openTo: 'Ouvert à : {v}', badge: 'DISPONIBLE · DISPONIBLE · ',
  },
  about: {
    kicker: 'à propos', heading: "J'aime les petites choses bien nommées et les interfaces auxquelles personne n'a besoin de penser.", headingHl: 'bien nommées',
    based: 'Basé à', langs: 'Langues', currently: 'Actuellement', openTo: 'Ouvert à', noPhoto: 'Ajoutez votre photo dans Admin › Profil', alt: 'Portrait de {name}',
    competences: 'Compétences clés', hint: 'faites défiler pour accélérer, survolez pour ralentir',
  },
  projects: { kicker: 'projets', title: 'Réalisations choisies', filter: 'Filtrer les projets', none: 'Aucun projet pour le moment.', live: 'Démo en ligne', code: 'Code source', more: 'Voir {n} projets de plus', less: 'Voir moins', prev: 'Projet précédent', next: 'Projet suivant' },
  education: {
    kicker: 'parcours académique', title: "Là où j'ai appris les fondamentaux", snapshot: 'En un coup d\'œil', timeline: 'Chronologie', degrees: 'Diplômes', certs: 'Certifications', years: "Années d'études", degree: 'Diplôme',
    certsTitle: 'Certifications et formations', certsSub: 'Les titres obtenus en chemin.', verify: 'Vérifier', credential: 'ID', none: 'Aucune certification pour le moment.',
  },
  experience: { kicker: 'expérience', title: "Là où j'ai livré" },
  contact: {
    kicker: 'contact', title: "Un problème qui mérite d'être résolu ? Parlons-en.", name: 'Nom', namePh: 'Votre nom', email: 'E-mail', emailPh: 'vous@entreprise.com',
    message: 'Message', messagePh: 'Que construisez-vous ?', send: 'Envoyer le message', sending: 'Envoi…', sentTitle: 'Message envoyé.',
    sentBody: 'Merci de votre message. Je reviendrai vers vous rapidement.', error: "Une erreur s'est produite. Veuillez réessayer.",
    info: "Vos informations ne seront utilisées que pour répondre à votre message.", available: 'Disponible',
    reply: 'Je réponds généralement sous 24 heures.', copy: 'Copier', copied: 'Copié', findMe: 'Retrouvez-moi sur', topic: 'De quoi s’agit-il ?', topics: ['Projet', 'Offre d’emploi', 'Collaboration', 'Simple bonjour'], sentKicker: 'Message envoyé', another: 'Envoyer un autre message', chars: '{n} / 4000'
  },
  blog: {
    title: 'Notes depuis le terminal.', hl: 'terminal.', sub: "Réflexions sur l'architecture, le code et l'art de livrer du logiciel.",
    filter: 'Filtrer par thème', search: 'Rechercher', searchPh: 'Tapez pour filtrer…', noMatch: 'Aucun article trouvé.', noMatchHint: 'Essayez un autre thème ou effacez la recherche.',
    featured: 'À la une', readPost: "Lire l'article", read: 'Lire', none: "Aucun article publié pour l'instant.", back: 'Tous les articles', draft: 'Aperçu du brouillon', keep: 'Continuer la lecture', notFound: 'Article introuvable',
    toc: 'Dans cet article', copy: 'Copier', copied: 'Copié', copyLink: 'Copier le lien', linkCopied: 'Lien copié', writtenBy: 'Écrit par', share: 'Partager',
  },
  templates: {
    title: 'Des bases prêtes à cloner.', hl: 'prêtes à cloner.', sub: "Des modèles et kits de projet que j'utilise moi-même, pour vous épargner la première semaine de mise en place.",
    filter: 'Filtrer par catégorie', count: '{n} modèles', get: 'Obtenir le modèle', none: 'Aucun modèle pour le moment.',
  },
};

const ar: Dict = {
  nav: { about: 'نبذة', projects: 'المشاريع', education: 'التعليم', experience: 'الخبرة', blog: 'المدوّنة', templates: 'القوالب', contact: 'تواصل', menu: 'فتح القائمة', language: 'اللغة', theme: 'تبديل المظهر' },
  c: { home: 'الرئيسية', admin: 'الإدارة', arrow: '←', back: '→', all: 'الكل', minRead: '{n} د للقراءة', min: '{n} د' },
  hero: {
    viewProjects: 'عرض المشاريع', getInTouch: 'تواصل معي', available: 'متاح لمشاريع جديدة', unavailable: 'غير متاح حاليًا',
    openTo: 'منفتح على: {v}', badge: 'OPEN FOR WORK · OPEN FOR WORK · ',
  },
  about: {
    kicker: 'نبذة', heading: 'أحب الأشياء الصغيرة جيدة التسمية والواجهات التي لا يحتاج أحد إلى التفكير فيها.', headingHl: 'جيدة التسمية',
    based: 'مقيم في', langs: 'اللغات', currently: 'حاليًا', openTo: 'منفتح على', noPhoto: 'أضف صورتك من الإدارة › الملف الشخصي', alt: 'صورة {name}',
    competences: 'الكفاءات الأساسية', hint: 'مرّر للتسريع، وضع المؤشر للإبطاء',
  },
  projects: { kicker: 'المشاريع', title: 'أعمال مختارة', filter: 'تصفية المشاريع', none: 'لا توجد مشاريع بعد.', live: 'عرض مباشر', code: 'الشيفرة المصدرية', more: 'عرض {n} مشاريع أخرى', less: 'عرض أقل', prev: 'المشروع السابق', next: 'المشروع التالي' },
  education: {
    kicker: 'المسار الأكاديمي', title: 'حيث تعلّمت الأساسيات', snapshot: 'لمحة سريعة', timeline: 'الجدول الزمني', degrees: 'الشهادات الجامعية', certs: 'الشهادات المهنية', years: 'سنوات الدراسة', degree: 'شهادة',
    certsTitle: 'الشهادات والدورات', certsSub: 'اعتمادات حصلت عليها في الطريق.', verify: 'تحقّق', credential: 'المعرّف', none: 'لا توجد شهادات بعد.',
  },
  experience: { kicker: 'الخبرة', title: 'حيث أطلقت مشاريعي' },
  contact: {
    kicker: 'تواصل', title: 'لديك مشكلة تستحق الحل؟ لنتحدث.', name: 'الاسم', namePh: 'اسمك', email: 'البريد الإلكتروني', emailPh: 'you@company.com',
    message: 'الرسالة', messagePh: 'ماذا تبني؟', send: 'إرسال الرسالة', sending: 'جارٍ الإرسال…', sentTitle: 'تم إرسال الرسالة.',
    sentBody: 'شكرًا لتواصلك. سأردّ عليك قريبًا.', error: 'حدث خطأ ما. حاول مرة أخرى.',
    info: 'لن تُستخدم معلوماتك إلا للرد على رسالتك.', available: 'متاح',
    reply: 'أردّ عادةً خلال 24 ساعة.', copy: 'نسخ', copied: 'تم النسخ', findMe: 'تجدني على', topic: 'ما موضوع رسالتك؟', topics: ['مشروع', 'عرض عمل', 'تعاون', 'مجرد سلام'], sentKicker: 'تم الإرسال', another: 'إرسال رسالة أخرى', chars: '{n} / 4000'
  },
  blog: {
    title: 'ملاحظات من الطرفية.', hl: 'الطرفية.', sub: 'كتابات عن الهندسة المعمارية والشيفرة وحرفة إطلاق البرمجيات.',
    filter: 'تصفية حسب الموضوع', search: 'ابحث في المقالات', searchPh: 'اكتب للتصفية…', noMatch: 'لا توجد مقالات مطابقة.', noMatchHint: 'جرّب موضوعًا آخر أو امسح البحث.',
    featured: 'مميّز', readPost: 'اقرأ المقال', read: 'اقرأ', none: 'لا توجد مقالات منشورة بعد.', back: 'كل المقالات', draft: 'معاينة مسودة', keep: 'تابع القراءة', notFound: 'المقال غير موجود',
    toc: 'في هذا المقال', copy: 'نسخ', copied: 'تم النسخ', copyLink: 'نسخ الرابط', linkCopied: 'تم نسخ الرابط', writtenBy: 'بقلم', share: 'مشاركة',
  },
  templates: {
    title: 'قوالب جاهزة للنسخ.', hl: 'جاهزة للنسخ.', sub: 'قوالب وأطقم مشاريع أستخدمها بنفسي، لتتجاوز أسبوع الإعداد الأول.',
    filter: 'تصفية حسب الفئة', count: '{n} قوالب', get: 'احصل على القالب', none: 'لا توجد قوالب بعد.',
  },
};

export const DICTS: Record<Locale, Dict> = { en, fr, ar };
