/**
 * Arabic + French translations for the CMS seed content.
 *
 * Keyed by the stable id/slug used in seed-data.ts. Applied over the English
 * defaults so AR/FR locales show real translated content instead of an
 * English fallback. Any key left out simply falls back to English.
 */

export type LocaleText = { ar: string; fr: string };
export type LocaleList = { ar: string[]; fr: string[] };

/** FAQ entry translations, keyed by entry id. */
export const FAQ_T: Record<string, { question: LocaleText; answer: LocaleText }> = {
  "f-b-1": {
    question: { ar: "كيف أحجز سيارة؟", fr: "Comment réserver une voiture ?" },
    answer: {
      ar: "استخدم شريط البحث في الصفحة الرئيسية لاختيار التواريخ والموقع، ثم اختر سيارة وأكمل الدفع. تستغرق العملية بأكملها أقل من 90 ثانية.",
      fr: "Utilisez la barre de recherche de la page d'accueil pour choisir les dates et le lieu, sélectionnez une voiture et finalisez le paiement. Le tout prend moins de 90 secondes.",
    },
  },
  "f-b-2": {
    question: { ar: "هل يمكنني الحجز بدون حساب؟", fr: "Puis-je réserver sans compte ?" },
    answer: {
      ar: "نعم. يعمل الدفع كضيف طوال مسار الحجز. أنشئ حساباً في النهاية إذا أردت حفظ بياناتك للمرة القادمة.",
      fr: "Oui. Le paiement en tant qu'invité fonctionne pour tout le parcours. Créez un compte à la fin si vous souhaitez enregistrer vos informations.",
    },
  },
  "f-b-3": {
    question: { ar: "هل يمكنني الحجز لشخص آخر؟", fr: "Puis-je réserver pour quelqu'un d'autre ?" },
    answer: {
      ar: "نعم. أدخل بياناته كسائق. يجب أن يكون السائق الأساسي حاضراً عند الاستلام برخصة سارية.",
      fr: "Oui. Saisissez ses informations comme conducteur. Le conducteur principal doit être présent au retrait avec un permis valide.",
    },
  },
  "f-b-4": {
    question: { ar: "قبل كم من الوقت يمكنني الحجز؟", fr: "Combien de temps à l'avance puis-je réserver ?" },
    answer: {
      ar: "حتى 11 شهراً مقدماً. للاستلام في اليوم نفسه، اتصل بنا, سنؤكّد عبر واتساب.",
      fr: "Jusqu'à 11 mois à l'avance. Pour un retrait le jour même, appelez-nous, nous confirmons par WhatsApp.",
    },
  },
  "f-p-1": {
    question: { ar: "أين أستلم السيارة؟", fr: "Où récupérer la voiture ?" },
    answer: {
      ar: "في مركزنا بحازمية (Gallery Semaan، مقابل Sea Sweet) أو عبر التوصيل إلى أيّ عنوان في بيروت الكبرى, بما في ذلك مطار بيروت.",
      fr: "À notre hub de Hazmieh (Gallery Semaan, face à Sea Sweet) ou par livraison à toute adresse du Grand Beyrouth, y compris l'aéroport de Beyrouth.",
    },
  },
  "f-p-2": {
    question: { ar: "ما أوقات الاستلام والإرجاع؟", fr: "À quelle heure puis-je récupérer ou rendre ?" },
    answer: {
      ar: "مركزنا مفتوح 08:00–20:00 من الإثنين إلى السبت و10:00–16:00 يوم الأحد. للاستلام خارج هذه الأوقات، راسلنا عبر واتساب, سنرتّب الأمر.",
      fr: "Notre hub est ouvert de 08:00 à 20:00 du lundi au samedi et de 10:00 à 16:00 le dimanche. En dehors de ces horaires, écrivez-nous sur WhatsApp, nous nous arrangerons.",
    },
  },
  "f-p-3": {
    question: { ar: "هل يمكنكم لقائي في المطار؟", fr: "Pouvez-vous me retrouver à l'aéroport ?" },
    answer: {
      ar: "نعم. اختر التوصيل وأدخل المطار, نتتبّع رحلتك ونلتقي بك عند الوصول. التأخير حتى 90 دقيقة مجاني.",
      fr: "Oui. Choisissez la livraison et indiquez l'aéroport, nous suivons votre vol et vous accueillons aux arrivées. Jusqu'à 90 minutes de retard sont gratuites.",
    },
  },
  "f-p-4": {
    question: { ar: "هل يمكنني الإرجاع في موقع مختلف؟", fr: "Puis-je rendre la voiture à un autre endroit ?" },
    answer: {
      ar: "نعم. اضغط على «موقع إرجاع مختلف» في شريط البحث. قد تُطبَّق رسوم بسيطة للاتجاه الواحد.",
      fr: "Oui. Touchez « Lieu de retour différent » dans la barre de recherche. De petits frais d'aller simple peuvent s'appliquer.",
    },
  },
  "f-pa-1": {
    question: { ar: "ما طرق الدفع التي تقبلونها؟", fr: "Quels moyens de paiement acceptez-vous ?" },
    answer: {
      ar: "Visa وMastercard وAmex، والدفع نقداً عند الاستلام (دولار أو ليرة)، والحوالة المصرفية، وOMT/Whish/Bob Finance.",
      fr: "Visa, Mastercard, Amex, espèces au retrait (USD ou LBP), virement bancaire, et OMT/Whish/Bob Finance.",
    },
  },
  "f-pa-2": {
    question: { ar: "هل يمكنني الدفع نقداً؟", fr: "Puis-je payer en espèces ?" },
    answer: {
      ar: "نعم. الدفع نقداً عند الاستلام مقبول في كل فرع بالدولار أو الليرة. يُطلب تأمين قابل للاسترداد عند المكتب.",
      fr: "Oui. Le paiement en espèces au retrait est accepté dans chaque agence, en USD ou LBP. Une caution remboursable est requise au comptoir.",
    },
  },
  "f-pa-3": {
    question: { ar: "ما هو التأمين (الوديعة)؟", fr: "Quel est le montant de la caution ?" },
    answer: {
      ar: "قابلة للاسترداد، وتختلف حسب فئة السيارة, عادةً 300$ للاقتصادية وحتى 1500$ للفاخرة. تُحرَّر بعد فحص الإرجاع.",
      fr: "Remboursable, elle varie selon la catégorie, généralement 300$ pour l'économique, jusqu'à 1 500$ pour le luxe. Libérée après l'inspection au retour.",
    },
  },
  "f-pa-4": {
    question: { ar: "متى يتم خصم المبلغ؟", fr: "Quand suis-je débité ?" },
    answer: {
      ar: "تُخصم مدفوعات البطاقة عند الحجز. وتُحصَّل الحجوزات النقدية عند الاستلام. وتُؤكَّد الحوالة وOMT بمجرد التحقّق من الإيصال.",
      fr: "Les paiements par carte sont débités à la réservation. Les réservations en espèces sont réglées au retrait. Virement et OMT sont confirmés dès vérification du reçu.",
    },
  },
  "f-pa-5": {
    question: { ar: "هل تقبلون الليرة اللبنانية؟", fr: "Acceptez-vous la livre libanaise ?" },
    answer: {
      ar: "نعم، حسب السعر اليومي. نعرض الأسعار بالدولار للوضوح.",
      fr: "Oui, au taux du jour. Nous affichons les prix en USD pour plus de clarté.",
    },
  },
  "f-i-1": {
    question: { ar: "هل التأمين مشمول؟", fr: "L'assurance est-elle incluse ?" },
    answer: {
      ar: "نعم. يشمل كل إيجار تأميناً أساسياً ضد الغير وضد الاصطدام. يمكنك الترقية إلى Smart أو All-inclusive عند الحجز.",
      fr: "Oui. Chaque location inclut une assurance de base au tiers et collision. Vous pouvez passer à Smart ou All-inclusive à la réservation.",
    },
  },
  "f-i-2": {
    question: { ar: "ماذا يغطّي التحمّل؟", fr: "Que couvre la franchise ?" },
    answer: {
      ar: "هو الحدّ الأقصى الذي تدفعه في حال وقوع ضرر. الأساسي 800$، وSmart 250$، وAll-inclusive 0$.",
      fr: "C'est le montant maximum que vous paieriez en cas de dommage. Basic 800$, Smart 250$, All-inclusive 0$.",
    },
  },
  "f-i-3": {
    question: { ar: "هل يمكنني شراء حماية إضافية؟", fr: "Puis-je acheter une protection supplémentaire ?" },
    answer: {
      ar: "نعم، في أيّ وقت خلال الحجز. يمكنك أيضاً الترقية عند المكتب وقت الاستلام.",
      fr: "Oui, à tout moment pendant la réservation. Vous pouvez aussi surclasser au comptoir lors du retrait.",
    },
  },
  "f-d-1": {
    question: { ar: "ما الحدّ الأدنى للعمر؟", fr: "Quel est l'âge minimum ?" },
    answer: {
      ar: "25 لمعظم السيارات. يمكن للسائقين من 21 إلى 24 استئجار الفئتين الاقتصادية والمدمجة مع إضافة السائق الأصغر سناً.",
      fr: "25 ans pour la plupart des voitures. Les conducteurs de 21 à 24 ans peuvent louer les catégories économique et compacte avec l'option jeune conducteur.",
    },
  },
  "f-d-2": {
    question: { ar: "ما المستندات التي أحتاجها؟", fr: "Quels documents me faut-il ?" },
    answer: {
      ar: "رخصة قيادة سارية (صادرة منذ سنة على الأقل)، وجواز سفر أو هوية وطنية، وبطاقة ائتمان.",
      fr: "Un permis de conduire valide (détenu depuis ≥ 1 an), un passeport ou une carte d'identité, et une carte de crédit.",
    },
  },
  "f-d-3": {
    question: { ar: "هل تُقبَل الرخصة الدولية؟", fr: "Un permis international est-il accepté ?" },
    answer: {
      ar: "تُقبَل الرخص الأجنبية بالأحرف اللاتينية. وللرخص بغير اللاتينية يلزم رخصة قيادة دولية.",
      fr: "Les permis étrangers en caractères latins sont acceptés. Pour les permis non latins, un permis de conduire international est requis.",
    },
  },
  "f-d-4": {
    question: { ar: "هل يمكنني إضافة سائق إضافي؟", fr: "Puis-je ajouter un conducteur supplémentaire ?" },
    answer: {
      ar: "نعم, عند الحجز أو عند المكتب. يجب أن يقدّم كل سائق إضافي رخصة سارية أيضاً.",
      fr: "Oui, à la réservation ou au comptoir. Chaque conducteur supplémentaire doit aussi présenter un permis valide.",
    },
  },
  "f-c-1": {
    question: { ar: "كيف ألغي؟", fr: "Comment annuler ?" },
    answer: {
      ar: "سجّل الدخول وافتح الحجز، أو استخدم «إدارة الحجز» برقمك وبريدك الإلكتروني. كلا المسارين يتضمّن خيار الإلغاء.",
      fr: "Connectez-vous et ouvrez la réservation, ou utilisez « Gérer la réservation » avec votre référence et votre e-mail. Les deux proposent une option d'annulation.",
    },
  },
  "f-c-2": {
    question: { ar: "هل الإلغاء مجاني؟", fr: "L'annulation est-elle gratuite ?" },
    answer: {
      ar: "نعم إذا أُلغي قبل الاستلام بـ 24 ساعة على الأقل. وخلال 24 ساعة، تُطبَّق رسوم بقيمة يوم واحد.",
      fr: "Oui si annulée ≥ 24h avant le retrait. Dans les 24h, des frais d'une journée s'appliquent.",
    },
  },
  "f-c-3": {
    question: { ar: "كم يستغرق الاسترداد؟", fr: "Combien de temps prend un remboursement ?" },
    answer: {
      ar: "تستغرق مبالغ ردّ البطاقة من 3 إلى 10 أيام عمل حسب بنكك. الحجوزات النقدية لا استرداد لها (لم نخصم منك شيئاً).",
      fr: "Les remboursements par carte arrivent en 3 à 10 jours ouvrés selon votre banque. Les réservations en espèces n'ont pas de remboursement (nous ne vous avons jamais débité).",
    },
  },
  "f-w-1": {
    question: { ar: "كيف أحصل على تحديثات واتساب؟", fr: "Comment recevoir les mises à jour WhatsApp ?" },
    answer: {
      ar: "فعّل خيار «أرسلوا تحديثات حجزي عبر واتساب» عند الدفع. نؤكّد حجزك ونذكّرك قبل الاستلام بـ 24 ساعة.",
      fr: "Cochez « Envoyez mes mises à jour via WhatsApp » au paiement. Nous confirmons votre réservation et vous rappelons 24h avant le retrait.",
    },
  },
  "f-w-2": {
    question: { ar: "من يردّ على واتساب؟", fr: "Qui répond sur WhatsApp ?" },
    answer: {
      ar: "أشخاص حقيقيون من فريق العمليات لدينا. على مدار الساعة.",
      fr: "De vraies personnes de notre équipe opérationnelle. 24/7.",
    },
  },
  "f-w-3": {
    question: { ar: "هل واتساب متاح 24/7؟", fr: "WhatsApp est-il disponible 24/7 ?" },
    answer: {
      ar: "نعم. متوسط وقت الردّ أقل من دقيقتين خلال ساعات العمل، وأقل من 10 دقائق ليلاً.",
      fr: "Oui. Le temps de réponse médian est inférieur à 2 minutes en journée, moins de 10 minutes la nuit.",
    },
  },
};

/** FAQ group title translations, keyed by group id. */
export const FAQ_GROUP_T: Record<string, LocaleText> = {
  "g-booking": { ar: "الحجز", fr: "Réservation" },
  "g-pickup": { ar: "الاستلام والإرجاع", fr: "Retrait & retour" },
  "g-payment": { ar: "الدفع", fr: "Paiement" },
  "g-insurance": { ar: "التأمين", fr: "Assurance" },
  "g-driver": { ar: "متطلبات السائق", fr: "Conditions conducteur" },
  "g-cancel": { ar: "الإلغاء", fr: "Annulation" },
  "g-wa": { ar: "واتساب", fr: "WhatsApp" },
};

/** Trip translations, keyed by slug. */
export const TRIP_T: Record<
  string,
  { title: LocaleText; excerpt: LocaleText; meta: LocaleText; alt: LocaleText; body: LocaleText; tags: LocaleList }
> = {
  "the-cedars": {
    title: { ar: "الأرز", fr: "Les Cèdres" },
    excerpt: {
      ar: "أرز مكسوّ بالثلج وأديرة وادي قاديشا في يوم كامل انطلاقاً من بيروت.",
      fr: "Des cèdres enneigés et les monastères de la vallée de la Qadisha en une journée depuis Beyrouth.",
    },
    meta: { ar: "8 ساعات · يُنصح بدفع رباعي", fr: "8h · SUV recommandé" },
    alt: { ar: "أرز مكسوّ بالثلج في شمال لبنان", fr: "Cèdres enneigés du nord du Liban" },
    body: {
      ar: `يصعد الطريق من بيروت عبر تنورين وبشري قبل أن تظهر غابة الأرز على ارتفاع 2000م. خطّط لتوقّف غداء في حدث الجبة للاستمتاع بإطلالة وادي قاديشا.

يتطلّب المسار في الشتاء سيارة دفع رباعي بإطارات شتوية؛ أما في الربيع والخريف فأيّ سيدان مريحة على الطرق السريعة تكفي. الغابة على بُعد مشية قصيرة من موقف السيارات، ويُفضّل زيارتها بين منتصف الصباح ومنتصف العصر حين يلامس الضوء الثلج على الأشجار العتيقة.

يجمع معظم الزوّار بين الأرز ومتحف جبران في بشري، أو جولة في التاريخ الماروني، أو استراحة قهوة عند مزار سيدة الحصن المطلّ على الوادي.`,
      fr: `La montée depuis Beyrouth traverse Tannourine et Bcharré avant que la cédraie ne se révèle à 2 000 m. Prévoyez un déjeuner à Hadath El Jebbeh pour la vue sur la vallée de la Qadisha.

En hiver, l'itinéraire exige un 4x4 ou SUV avec pneus hiver ; au printemps et en automne, une berline confortable suffit. La cédraie est à quelques pas du parking, à visiter de préférence en milieu de journée quand la lumière accroche la neige sur les arbres les plus anciens.

La plupart des visiteurs associent les Cèdres au musée Gibran de Bcharré, à un détour par l'histoire maronite, ou à une pause café au sanctuaire de Saydet El Hosn surplombant la vallée.`,
    },
    tags: { ar: ["جبال", "رحلة يومية", "مناظر خلّابة"], fr: ["montagnes", "excursion", "panoramique"] },
  },
  "baalbek-anjar": {
    title: { ar: "بعلبك وعنجر", fr: "Baalbek & Anjar" },
    excerpt: {
      ar: "معابد رومانية في بعلبك ومدينة عنجر الأموية, ثنائية في سهل البقاع.",
      fr: "Les temples romains de Baalbek et la cité palatiale omeyyade d'Anjar, un duo dans la plaine de la Bekaa.",
    },
    meta: { ar: "9 ساعات · يُنصح بسيدان", fr: "9h · Berline recommandée" },
    alt: { ar: "آثار رومانية في بعلبك بسهل البقاع", fr: "Ruines romaines de Baalbek dans la Bekaa" },
    body: {
      ar: `معبد جوبيتر في بعلبك هو أكبر معبد روماني بُني على الإطلاق, أعمدته الستة القائمة يبلغ ارتفاعها 22م. خصّص ساعتين للموقع، ثم قُد 40 دقيقة جنوباً إلى مدينة عنجر الأموية لأطلال أهدأ لكنها لا تقلّ أهمية.

سهل البقاع بين الموقعين هو بلاد النبيذ: شاتو كسارة ودومين واردي وشاتو كفريا تقدّم جميعها زيارات للأقبية وتذوّقاً إن حجزت مسبقاً. يضيف كثير من المسافرين غداءً بقاعياً (مزة في تاولات عميق) قبل العودة إلى بيروت عبر ضهر البيدر.

سيدان مريحة تتولّى المسار جيداً, فالبقاع مستوٍ في معظمه بعد تجاوز ممرّ الجبل.`,
      fr: `Le temple de Jupiter à Baalbek est le plus grand temple romain jamais construit, ses six colonnes debout font 22 m de haut. Comptez deux heures sur le site, puis roulez 40 minutes au sud jusqu'à la cité palatiale omeyyade d'Anjar, une ruine plus calme mais tout aussi remarquable.

La Bekaa entre les deux est une région viticole : Château Ksara, Domaine Wardy et Château Kefraya proposent visites de caves et dégustations sur réservation. Beaucoup ajoutent un déjeuner dans la Bekaa (mezzé à Tawlet Ammiq) avant de revenir à Beyrouth par le col de Dahr el Baidar.

Une berline confortable convient bien, la Bekaa est en grande partie plate une fois le col franchi.`,
    },
    tags: { ar: ["تاريخ", "نبيذ", "البقاع"], fr: ["histoire", "vin", "bekaa"] },
  },
  "tyre-sidon": {
    title: { ar: "صور وصيدا", fr: "Tyr & Saïda" },
    excerpt: {
      ar: "موانئ فينيقية وأسواق مملوكية وغداء بحري في ميناء صور القديم, الساحل الجنوبي في يوم.",
      fr: "Ports phéniciens, souks mamelouks et déjeuner de fruits de mer au vieux port de Tyr, la côte sud en une journée.",
    },
    meta: { ar: "8 ساعات · يُنصح بسيدان", fr: "8h · Berline recommandée" },
    alt: { ar: "قرية ساحلية في جنوب لبنان بين صور وصيدا", fr: "Village côtier du sud du Liban entre Tyr et Saïda" },
    body: {
      ar: `يبدأ المسار من قلعة البحر في صيدا وخان الفرنج؛ ويُختَتم بحلبة سباق الخيل الرومانية والمدافن في صور المدرجة على لائحة اليونسكو. الطريق جنوباً عبارة عن طريق ساحلي مريح بمسارين مع مطاعم سمك متكرّرة إن أردت إطالة الغداء.

سيدان تتولّى المسار بسهولة. وإن كان لديك يوم إضافي، أضِف مغدوشة (مزار سيدة المنطرة) في طريق العودة لإطلالة ساحل صيدا.`,
      fr: `Le château de la Mer de Saïda et le caravansérail Khan El Franj ouvrent l'itinéraire ; l'hippodrome romain et la nécropole de Tyr, classés à l'UNESCO, le referment. La route vers le sud est une côtière à deux voies, jalonnée de restaurants de poisson si vous voulez prolonger le déjeuner.

Une berline parcourt facilement l'itinéraire. Avec une journée de plus, ajoutez Maghdouché (sanctuaire de Notre-Dame de Mantara) au retour pour la vue sur la côte de Saïda.`,
    },
    tags: { ar: ["ساحل", "تاريخ", "الجنوب"], fr: ["côte", "histoire", "sud"] },
  },
  "byblos-batroun": {
    title: { ar: "جبيل والبترون", fr: "Byblos & Batroun" },
    excerpt: {
      ar: "أقدم مدينة مأهولة باستمرار في العالم وبلدة ساحلية بسوق قديم نابض.",
      fr: "La plus ancienne ville continûment habitée au monde et une ville balnéaire au vieux souk animé.",
    },
    meta: { ar: "7 ساعات · أيّ سيارة", fr: "7h · Toute voiture" },
    alt: { ar: "ميناء جبيل عند الساعة الذهبية", fr: "Le port de Byblos à l'heure dorée" },
    body: {
      ar: `جبيل هي أسهل رحلة يومية من بيروت, 35 دقيقة على الطريق الساحلي. يجمع الميناء الفينيقي والقلعة الصليبية والسوق القديم في ثلاث ساعات. الغداء في بيبي عبد في الميناء القديم هو الخيار الكلاسيكي.

أضِف البترون في طريق العودة: الواجهة البحرية والجدار الفينيقي وعصير ليمون حلمي هي البرنامج المعتاد.`,
      fr: `Byblos (Jbeil) est l'excursion la plus facile depuis Beyrouth, 35 minutes par la côtière. Le port phénicien, le château croisé et le vieux souk se bouclent en trois heures. Le déjeuner chez Pepe Abed dans le vieux port est le grand classique.

Ajoutez Batroun au retour : le front de mer, le mur phénicien et une limonade chez Hilmi sont au programme.`,
    },
    tags: { ar: ["ساحل", "تاريخ", "سهل"], fr: ["côte", "histoire", "facile"] },
  },
  "chouf-mountains": {
    title: { ar: "جبال الشوف", fr: "Montagnes du Chouf" },
    excerpt: {
      ar: "محمية أرز الشوف وقصر بيت الدين وقرى الدروز في قلب لبنان.",
      fr: "La réserve de cèdres du Chouf, le palais de Beiteddine et les villages druzes du cœur du Liban.",
    },
    meta: { ar: "8 ساعات · يُنصح بدفع رباعي", fr: "8h · SUV recommandé" },
    alt: { ar: "منظر جبال الشوف", fr: "Paysage des montagnes du Chouf" },
    body: {
      ar: `محمية أرز الشوف هي أكبر تجمّع للأرز في لبنان, سلسلة من المسارات تتراوح بين 30 دقيقة ومشي يوم كامل. قصر بيت الدين، على بُعد 30 دقيقة، هو أفضل قصر محفوظ من القرن التاسع عشر في البلاد ويستضيف مهرجان بيت الدين صيفاً.

الطريق مليء بالمنعطفات؛ دفع رباعي أكثر راحة، رغم أن سيدان تتولّاه في الطقس الجيد. خيارات الغداء تشمل المطاعم الموسمية في دير القمر, جرّب الكبة النيّة.`,
      fr: `La réserve de cèdres du Chouf est la plus grande cédraie du Liban, des sentiers allant de 30 minutes à une journée de marche. Le palais de Beiteddine, à 30 minutes, est le palais du XIXe siècle le mieux conservé du pays et accueille le festival de Beiteddine en été.

La route est pleine de virages ; un SUV est plus confortable, bien qu'une berline s'en sorte par beau temps. Pour le déjeuner, essayez les restaurants saisonniers de Deir el Qamar, goûtez le kibbeh nayyeh.`,
    },
    tags: { ar: ["جبال", "أرز", "تاريخ"], fr: ["montagnes", "cèdres", "histoire"] },
  },
  "qadisha-valley": {
    title: { ar: "وادي قاديشا", fr: "Vallée de la Qadisha" },
    excerpt: {
      ar: "أديرة مارونية منحوتة في وادٍ رملي, من أكثر دروب لبنان سينمائية.",
      fr: "Des monastères maronites taillés dans une gorge de grès, l'une des routes les plus cinématographiques du Liban.",
    },
    meta: { ar: "9 ساعات · يُنصح بدفع رباعي", fr: "9h · SUV recommandé" },
    alt: { ar: "أديرة وادي قاديشا", fr: "Monastères de la vallée de la Qadisha" },
    body: {
      ar: `وادي قاديشا (الوادي المقدّس) موقع تراث عالمي لليونسكو: واد رملي عميق تتناثر فيه أديرة ومحابس مارونية، لا يزال بعضها قيد الاستخدام. يتبع الطريق حافة الوادي مع عدّة نقاط إطلالة؛ ويمكن لمحبّي المشي النزول إلى الوادي نفسه في جولة نصف يوم.

اجمع بينه وبين الأرز (على بُعد 15 دقيقة) ليوم كامل في شمال لبنان. يُنصح بدفع رباعي لطريق الحافة شتاءً؛ أما صيفاً فالسيدان تكفي.`,
      fr: `La vallée de la Qadisha (vallée sainte) est inscrite au patrimoine mondial de l'UNESCO : une profonde gorge de grès parsemée de monastères et d'ermitages maronites, certains encore en activité. La route suit le rebord avec plusieurs points de vue ; les marcheurs peuvent descendre dans la vallée pour une demi-journée.

Associez-la aux Cèdres (à 15 minutes) pour une journée complète dans le nord. SUV recommandé pour la route de crête en hiver ; en été, une berline suffit.`,
    },
    tags: { ar: ["جبال", "روحاني", "الشمال"], fr: ["montagnes", "spirituel", "nord"] },
  },
};

type ScheduleT = { title: LocaleText; body?: LocaleText };

/** Itinerary translations, keyed by slug. Schedule entries map by index. */
export const ITINERARY_T: Record<
  string,
  {
    title: LocaleText;
    excerpt: LocaleText;
    duration: LocaleText;
    alt: LocaleText;
    highlights: LocaleList;
    schedule: ScheduleT[];
  }
> = {
  "cedars-of-god": {
    title: { ar: "أرز الربّ", fr: "Cèdres de Dieu" },
    excerpt: {
      ar: "الغابة التي يبلغ عمرها 6000 عام في جبال بشري، مع غداء في حدث الجبة.",
      fr: "La cédraie vieille de 6 000 ans dans les montagnes de Bcharré, avec déjeuner à Hadath El Jebbeh.",
    },
    duration: { ar: "يوم كامل · 9-10 ساعات", fr: "Journée entière · 9-10 heures" },
    alt: { ar: "غابة أرز الربّ", fr: "Cédraie des Cèdres de Dieu" },
    highlights: {
      ar: ["زيارة غابة الأرز", "توقّف غداء في بشري", "إطلالة وادي قاديشا", "متحف جبران (اختياري)"],
      fr: ["Visite de la cédraie", "Déjeuner à Bcharré", "Belvédère de la Qadisha", "Musée Gibran (optionnel)"],
    },
    schedule: [
      { title: { ar: "الاستلام من فندقك", fr: "Prise en charge à votre hôtel" }, body: { ar: "حازمية أو بيروت أو أيّ مكان في بيروت الكبرى.", fr: "Hazmieh, Beyrouth ou tout le Grand Beyrouth." } },
      { title: { ar: "توقّف قهوة في بشري", fr: "Pause café à Bcharré" }, body: { ar: "استرخِ قليلاً واستمتع بإطلالة الوادي.", fr: "Détente et vue sur la vallée." } },
      { title: { ar: "أرز الربّ", fr: "Cèdres de Dieu" }, body: { ar: "جولة مرشدة في الغابة (ساعة).", fr: "Visite guidée de la cédraie (1h)." } },
      { title: { ar: "غداء في حدث الجبة", fr: "Déjeuner à Hadath El Jebbeh" }, body: { ar: "مزة جبلية تقليدية.", fr: "Mezzé de montagne traditionnel." } },
      { title: { ar: "إطلالة قاديشا", fr: "Belvédère de la Qadisha" }, body: { ar: "توقّف للتصوير على طريق الحافة.", fr: "Arrêt photo sur la route de crête." } },
      { title: { ar: "العودة إلى الفندق", fr: "Retour à l'hôtel" } },
    ],
  },
  "baalbek-anjar-wine": {
    title: { ar: "بعلبك وعنجر ونبيذ البقاع", fr: "Baalbek, Anjar & vin de la Bekaa" },
    excerpt: {
      ar: "معابد رومانية ومدينة أموية ومعمل نبيذ في البقاع في يوم واحد.",
      fr: "Temples romains, cité omeyyade et domaine viticole de la Bekaa en une journée.",
    },
    duration: { ar: "يوم كامل · 9-10 ساعات", fr: "Journée entière · 9-10 heures" },
    alt: { ar: "معابد بعلبك الرومانية", fr: "Temples romains de Baalbek" },
    highlights: {
      ar: ["معابد بعلبك (ساعتان)", "موقع عنجر الأثري", "جولة وتذوّق في معمل نبيذ البقاع", "غداء مزة في تاولات عميق"],
      fr: ["Temples de Baalbek (2h)", "Site archéologique d'Anjar", "Visite et dégustation d'un domaine de la Bekaa", "Déjeuner mezzé à Tawlet Ammiq"],
    },
    schedule: [
      { title: { ar: "الاستلام من فندقك", fr: "Prise en charge à votre hôtel" } },
      { title: { ar: "الوصول إلى بعلبك", fr: "Arrivée à Baalbek" }, body: { ar: "جولة مرشدة في معبدي جوبيتر وباخوس.", fr: "Visite guidée des temples de Jupiter et Bacchus." } },
      { title: { ar: "غداء في تاولات عميق", fr: "Déjeuner à Tawlet Ammiq" } },
      { title: { ar: "مدينة عنجر الأموية", fr: "Cité palatiale omeyyade d'Anjar" } },
      { title: { ar: "جولة في أقبية شاتو كسارة", fr: "Visite des caves du Château Ksara" } },
      { title: { ar: "العودة إلى الفندق", fr: "Retour à l'hôtel" } },
    ],
  },
  "byblos-batroun-coastal": {
    title: { ar: "جبيل والبترون", fr: "Byblos & Batroun" },
    excerpt: {
      ar: "ميناء فينيقي في جبيل، والبترون الساحلية، وعصير ليمون حلمي، وتجوال في السوق.",
      fr: "Port phénicien à Byblos, Batroun en bord de mer, limonade chez Hilmi et flânerie dans le souk.",
    },
    duration: { ar: "يوم كامل · 8 ساعات", fr: "Journée entière · 8 heures" },
    alt: { ar: "ميناء جبيل", fr: "Port de Byblos" },
    highlights: {
      ar: ["قلعة جبيل والميناء", "تجوال في السوق القديم", "عصير ليمون حلمي", "واجهة البترون البحرية"],
      fr: ["Citadelle et port de Byblos", "Flânerie dans le vieux souk", "Limonade chez Hilmi", "Front de mer de Batroun"],
    },
    schedule: [
      { title: { ar: "الاستلام من فندقك", fr: "Prise en charge à votre hôtel" } },
      { title: { ar: "الوصول إلى جبيل", fr: "Arrivée à Byblos" } },
      { title: { ar: "غداء بحري في بيبي عبد", fr: "Déjeuner de fruits de mer chez Pepe Abed" } },
      { title: { ar: "التوجّه إلى البترون", fr: "Route vers Batroun" } },
      { title: { ar: "واجهة البترون وسوقها", fr: "Front de mer et souk de Batroun" } },
      { title: { ar: "العودة إلى الفندق", fr: "Retour à l'hôtel" } },
    ],
  },
  "south-tyre-sidon": {
    title: { ar: "صور وصيدا", fr: "Tyr & Saïda" },
    excerpt: {
      ar: "آثار فينيقية على الساحل الجنوبي، مع غداء بحري في ميناء صور القديم.",
      fr: "Ruines phéniciennes sur la côte sud, avec déjeuner de fruits de mer au vieux port de Tyr.",
    },
    duration: { ar: "يوم كامل · 8 ساعات", fr: "Journée entière · 8 heures" },
    alt: { ar: "ساحل جنوب لبنان", fr: "Côte du sud du Liban" },
    highlights: {
      ar: ["قلعة البحر في صيدا", "خان الفرنج", "حلبة سباق الخيل الرومانية في صور", "غداء بحري في ميناء صور القديم"],
      fr: ["Château de la Mer de Saïda", "Khan El Franj", "Hippodrome romain de Tyr", "Déjeuner de fruits de mer au vieux port de Tyr"],
    },
    schedule: [
      { title: { ar: "الاستلام من فندقك", fr: "Prise en charge à votre hôtel" } },
      { title: { ar: "الوصول إلى صيدا", fr: "Arrivée à Saïda" }, body: { ar: "قلعة البحر + خان الفرنج.", fr: "Château de la Mer + Khan El Franj." } },
      { title: { ar: "غداء بحري في صور", fr: "Déjeuner de fruits de mer à Tyr" } },
      { title: { ar: "موقع صور الأثري", fr: "Site archéologique de Tyr" } },
      { title: { ar: "العودة إلى الفندق", fr: "Retour à l'hôtel" } },
    ],
  },
  "chouf-cedars": {
    title: { ar: "أرز الشوف وبيت الدين", fr: "Cèdres du Chouf & Beiteddine" },
    excerpt: {
      ar: "أكبر محمية أرز في لبنان، وقصر بيت الدين، وغداء في دير القمر.",
      fr: "La plus grande réserve de cèdres du Liban, le palais de Beiteddine et un déjeuner à Deir el Qamar.",
    },
    duration: { ar: "يوم كامل · 9 ساعات", fr: "Journée entière · 9 heures" },
    alt: { ar: "أرز الشوف", fr: "Cèdres du Chouf" },
    highlights: {
      ar: ["محمية أرز الشوف (مشي ساعة)", "جولة في قصر بيت الدين", "غداء في دير القمر", "توقّف في قرية درزية"],
      fr: ["Réserve de cèdres du Chouf (marche 1h)", "Visite du palais de Beiteddine", "Déjeuner à Deir el Qamar", "Arrêt dans un village druze"],
    },
    schedule: [
      { title: { ar: "الاستلام من فندقك", fr: "Prise en charge à votre hôtel" } },
      { title: { ar: "محمية أرز الشوف", fr: "Réserve de cèdres du Chouf" } },
      { title: { ar: "غداء في دير القمر", fr: "Déjeuner à Deir el Qamar" } },
      { title: { ar: "قصر بيت الدين", fr: "Palais de Beiteddine" } },
      { title: { ar: "العودة إلى الفندق", fr: "Retour à l'hôtel" } },
    ],
  },
  "north-tripoli-bsharre": {
    title: { ar: "طرابلس وشمال لبنان", fr: "Tripoli & Nord du Liban" },
    excerpt: {
      ar: "أسواق طرابلس المملوكية والقلعة، ثم بشري وإطلالات قاديشا.",
      fr: "Les souks mamelouks de Tripoli, la citadelle, puis Bcharré et les belvédères de la Qadisha.",
    },
    duration: { ar: "يوم كامل · 10 ساعات", fr: "Journée entière · 10 heures" },
    alt: { ar: "مدينة طرابلس القديمة وقلعتها", fr: "Vieille ville et citadelle de Tripoli" },
    highlights: {
      ar: ["أسواق طرابلس المملوكية", "قلعة ريمون دو سان جيل", "توقّف لحلويات طرابلس الشهيرة", "بشري + إطلالات قاديشا"],
      fr: ["Souks mamelouks de Tripoli", "Citadelle de Raymond de Saint-Gilles", "Arrêt aux célèbres douceurs de Tripoli", "Bcharré + belvédères de la Qadisha"],
    },
    schedule: [
      { title: { ar: "الاستلام من فندقك", fr: "Prise en charge à votre hôtel" } },
      { title: { ar: "الوصول إلى طرابلس", fr: "Arrivée à Tripoli" } },
      { title: { ar: "غداء في طرابلس", fr: "Déjeuner à Tripoli" } },
      { title: { ar: "التوجّه إلى بشري", fr: "Route vers Bcharré" } },
      { title: { ar: "إطلالة قاديشا", fr: "Belvédère de la Qadisha" } },
      { title: { ar: "العودة إلى الفندق", fr: "Retour à l'hôtel" } },
    ],
  },
};

/** Corporate tier translations, keyed by id. */
export const CORPORATE_T: Record<
  string,
  { name: LocaleText; tagline: LocaleText; fleetSize: LocaleText; inclusions: LocaleList; ctaLabel?: LocaleText }
> = {
  "co-starter": {
    name: { ar: "Starter", fr: "Starter" },
    tagline: { ar: "للفرق الصغيرة التي تستأجر من حين لآخر", fr: "Pour les petites équipes qui louent occasionnellement" },
    fleetSize: { ar: "1-2 سيارة / شهر", fr: "1-2 voitures / mois" },
    inclusions: {
      ar: ["بوّابة فوترة للشركات", "فاتورة شهرية واحدة", "خط واتساب أولوية", "استلام مجاني من حازمية"],
      fr: ["Portail de facturation entreprise", "Facture mensuelle unique", "Ligne WhatsApp prioritaire", "Retrait gratuit à Hazmieh"],
    },
  },
  "co-growth": {
    name: { ar: "Growth", fr: "Growth" },
    tagline: { ar: "للشركات النامية ذات الاحتياجات المنتظمة", fr: "Pour les entreprises en croissance aux besoins réguliers" },
    fleetSize: { ar: "3-10 سيارات / شهر", fr: "3-10 voitures / mois" },
    inclusions: {
      ar: ["مدير حساب مخصّص", "أسعار بالحجم (حتى 18% خصم)", "توصيل مجاني في بيروت الكبرى", "تخزين مستندات السائق", "فوترة جاهزة للضريبة"],
      fr: ["Gestionnaire de compte dédié", "Tarifs au volume (jusqu'à 18% de remise)", "Livraison gratuite dans le Grand Beyrouth", "Stockage des documents conducteur", "Facturation prête pour la TVA"],
    },
  },
  "co-enterprise": {
    name: { ar: "Enterprise", fr: "Enterprise" },
    tagline: { ar: "لأساطيل الشركات وسفر الأعمال", fr: "Pour les flottes d'entreprise et les voyages d'affaires" },
    fleetSize: { ar: "10+ سيارات / شهر", fr: "10+ voitures / mois" },
    inclusions: {
      ar: ["أسعار وشروط مخصّصة", "تخصيص أسطول محجوز", "توصيل وتبديل في الموقع", "تكامل API مع نظام سفرك", "إرسال مخصّص 24/7", "مراجعات أعمال ربع سنوية"],
      fr: ["Tarifs et conditions sur mesure", "Allocation de flotte réservée", "Livraison et échange sur site", "Intégration API avec votre système de voyage", "Répartition dédiée 24/7", "Revues d'activité trimestrielles"],
    },
    ctaLabel: { ar: "تواصل مع المبيعات", fr: "Contacter les ventes" },
  },
};

/** About-page prose translations (mirrors lib/content/about.ts). */
export const ABOUT_T = {
  storyParagraphs: {
    ar: [
      "تأسّست Wheels في بيروت على يد عائلة شغوفة بالسيارات لم تجد تجربة إيجار تستحقّ ثمنها في مدينتها. كان السيّاح الوافدون يُسلَّمون مفاتيح مغبرّة؛ والمقيمون يتجادلون عند المكتب؛ والمغتربون يتنقّلون بين ثلاثة تطبيقات للعثور على سيارة نظيفة.",
      "بدأنا صغاراً, اثنتا عشرة سيارة ورقم واتساب كان مارك يردّ عليه بنفسه. واليوم ندير أسطولنا من مركز واحد في حازمية، بالروح نفسها: سيارات نظيفة، وأسعار صادقة، وأشخاص حقيقيون يردّون على كل رسالة.",
      "المميّز لا يعني الباهظ, بل يعني أن كل ما يُفترَض أن يعمل، يعمل. تُؤجَّر الياريس وتُعاد في اليوم نفسه بإتقان. وتصل التاهو إلى موقف فندقك في الوقت المحدّد. ويُقرأ تأكيد الحجز وكأن صديقاً كتبه، لأن صديقاً كتبه فعلاً.",
    ],
    fr: [
      "Wheels a été fondée à Beyrouth par une famille passionnée d'automobile qui ne trouvait pas, dans sa propre ville, une expérience de location à la hauteur du prix. Les touristes recevaient des clés poussiéreuses ; les habitants devaient négocier au comptoir ; les expatriés jonglaient avec trois applis pour trouver une voiture propre.",
      "Nous avons commencé modestement, douze voitures et un numéro WhatsApp que Marc gérait lui-même. Aujourd'hui, nous exploitons notre flotte depuis un hub unique à Hazmieh, avec le même état d'esprit : des voitures propres, des prix honnêtes, et de vraies personnes derrière chaque message.",
      "Premium ne veut pas dire cher, cela veut dire que tout ce qui doit fonctionner fonctionne. La Yaris est louée et rendue le jour même, parfaitement. La Tahoe arrive à la voiturier de votre hôtel à l'heure. La confirmation de réservation se lit comme si un ami l'avait écrite, parce que c'est le cas.",
    ],
  } as LocaleList,
  pullQuote: {
    ar: "المميّز ليس سعراً. بل غياب الأشياء التي تسوء.",
    fr: "Le premium n'est pas un prix. C'est l'absence de problèmes.",
  } as LocaleText,
  fleetHeading: {
    ar: "لماذا أسطولنا مختلف.",
    fr: "Pourquoi notre flotte est différente.",
  } as LocaleText,
  fleetParagraphs: {
    ar: [
      "نحدّد عمر كل سيارة بثلاث سنوات. وبعد ذلك تُباع أو تُحال للتقاعد, لا تُمرَّر إلى المستأجر التالي.",
      "تُفحَص السيارات على يد ميكانيكي معتمد كل 5000 كم وتُنظَّف بين كل إيجار. وتُدوَّر الإطارات وفق جدول زمني، لا بناءً على شكوى.",
      "نختار الطُرز المناسبة للطرق اللبنانية: ارتفاع كافٍ عن الأرض لممرّ فقرا الجبلي، وراحة تكفي للقيادة الطويلة إلى صور، وصندوق يتّسع لعطلة في الأرز.",
    ],
    fr: [
      "Nous limitons chaque véhicule à trois ans d'âge. Au-delà, il est vendu ou retiré, pas refilé au locataire suivant.",
      "Les voitures sont inspectées par un mécanicien certifié tous les 5 000 km et nettoyées entre chaque location. Les pneus tournent selon un calendrier, pas sur réclamation.",
      "Nous choisissons les modèles pour les routes libanaises : assez de garde au sol pour le col de Faqra, assez de confort pour le long trajet vers Tyr, assez de coffre pour un week-end aux Cèdres.",
    ],
  } as LocaleList,
  teamIntro: {
    ar: "Wheels شركة إيجار سيارات بناها أفراد عائلة على أساس الثقة والخدمة وسنوات من الخبرة. خلف كل حجز وتوصيل وتفاعل مع العملاء فريق يعمل معاً عن قرب ليجعل تجربة الإيجار سلسة وموثوقة وشخصية.",
    fr: "Wheels est une société de location familiale fondée sur la confiance, le service et des années d'expérience. Derrière chaque réservation, livraison et échange avec un client, une équipe travaille en étroite collaboration pour rendre l'expérience fluide, fiable et personnelle.",
  } as LocaleText,
  teamDedication: {
    ar: "هذه الصفحة مهداة إلى سعيد وميريّ كريّم، اللذين بنى عملهما الدؤوب ورؤيتهما والتزامهما أساس Wheels ولا يزالان يوجّهان الشركة اليوم.",
    fr: "Cette page est dédiée à Saïd et Mireille Krayem, dont le travail acharné, la vision et l'engagement ont bâti les fondations de Wheels et continuent de guider l'entreprise aujourd'hui.",
  } as LocaleText,
  /** Stat labels keyed by English value. */
  statLabels: {
    "rentals last year": { ar: "حجز العام الماضي", fr: "locations l'an dernier" },
    "vehicles in fleet": { ar: "سيارة في الأسطول", fr: "véhicules dans la flotte" },
    "Google reviews": { ar: "تقييمات Google", fr: "avis Google" },
    "WhatsApp support": { ar: "دعم واتساب", fr: "support WhatsApp" },
  } as Record<string, LocaleText>,
  /** Team member role translations keyed by name. */
  roles: {
    "Said Krayem": { ar: "المؤسّس والمالك", fr: "Fondateur et propriétaire" },
    "Mireille Krayem": { ar: "المالكة ومسؤولة علاقات العملاء", fr: "Propriétaire et responsable relation client" },
    "Elie Krayem": { ar: "مسؤول العمليات والتحوّل الرقمي", fr: "Responsable opérations et transformation digitale" },
    "Diane Krayem": { ar: "عضو في الفريق العائلي", fr: "Membre de l'équipe familiale" },
    "Degaul Roukoz": { ar: "عمليات الأسطول ودعم كبار العملاء", fr: "Opérations flotte et support clients VIP" },
    "Ilda Taha": { ar: "منسّقة الاستقبال والحجوزات", fr: "Coordinatrice accueil et réservations" },
    "Taleb Zein": { ar: "التوصيل من المطار ودعم العملاء", fr: "Livraison aéroport et support client" },
    "Jawdat Soufan": { ar: "أخصائي غسيل السيارات والعناية بها", fr: "Spécialiste lavage et entretien des véhicules" },
    "Fadi Dagher": { ar: "محاسب", fr: "Comptable" },
    "Ramy Haykal": { ar: "مدير وسائل التواصل الاجتماعي", fr: "Responsable réseaux sociaux" },
    "Alex and Ralph Krayem": { ar: "دعم المحتوى ووسائل التواصل", fr: "Support contenu et réseaux sociaux" },
    "Adam Abbas": { ar: "مطوّر", fr: "Développeur" },
  } as Record<string, LocaleText>,
};

/** Help-hub topic tile translations, keyed by slug. */
export const HELP_TOPIC_T: Record<string, { title: LocaleText; blurb: LocaleText }> = {
  "rental-terms": {
    title: { ar: "شروط الإيجار", fr: "Conditions de location" },
    blurb: { ar: "من يمكنه الاستئجار، المستندات، الكيلومترات، الأضرار.", fr: "Qui peut louer, documents, kilométrage, dommages." },
  },
  "insurance-and-coverage": {
    title: { ar: "التأمين والتغطية", fr: "Assurance & couverture" },
    blurb: { ar: "شرح الفئات الثلاث. ما هو مغطّى وما هو غير مغطّى.", fr: "Les trois formules expliquées. Ce qui est couvert ou non." },
  },
  "payment-and-deposits": {
    title: { ar: "الدفع والودائع", fr: "Paiement & cautions" },
    blurb: { ar: "بطاقة، نقداً، حوالة، OMT. كيف تعمل الوديعة.", fr: "Carte, espèces, virement, OMT. Comment fonctionne la caution." },
  },
  "cancellation-policy": {
    title: { ar: "سياسة الإلغاء", fr: "Politique d'annulation" },
    blurb: { ar: "مجاني حتى 24 ساعة قبل الاستلام. خلال 24 ساعة: رسوم يوم.", fr: "Gratuit jusqu'à 24h avant le retrait. Dans les 24h : frais d'un jour." },
  },
  faq: {
    title: { ar: "الأسئلة الشائعة", fr: "FAQ" },
    blurb: { ar: "إجابات سريعة لأكثر الأسئلة شيوعاً.", fr: "Réponses rapides aux questions les plus fréquentes." },
  },
  whatsapp: {
    title: { ar: "راسلنا عبر واتساب", fr: "Écrivez-nous sur WhatsApp" },
    blurb: { ar: "أشخاص حقيقيون، 24/7, أسرع إجابة.", fr: "De vraies personnes, 24/7, la réponse la plus rapide." },
  },
};
