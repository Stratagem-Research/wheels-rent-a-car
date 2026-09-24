/**
 * Arabic + French translations for the file-based long-form content
 * (help articles in lib/content/help.ts and legal articles in
 * lib/content/legal.ts).
 *
 * Keyed by article slug. `title` + `intro` are localized, and each section's
 * `heading` / `body` is keyed by the section id. `localizeArticle` overlays
 * these onto the English source with per-field fallback, so anything left
 * untranslated still renders in English.
 */

export type SectionT = { heading: string; body: string };
export type ArticleT = {
  title: string;
  intro: string;
  sections: Record<string, SectionT>;
};
export type ArticleLocales = { ar: ArticleT; fr: ArticleT };

type SourceSection = { id: string; heading: string; body: string };
type SourceArticle = {
  slug: string;
  title: string;
  intro: string;
  sections: SourceSection[];
};

/**
 * Overlay AR/FR onto an English source article for the active locale.
 * Returns a shallow clone with localized title/intro/section heading+body.
 */
export function localizeArticle<T extends SourceArticle>(
  article: T,
  overlays: Record<string, ArticleLocales>,
  locale: string,
): T {
  if (locale !== "ar" && locale !== "fr") return article;
  const o = overlays[article.slug]?.[locale];
  if (!o) return article;
  return {
    ...article,
    title: o.title || article.title,
    intro: o.intro || article.intro,
    sections: article.sections.map((s) => {
      const st = o.sections[s.id];
      return st ? { ...s, heading: st.heading || s.heading, body: st.body || s.body } : s;
    }),
  };
}

/** Help-article translations (lib/content/help.ts). */
export const HELP_ARTICLE_T: Record<string, ArticleLocales> = {
  "rental-terms": {
    ar: {
      title: "شروط الإيجار",
      intro: "كل ما توافق عليه عند الاستئجار من Wheels, مبسّطاً بلغة واضحة.",
      sections: {
        intro: {
          heading: "مقدمة",
          body: "تنطبق هذه الشروط على كل إيجار يُحجز عبر Wheels Rent A Car SAL. وهي مكمّلة للاتفاق الموقّع عند الاستلام؛ وفي حال التعارض، يُعتمَد اتفاق يوم الاستلام.",
        },
        "who-can-rent": {
          heading: "من يمكنه الاستئجار",
          body: "السائقون بعمر 25 فأكثر ممن يحملون رخصة منذ سنة على الأقل. ويمكن لمن هم بين 21 و24 استئجار الفئتين الاقتصادية والمدمجة مع إضافة السائق الأصغر سناً. تُقبَل الرخص الأجنبية بالأحرف اللاتينية؛ وإلا تُطلب رخصة قيادة دولية.",
        },
        documents: {
          heading: "المستندات المطلوبة",
          body: "رخصة قيادة سارية، وجواز سفر أو هوية وطنية، وبطاقة ائتمان للتأمين عند الاستلام.",
        },
        mileage: {
          heading: "الكيلومترات",
          body: "تشمل الإيجارات إما 200 كم/يومياً (1000 كم/أسبوعياً) أو كيلومترات غير محدودة. تُحتسب الكيلومترات الزائدة في الباقات المحدودة بـ 0.10$ للكيلومتر.",
        },
        fuel: {
          heading: "الوقود",
          body: "يجب إعادة السيارات بمستوى الوقود نفسه الذي استُلمت به. تتوفّر خدمة إعادة التزويد كإضافة إن كنت تفضّل تجاوز التوقّف عند المحطة.",
        },
        damages: {
          heading: "الأضرار",
          body: "تُحتسب الأضرار غير المغطّاة بفئة حمايتك حتى مبلغ التحمّل زائد رسم إداري 50$. نوثّق كل ضرر بالصور عند الاستلام والإرجاع.",
        },
        disputes: {
          heading: "النزاعات",
          body: "نسعى لحلّ المشكلات مباشرةً عبر واتساب أو الهاتف. أما النزاعات الرسمية فتخضع للقانون اللبناني وتُحَلّ في محاكم بيروت.",
        },
      },
    },
    fr: {
      title: "Conditions de location",
      intro: "Tout ce que vous acceptez en louant chez Wheels, expliqué simplement.",
      sections: {
        intro: {
          heading: "Introduction",
          body: "Ces conditions s'appliquent à chaque location réservée via Wheels Rent A Car SAL. Elles complètent le contrat signé au retrait ; en cas de conflit, le contrat du jour prévaut.",
        },
        "who-can-rent": {
          heading: "Qui peut louer",
          body: "Conducteurs de 25 ans et plus titulaires d'un permis depuis au moins un an. Les 21–24 ans peuvent louer les catégories économique et compacte avec le supplément jeune conducteur. Les permis étrangers en caractères latins sont acceptés ; sinon un permis de conduire international est requis.",
        },
        documents: {
          heading: "Documents requis",
          body: "Un permis de conduire valide, un passeport ou une carte d'identité, et une carte de crédit pour la caution au retrait.",
        },
        mileage: {
          heading: "Kilométrage",
          body: "Les locations incluent soit 200 km/jour (1 000 km/semaine) soit un kilométrage illimité. Les kilomètres excédentaires sur les tarifs plafonnés sont facturés 0,10 $/km.",
        },
        fuel: {
          heading: "Carburant",
          body: "Les voitures doivent être rendues avec le même niveau de carburant qu'à la prise en charge. Un service de plein est proposé en option si vous préférez éviter l'arrêt à la station.",
        },
        damages: {
          heading: "Dommages",
          body: "Les dommages non couverts par votre formule de protection sont facturés jusqu'au montant de la franchise, plus des frais administratifs de 50 $. Nous documentons chaque dommage par photos au retrait et au retour.",
        },
        disputes: {
          heading: "Litiges",
          body: "Nous cherchons à résoudre les problèmes directement par WhatsApp ou téléphone. Les litiges formels sont régis par le droit libanais et tranchés par les tribunaux de Beyrouth.",
        },
      },
    },
  },
  "insurance-and-coverage": {
    ar: {
      title: "التأمين والتغطية",
      intro:
        "ثلاث فئات حماية، وما تغطّيه كل منها، وكيفية الاختيار. اختر عند الحجز؛ ورقِّ عند الاستلام؛ ولا تخفّض أثناء الإيجار.",
      sections: {
        "what-is-deductible": {
          heading: "ما هو التحمّل؟",
          body: "هو أقصى مبلغ تدفعه من جيبك مقابل الأضرار، مهما بلغت كلفة الإصلاح الفعلية. الأساسي 800$. وSmart يخفضه إلى 250$. وAll-inclusive يجعله 0$.",
        },
        tiers: {
          heading: "فئاتنا الثلاث",
          body: "الأساسية مشمولة مع كل إيجار, مسؤولية تجاه الغير + أضرار الاصطدام بتحمّل 800$. وSmart يضيف تغطية الإطارات والزجاج الأمامي، وفتح القفل، والأمتعة الشخصية حتى 500$. وAll-inclusive يلغي التحمّل بالكامل ويرفع تغطية الأمتعة إلى 2000$.",
        },
        "what-is-not-covered": {
          heading: "ما هو غير مغطّى",
          body: "مخالفات السير، وأضرار الطرق الوعرة، وأخطاء التزويد بالوقود، والأضرار المتعمّدة غير مغطّاة أبداً. القيادة تحت التأثير تُلغي كل حماية. القيادة عبر الحدود تتطلّب إضافة تصريح العبور.",
        },
        claims: {
          heading: "كيف تعمل المطالبات",
          body: "إن حدث شيء، وثّق المكان بالصور، واحصل على تقرير شرطة إن لزم، وراسلنا فوراً عبر واتساب. سنرشدك إلى الخطوات التالية من هناك.",
        },
      },
    },
    fr: {
      title: "Assurance & couverture",
      intro:
        "Trois formules de protection, ce que chacune couvre, et comment choisir. Choisissez à la réservation ; surclassez au retrait ; ne rétrogradez jamais en cours de location.",
      sections: {
        "what-is-deductible": {
          heading: "Qu'est-ce qu'une franchise ?",
          body: "C'est le montant maximum que vous paieriez de votre poche pour des dommages, quel que soit le coût réel des réparations. Basic : 800 $. Smart la réduit à 250 $. All-inclusive : 0 $.",
        },
        tiers: {
          heading: "Nos trois formules",
          body: "Basic est incluse avec chaque location, responsabilité au tiers + dommages collision avec franchise de 800 $. Smart ajoute la couverture pneus + pare-brise, l'ouverture en cas de clés enfermées, et les effets personnels jusqu'à 500 $. All-inclusive supprime entièrement la franchise et porte les effets personnels à 2 000 $.",
        },
        "what-is-not-covered": {
          heading: "Ce qui n'est pas couvert",
          body: "Les infractions au code de la route, les dommages hors route, les erreurs de carburant et les dommages volontaires ne sont jamais couverts. La conduite sous influence annule toute protection. La conduite transfrontalière nécessite l'option permis transfrontalier.",
        },
        claims: {
          heading: "Comment fonctionnent les réclamations",
          body: "En cas d'incident, documentez la scène par des photos, obtenez un constat de police si nécessaire, et écrivez-nous immédiatement sur WhatsApp. Nous vous guiderons ensuite pour la suite.",
        },
      },
    },
  },
  "payment-and-deposits": {
    ar: {
      title: "الدفع والودائع",
      intro:
        "دفع مهيّأ للبنان: بطاقة، نقداً، حوالة مصرفية، OMT/Whish/Bob Finance. الوديعة قابلة للاسترداد دائماً.",
      sections: {
        methods: {
          heading: "طرق الدفع",
          body: "تُعالَج بطاقات Visa وMastercard وAmex عبر Areeba (متوافقة مع PCI). يُقبَل الدفع نقداً عند الاستلام بالدولار أو الليرة. وتتوفّر أيضاً الحوالة المصرفية وOMT/Whish/Bob Finance؛ نُبقي الحجز قيد الانتظار حتى التحقّق.",
        },
        "when-charged": {
          heading: "متى يتم الخصم",
          body: "تُخصم مدفوعات البطاقة عند الحجز. وتُحصَّل الحجوزات النقدية عند الاستلام. وتُؤكَّد حجوزات الحوالة وOMT بمجرد التحقّق من الإيصال, عادةً خلال 24 ساعة (حوالة) أو 4 ساعات (OMT).",
        },
        deposit: {
          heading: "تأمين الضمان",
          body: "نحتجز وديعة قابلة للاسترداد على بطاقتك عند الاستلام. يختلف المبلغ حسب الفئة, 300$ اقتصادية، 500$ سيدان، 750$ دفع رباعي، 1500$ فاخرة. ويُحرَّر بعد فحص الإرجاع.",
        },
        refunds: {
          heading: "المبالغ المستردّة",
          body: "تُسوّى مبالغ ردّ البطاقة خلال 3 إلى 10 أيام عمل. الحجوزات النقدية لا استرداد لها, لم نخصم منك شيئاً. أما الحجوزات قيد الانتظار التي تُلغى قبل التحقّق فلا تُتبادَل فيها أيّ أموال.",
        },
      },
    },
    fr: {
      title: "Paiement & cautions",
      intro:
        "Paiement adapté au Liban : carte, espèces, virement bancaire, OMT/Whish/Bob Finance. La caution est toujours remboursable.",
      sections: {
        methods: {
          heading: "Moyens de paiement",
          body: "Visa, Mastercard et Amex sont traités par Areeba (conforme PCI). Les espèces au retrait sont acceptées en USD ou LBP. Le virement bancaire et OMT/Whish/Bob Finance sont aussi disponibles ; la réservation reste En attente jusqu'à vérification.",
        },
        "when-charged": {
          heading: "Quand vous êtes débité",
          body: "Les paiements par carte sont capturés à la réservation. Les réservations en espèces sont réglées au retrait. Les réservations par virement et OMT sont confirmées dès vérification du reçu, généralement sous 24h (virement) ou 4h (OMT).",
        },
        deposit: {
          heading: "La caution",
          body: "Nous bloquons une caution remboursable sur votre carte au retrait. Le montant varie selon la catégorie, 300 $ économique, 500 $ berline, 750 $ SUV, 1 500 $ luxe. Elle est libérée après l'inspection au retour.",
        },
        refunds: {
          heading: "Remboursements",
          body: "Les remboursements par carte arrivent en 3 à 10 jours ouvrés. Les réservations en espèces n'ont pas de remboursement, nous ne vous avons jamais débité. Pour les réservations En attente annulées avant vérification, aucun fonds n'est échangé.",
        },
      },
    },
  },
  "cancellation-policy": {
    ar: {
      title: "سياسة الإلغاء",
      intro:
        "مجاني حتى 7 أيام قبل الاستلام. خلال 7 أيام تُطبَّق رسوم بقيمة يوم واحد. أسعار «أفضل سعر» غير قابلة للاسترداد إلا حيث يفرض القانون اللبناني ذلك.",
      sections: {
        "free-window": {
          heading: "نافذة الإلغاء المجاني",
          body: "ألغِ حتى 7 أيام قبل الاستلام ونعيد المبلغ كاملاً. التعديلات (تغيير التاريخ أو الموقع) مجانية ضمن النافذة نفسها.",
        },
        "within-7d": {
          heading: "خلال 7 أيام من الاستلام",
          body: "تُطبَّق رسوم بقيمة يوم واحد. نتنازل عنها في حالات اضطراب السفر الموثّقة (رحلات ملغاة، طقس قاسٍ), راسلنا مع إثبات وسنراجع الأمر.",
        },
        "best-price": {
          heading: "سعر «أفضل سعر»",
          body: "أسعار «أفضل سعر» غير قابلة للاسترداد بطبيعتها. اختر السعر المرن عند الحجز إن أردت حقوق إلغاء كاملة.",
        },
        "how-to-cancel": {
          heading: "كيفية الإلغاء",
          body: "سجّل الدخول وافتح الحجز، أو استخدم «إدارة الحجز» برقمك وبريدك الإلكتروني. يعرض كلا المسارين مبلغ الاسترداد قبل التأكيد.",
        },
      },
    },
    fr: {
      title: "Politique d'annulation",
      intro:
        "Gratuit jusqu'à 7 jours avant le retrait. Dans les 7 jours, des frais d'une journée s'appliquent. Les tarifs « Meilleur prix » sont non remboursables sauf si le droit de la consommation libanais l'exige.",
      sections: {
        "free-window": {
          heading: "Fenêtre d'annulation gratuite",
          body: "Annulez jusqu'à 7 jours avant le retrait et nous remboursons l'intégralité. Les modifications (dates ou lieu) sont gratuites dans la même fenêtre.",
        },
        "within-7d": {
          heading: "Dans les 7 jours du retrait",
          body: "Des frais d'une journée s'appliquent. Nous y renonçons en cas de perturbations de voyage documentées (vols annulés, météo sévère), écrivez-nous avec un justificatif et nous examinerons.",
        },
        "best-price": {
          heading: "Tarif « Meilleur prix »",
          body: "Les tarifs « Meilleur prix » sont non remboursables par nature. Choisissez le tarif Flexible à la réservation si vous voulez des droits d'annulation complets.",
        },
        "how-to-cancel": {
          heading: "Comment annuler",
          body: "Connectez-vous et ouvrez la réservation, ou utilisez « Gérer la réservation » avec votre référence et votre e-mail. Les deux affichent le montant du remboursement avant confirmation.",
        },
      },
    },
  },
};

/** Legal-article translations (lib/content/legal.ts). */
export const LEGAL_ARTICLE_T: Record<string, ArticleLocales> = {
  privacy: {
    ar: {
      title: "سياسة الخصوصية",
      intro:
        "كيف تجمع Wheels Rent A Car معلوماتك الشخصية وتستخدمها وتشاركها عند زيارتك لموقعنا أو حجز سيارة أو التواصل معنا عبر واتساب أو الهاتف أو البريد الإلكتروني أو شخصياً في أحد فروعنا.",
      sections: {
        "what-we-collect": {
          heading: "ما الذي نجمعه",
          body: "معلومات الهوية والتواصل (الاسم، البريد الإلكتروني، الهاتف، تاريخ الميلاد، العنوان). تفاصيل رخصة القيادة والهوية/جواز السفر لأهلية الإيجار. تفاصيل الحجز: تواريخ ومواقع الاستلام والإرجاع وتفضيلات السيارة. تُعالَج معلومات الدفع عبر مزوّد دفع متوافق مع PCI؛ ولا نخزّن أرقام البطاقات كاملة أبداً. بيانات تقنية: عنوان IP ونوع المتصفّح ومعلومات الجهاز وملفات تعريف الارتباط (انظر سياسة ملفات تعريف الارتباط).",
        },
        "how-we-use": {
          heading: "كيف نستخدم معلوماتك",
          body: "لمعالجة وتنفيذ حجوزات الإيجار. ولإرسال التأكيدات والتذكيرات والتحديثات عبر البريد الإلكتروني وواتساب (إن اخترت ذلك). وللوفاء بالتزاماتنا القانونية والتنظيمية (التأمين، مخالفات السير، الجمارك). ولتحسين خدمتنا عبر تحليلات مجمّعة وغير معرِّفة للهوية.",
        },
        sharing: {
          heading: "المشاركة",
          body: "نشارك المعلومات الشخصية فقط مع مزوّدي الخدمات اللازمين لتشغيل الإيجار (التأمين، معالجو الدفع، مزوّد واتساب Business API)، والسلطات اللبنانية عند الطلب القانوني، ونظام إدارتنا الداخلي (إدارة العلاقات والعمليات). لا نبيع البيانات الشخصية أبداً.",
        },
        "your-rights": {
          heading: "حقوقك",
          body: "يمكنك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها في أيّ وقت عبر مراسلة privacy@wheelsrentacar.com.lb. وبالنسبة لزوّار الاتحاد الأوروبي، تخضع معالجتنا لما يعادل GDPR ضمن قانون حماية البيانات اللبناني.",
        },
        retention: {
          heading: "الاحتفاظ",
          body: "تُحفَظ سجلّات الحجز لمدة 7 سنوات لأغراض الضريبة والتأمين. وتُحترَم تفضيلات التسويق إلى أجل غير مسمّى أو حتى إلغاء الاشتراك.",
        },
        contact: {
          heading: "التواصل",
          body: "أسئلة حول هذه السياسة؟ راسلنا على privacy@wheelsrentacar.com.lb أو عبر واتساب.",
        },
      },
    },
    fr: {
      title: "Politique de confidentialité",
      intro:
        "Comment Wheels Rent A Car collecte, utilise et partage vos informations personnelles lorsque vous visitez notre site, réservez une location ou interagissez avec nous via WhatsApp, téléphone, e-mail ou en personne dans l'une de nos agences.",
      sections: {
        "what-we-collect": {
          heading: "Ce que nous collectons",
          body: "Informations d'identité et de contact (nom, e-mail, téléphone, date de naissance, adresse). Détails du permis de conduire et de la pièce d'identité/passeport pour l'éligibilité. Détails de réservation : dates et lieux de retrait/retour, préférences de véhicule. Les informations de paiement sont gérées par notre prestataire conforme PCI ; nous ne stockons jamais les numéros de carte complets. Données techniques : adresse IP, type de navigateur, informations sur l'appareil, cookies (voir notre Politique de cookies).",
        },
        "how-we-use": {
          heading: "Comment nous utilisons vos informations",
          body: "Pour traiter et honorer vos réservations. Pour envoyer confirmations, rappels et mises à jour par e-mail et WhatsApp (si vous y consentez). Pour respecter nos obligations légales et réglementaires (assurance, infractions routières, douanes). Pour améliorer notre service via des analyses agrégées et non identifiantes.",
        },
        sharing: {
          heading: "Partage",
          body: "Nous ne partageons vos informations qu'avec les prestataires nécessaires à l'exploitation de la location (assurance, processeurs de paiement, fournisseur WhatsApp Business API), les autorités libanaises lorsque la loi l'exige, et notre système de gestion interne (CRM et opérations). Nous ne vendons jamais de données personnelles.",
        },
        "your-rights": {
          heading: "Vos droits",
          body: "Vous pouvez demander à tout moment l'accès, la rectification ou la suppression de vos données personnelles en écrivant à privacy@wheelsrentacar.com.lb. Pour les visiteurs de l'UE, notre traitement est régi par les équivalents du RGPD dans le cadre du droit libanais de protection des données.",
        },
        retention: {
          heading: "Conservation",
          body: "Les dossiers de réservation sont conservés 7 ans à des fins fiscales et d'assurance. Les préférences marketing sont respectées indéfiniment ou jusqu'à votre désinscription.",
        },
        contact: {
          heading: "Contact",
          body: "Des questions sur cette politique ? Écrivez à privacy@wheelsrentacar.com.lb ou contactez-nous sur WhatsApp.",
        },
      },
    },
  },
  terms: {
    ar: {
      title: "الشروط والأحكام",
      intro:
        "باستئجارك سيارة من Wheels Rent A Car SAL، فإنك توافق على هذه الشروط والأحكام. وهي مكمّلة لاتفاق الإيجار الفردي الموقّع عند الاستلام.",
      sections: {
        "who-can-rent": {
          heading: "من يمكنه الاستئجار",
          body: "الحدّ الأدنى للعمر 25 لمعظم الفئات؛ ومن 21 إلى 24 مع إضافة السائق الأصغر سناً. رخصة قيادة سارية محمولة منذ سنة على الأقل. جواز سفر أو هوية وطنية وبطاقة ائتمان للتأمين. يجب أن تكون الرخص الأجنبية بالأحرف اللاتينية؛ وإلا تُطلب رخصة قيادة دولية.",
        },
        "booking-payment": {
          heading: "الحجز والدفع",
          body: "تُخصم مدفوعات البطاقة عند الحجز. وتُسوّى مدفوعات النقد والحوالة وOMT وفق الطرق الموضّحة عند الدفع. تُحتجَز وديعة ضمان قابلة للاسترداد عند الاستلام وتُحرَّر بعد فحص الإرجاع. تبقى حجوزات الحوالة وOMT بحالة «قيد الانتظار» حتى نتحقّق من الاستلام.",
        },
        "insurance-liability": {
          heading: "التأمين والمسؤولية",
          body: "يشمل كل إيجار تأميناً أساسياً للمسؤولية تجاه الغير وأضرار الاصطدام. تقلّل الترقية إلى Smart أو All-inclusive من التحمّل أو تلغيه. السائق مسؤول عن الأضرار غير المغطّاة بالحماية المختارة، ومخالفات السير، وأيّ إخلال بشروط الإيجار.",
        },
        "mileage-fuel": {
          heading: "الكيلومترات والوقود",
          body: "تشمل الإيجارات إما كيلومترات محدودة (200 كم/يومياً، 1000 كم/أسبوعياً) أو غير محدودة حسب اختيارك. ويجب إعادة السيارات بمستوى الوقود نفسه الذي استُلمت به.",
        },
        cancellation: {
          heading: "الإلغاء",
          body: "إلغاء مجاني حتى 7 أيام قبل الاستلام. وخلال 7 أيام من الاستلام تُطبَّق رسوم بقيمة يوم واحد. أسعار «أفضل سعر» (الدفع الآن) غير قابلة للاسترداد إلا حيث يفرض قانون المستهلك اللبناني ذلك.",
        },
        damages: {
          heading: "الأضرار",
          body: "تُحتسب أضرار السيارة أو السرقة أو الفقدان غير المغطّاة بفئة الحماية المختارة على المستأجر حتى مبلغ التحمّل، زائد رسم إداري 50$.",
        },
        disputes: {
          heading: "حلّ النزاعات",
          body: "تخضع النزاعات للقانون اللبناني وتُحَلّ في محاكم بيروت. نسعى لحلّ المشكلات مباشرةً عبر واتساب أو الهاتف قبل أيّ إجراء رسمي.",
        },
        contact: {
          heading: "التواصل",
          body: "أسئلة؟ راسلنا على legal@wheelsrentacar.com.lb أو عبر واتساب.",
        },
      },
    },
    fr: {
      title: "Conditions générales",
      intro:
        "En louant un véhicule chez Wheels Rent A Car SAL, vous acceptez ces Conditions générales. Elles complètent le contrat de location individuel signé au retrait.",
      sections: {
        "who-can-rent": {
          heading: "Qui peut louer",
          body: "Âge minimum 25 ans pour la plupart des catégories ; 21–24 ans avec le supplément jeune conducteur. Un permis de conduire valide détenu depuis au moins un an. Un passeport ou une carte d'identité et une carte de crédit pour la caution. Les permis étrangers doivent être en caractères latins ; sinon un permis de conduire international est requis.",
        },
        "booking-payment": {
          heading: "Réservation et paiement",
          body: "Les paiements par carte sont débités à la réservation. Les paiements en espèces, par virement et OMT sont réglés selon les modalités décrites au paiement. Une caution remboursable est bloquée au retrait et libérée après l'inspection au retour. Les réservations par virement et OMT restent « En attente » jusqu'à vérification de la réception.",
        },
        "insurance-liability": {
          heading: "Assurance et responsabilité",
          body: "Chaque location inclut une assurance de base responsabilité au tiers et dommages collision. Les surclassements Smart ou All-inclusive réduisent ou éliminent la franchise. Le conducteur est responsable des dommages non couverts par la protection choisie, des infractions routières et de tout manquement aux conditions.",
        },
        "mileage-fuel": {
          heading: "Kilométrage et carburant",
          body: "Les locations incluent un kilométrage plafonné (200 km/jour, 1 000 km/semaine) ou illimité selon votre choix. Les voitures doivent être rendues avec le même niveau de carburant qu'à la prise en charge.",
        },
        cancellation: {
          heading: "Annulation",
          body: "Annulation gratuite jusqu'à 7 jours avant le retrait. Dans les 7 jours, des frais d'une journée s'appliquent. Les tarifs « Meilleur prix » (payer maintenant) sont non remboursables sauf si le droit de la consommation libanais l'exige.",
        },
        damages: {
          heading: "Dommages",
          body: "Les dommages au véhicule, vol ou perte non couverts par la formule de protection choisie sont facturés au locataire jusqu'au montant de la franchise, plus des frais administratifs de 50 $.",
        },
        disputes: {
          heading: "Résolution des litiges",
          body: "Les litiges sont régis par le droit libanais et tranchés par les tribunaux de Beyrouth. Nous visons à résoudre les problèmes directement via WhatsApp ou téléphone avant toute action formelle.",
        },
        contact: {
          heading: "Contact",
          body: "Des questions ? Écrivez à legal@wheelsrentacar.com.lb ou contactez-nous sur WhatsApp.",
        },
      },
    },
  },
  cookies: {
    ar: {
      title: "سياسة ملفات تعريف الارتباط",
      intro: "ما ملفات تعريف الارتباط التي نستخدمها، وكيفية إدارتها، وعلاقتها بخياراتك في الخصوصية.",
      sections: {
        "what-are-cookies": {
          heading: "ما هي ملفات تعريف الارتباط",
          body: "ملفات تعريف الارتباط هي ملفات نصية صغيرة تُخزَّن على جهازك عند زيارتك لموقع ويب. تتيح للموقع تذكّر إجراءاتك وتفضيلاتك مع مرور الوقت.",
        },
        categories: {
          heading: "الفئات التي نستخدمها",
          body: "الملفات الأساسية ضرورية لعمل الموقع (المصادقة، حفظ حالة البحث، مسار الحجز). ملفات التحليلات بيانات مجهولة نستخدمها لتحسين الموقع (Google Analytics 4، Meta Pixel), وافق عليها عبر شريط ملفات تعريف الارتباط. ملفات التسويق تُستخدَم لتخصيص الإعلانات على منصّات أخرى, وافق عليها عبر الشريط.",
        },
        managing: {
          heading: "إدارة ملفات تعريف الارتباط",
          body: "اقبل أو ارفض الملفات غير الأساسية عبر الشريط الظاهر في زيارتك الأولى، وحدّث تفضيلاتك في أيّ وقت من رابط التذييل. تتيح لك معظم المتصفّحات أيضاً حذف ملفات تعريف الارتباط أو حظرها بالكامل؛ وقد يمنع ذلك أجزاءً من الموقع من العمل.",
        },
        "third-parties": {
          heading: "ملفات الطرف الثالث",
          body: "نستخدم الأطراف الثالثة التالية، ولكل منها سياسات خصوصية خاصة: Google (Analytics وMaps)، وMeta (Pixel)، وAreeba (خدمات الدفع)، وWhatsApp (Business API).",
        },
        contact: {
          heading: "التواصل",
          body: "أسئلة؟ راسلنا على privacy@wheelsrentacar.com.lb.",
        },
      },
    },
    fr: {
      title: "Politique de cookies",
      intro:
        "Quels cookies nous utilisons, comment les gérer, et comment ils se rapportent à vos choix de confidentialité.",
      sections: {
        "what-are-cookies": {
          heading: "Que sont les cookies",
          body: "Les cookies sont de petits fichiers texte stockés sur votre appareil lorsque vous visitez un site web. Ils permettent au site de mémoriser vos actions et préférences au fil du temps.",
        },
        categories: {
          heading: "Catégories que nous utilisons",
          body: "Les cookies essentiels sont requis pour le fonctionnement du site (authentification, persistance de la recherche, tunnel de réservation). Les cookies analytiques sont des données anonymisées que nous utilisons pour améliorer le site (Google Analytics 4, Meta Pixel), à activer via la bannière. Les cookies marketing servent à personnaliser la publicité sur d'autres plateformes, à activer via la bannière.",
        },
        managing: {
          heading: "Gérer les cookies",
          body: "Acceptez ou refusez les cookies non essentiels via la bannière affichée à votre première visite, et mettez à jour vos préférences à tout moment depuis le lien en pied de page. La plupart des navigateurs permettent aussi de supprimer ou bloquer entièrement les cookies ; cela peut empêcher certaines parties du site de fonctionner.",
        },
        "third-parties": {
          heading: "Cookies tiers",
          body: "Nous utilisons les tiers suivants, chacun avec sa propre politique de confidentialité : Google (Analytics, Maps), Meta (Pixel), Areeba (services de paiement), WhatsApp (Business API).",
        },
        contact: {
          heading: "Contact",
          body: "Des questions ? Écrivez à privacy@wheelsrentacar.com.lb.",
        },
      },
    },
  },
};

/**
 * Build a domain `HelpArticle` (LocalizedString fields) from the English
 * fixture in `lib/content/help.ts`, overlaid with the AR/FR translations
 * held in `HELP_ARTICLE_T`. Used as the fallback when a help article is not
 * yet managed in the CMS — gives the marketing page a single render path
 * that consumes `HelpArticle` whether the source is CMS or fixture.
 */
export function buildLocalizedHelpArticle(
  slug: string,
  fixture:
    | {
        slug: string;
        title: string;
        lastUpdated: string;
        intro: string;
        sections: { id: string; heading: string; body: string }[];
      }
    | undefined,
): import("@/types/domain").HelpArticle | null {
  if (!fixture) return null;
  const overlays = HELP_ARTICLE_T[slug];
  const ar = overlays?.ar;
  const fr = overlays?.fr;
  return {
    slug: fixture.slug,
    title: { en: fixture.title, ar: ar?.title, fr: fr?.title },
    intro: { en: fixture.intro, ar: ar?.intro, fr: fr?.intro },
    lastUpdated: fixture.lastUpdated,
    sections: fixture.sections.map((s) => ({
      id: s.id,
      heading: {
        en: s.heading,
        ar: ar?.sections[s.id]?.heading,
        fr: fr?.sections[s.id]?.heading,
      },
      body: {
        en: s.body,
        ar: ar?.sections[s.id]?.body,
        fr: fr?.sections[s.id]?.body,
      },
    })),
  };
}
