import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const SITE = JSON.parse(
  readFileSync(resolve(__dirname, '../src/config/site-data.json'), 'utf-8'),
)
export const SITE_URL = SITE.url
SITE.image = `${SITE_URL}${SITE.heroImage}`
SITE.logoUrl = `${SITE_URL}${SITE.logo}`

export const LOCALES = [
  { code: 'pt', lang: 'pt-BR', dir: 'ltr', ogLocale: 'pt_BR', hreflang: 'pt-BR' },
  { code: 'en', lang: 'en', dir: 'ltr', ogLocale: 'en_US', hreflang: 'en' },
  { code: 'es', lang: 'es', dir: 'ltr', ogLocale: 'es_ES', hreflang: 'es' },
  { code: 'fr', lang: 'fr', dir: 'ltr', ogLocale: 'fr_FR', hreflang: 'fr' },
  { code: 'ar', lang: 'ar', dir: 'rtl', ogLocale: 'ar_AR', hreflang: 'ar' },
  { code: 'zh', lang: 'zh-CN', dir: 'ltr', ogLocale: 'zh_CN', hreflang: 'zh' },
  { code: 'ja', lang: 'ja', dir: 'ltr', ogLocale: 'ja_JP', hreflang: 'ja' },
]

export const DEFAULT_LOCALE = 'pt'

export const SEO = {
  pt: {
    title: 'Pousada em Ilhabela | Vila Santa Rosa - Hospedagem na Cocaia',
    description:
      'Hospedagem em Ilhabela na Cocaia, perto da Praia do Perequê: suítes independentes, jardim e atendimento acolhedor para quem procura onde ficar no Litoral Norte de São Paulo.',
    keywords:
      'pousada em Ilhabela, pousadas em Ilhabela, hospedagem em Ilhabela, onde ficar em Ilhabela, pousada perto da Praia do Perequê, pousada na Cocaia, hospedagem no Litoral Norte',
    faq: [
      ['Quais são os horários de check-in e check-out?', 'Check-in a partir das 14h e check-out até as 12h. Precisa de horário diferente? Fale conosco pelo WhatsApp e faremos o possível para acomodar você.'],
      ['Aceitam animais de estimação?', 'Sim, somos pet friendly! Cobramos uma pequena taxa por noite. Informe na reserva quantos pets vêm com você.'],
      ['Como funciona o pagamento?', 'Para garantir a reserva, pedimos um sinal de 50% via Pix, cartão ou PayPal. O restante é pago no check-in.'],
      ['Qual é a política de cancelamento?', 'Cancelamentos até 7 dias antes do check-in têm reembolso integral do valor pago. Após esse prazo, o valor fica como crédito para uma futura estadia.'],
      ['A pousada fica perto da praia?', 'Sim. Estamos na Cocaia, em Ilhabela, perto da Praia do Perequê e de acessos para praias, trilhas e passeios pela ilha.'],
    ],
  },
  en: {
    title: 'Where to Stay in Ilhabela | Vila Santa Rosa Guesthouse',
    description:
      'Accommodation in Ilhabela, Brazil, in the quiet Cocaia area near Pereque Beach: independent suites, garden and a welcoming base for beaches, waterfalls and island tours.',
    keywords:
      'where to stay in Ilhabela, accommodation in Ilhabela, hotels in Ilhabela, Ilhabela Brazil, Ilhabela beaches, things to do in Ilhabela',
    faq: [
      ['What are the check-in and check-out times?', 'Check-in from 2 PM and check-out until 12 PM. Need a different time? Message us on WhatsApp and we will do our best to accommodate you.'],
      ['Do you accept pets?', 'Yes, we are pet friendly. We charge a small nightly fee per pet. Let us know in the booking how many pets are coming.'],
      ['How does payment work?', 'To secure the booking we ask for a 50% deposit via Pix, card or PayPal. The balance is paid at check-in.'],
      ['What is the cancellation policy?', 'Cancellations up to 7 days before check-in get a full refund of the amount paid. After that, the amount stays as credit for a future stay.'],
      ['Is the guest house near the beach?', 'Yes. Vila Santa Rosa is in Cocaia, Ilhabela, near Pereque Beach and convenient for beaches, trails and island tours.'],
    ],
  },
  es: {
    title: 'Dónde alojarse en Ilhabela | Vila Santa Rosa',
    description:
      'Alojamiento en Ilhabela, Brasil, en la zona tranquila de Cocaia cerca de la Praia do Perequê: suites independientes, jardín y fácil acceso a playas, cascadas y paseos.',
    keywords:
      'dónde alojarse en Ilhabela, alojamiento en Ilhabela, hoteles en Ilhabela, qué hacer en Ilhabela, playas de Ilhabela',
    faq: [
      ['¿Cuáles son los horarios de check-in y check-out?', 'Check-in desde las 14h y check-out hasta las 12h. ¿Necesitas otro horario? Escríbenos por WhatsApp y haremos lo posible por acomodarte.'],
      ['¿Aceptan mascotas?', 'Sí, somos pet friendly. Cobramos una pequeña tarifa por noche y por mascota. Indica en la reserva cuántas mascotas vienen contigo.'],
      ['¿Cómo funciona el pago?', 'Para garantizar la reserva pedimos una seña del 50% vía Pix, tarjeta o PayPal. El resto se paga en el check-in.'],
      ['¿Cuál es la política de cancelación?', 'Las cancelaciones hasta 7 días antes del check-in tienen reembolso total del importe pagado. Después de ese plazo, el valor queda como crédito para una futura estadía.'],
      ['¿La posada queda cerca de la playa?', 'Sí. Vila Santa Rosa está en Cocaia, Ilhabela, cerca de la Praia do Perequê y de accesos a playas, senderos y paseos por la isla.'],
    ],
  },
  fr: {
    title: 'Où dormir à Ilhabela | Vila Santa Rosa',
    description:
      'Hébergement à Ilhabela, Brésil, dans le quartier calme de Cocaia près de la plage de Pereque: suites indépendantes, jardin et accès pratique aux plages, cascades et excursions.',
    keywords:
      'où dormir à Ilhabela, hébergement à Ilhabela, hôtel à Ilhabela, que faire à Ilhabela, plages Ilhabela',
    faq: [
      ['Quels sont les horaires de check-in et check-out ?', 'Check-in à partir de 14h et check-out jusqu’à 12h. Besoin d’un autre horaire ? Écrivez-nous sur WhatsApp et nous ferons notre possible.'],
      ['Acceptez-vous les animaux ?', 'Oui, nous sommes pet friendly. Un petit supplément par nuit et par animal est facturé. Indiquez le nombre d’animaux lors de la réservation.'],
      ['Comment fonctionne le paiement ?', 'Pour garantir la réservation, nous demandons un acompte de 50 % via Pix, carte ou PayPal. Le solde est réglé au check-in.'],
      ['Quelle est la politique d’annulation ?', 'Les annulations jusqu’à 7 jours avant le check-in sont intégralement remboursées. Passé ce délai, le montant reste en crédit pour un futur séjour.'],
      ['La maison d’hôtes est-elle proche de la plage ?', 'Oui. Vila Santa Rosa se trouve à Cocaia, Ilhabela, près de la plage de Pereque et des accès aux plages, sentiers et excursions.'],
    ],
  },
  ar: {
    title: 'فنادق وإقامة في إلهابيلا | Vila Santa Rosa',
    description:
      'إقامة في إلهابيلا البرازيل في منطقة كوكايا الهادئة بالقرب من شاطئ بيريكي، مع أجنحة مستقلة وحديقة وقاعدة مريحة لاستكشاف الشواطئ والشلالات.',
    keywords: 'فنادق في إلهابيلا, إقامة في إلهابيلا, السياحة في إلهابيلا, شواطئ إلهابيلا',
    faq: [
      ['ما هي أوقات تسجيل الوصول والمغادرة؟', 'تسجيل الوصول من الساعة 14:00 والمغادرة حتى 12:00. تحتاج وقتاً مختلفاً؟ راسلنا عبر واتساب وسنبذل قصارى جهدنا.'],
      ['هل تقبلون الحيوانات الأليفة؟', 'نعم، نرحب بالحيوانات الأليفة. نتقاضى رسماً صغيراً لكل ليلة ولكل حيوان. أخبرنا في الحجز بعدد الحيوانات القادمة معك.'],
      ['كيف يعمل الدفع؟', 'لتأكيد الحجز نطلب عربون 50٪ عبر Pix أو البطاقة أو PayPal. يُدفع الباقي عند تسجيل الوصول.'],
      ['ما هي سياسة الإلغاء؟', 'الإلغاء حتى 7 أيام قبل تسجيل الوصول يسترد المبلغ المدفوع كاملاً. بعد ذلك يبقى المبلغ رصيداً لإقامة مستقبلية.'],
      ['هل النزل قريب من الشاطئ؟', 'نعم. تقع Vila Santa Rosa في كوكايا، إلهابيلا، بالقرب من شاطئ بيريكي ومداخل الشواطئ والمسارات والجولات في الجزيرة.'],
    ],
  },
  zh: {
    title: '伊利亚贝拉住宿 | Vila Santa Rosa',
    description:
      'Vila Santa Rosa 位于巴西伊利亚贝拉 Cocaia，靠近 Perequê 海滩，提供独立套房、花园和方便探索海滩、瀑布与海岛旅游的位置。',
    keywords: '伊利亚贝拉 酒店, 伊利亚贝拉 住宿, 伊利亚贝拉 旅游, 伊利亚贝拉 海滩',
    faq: [
      ['入住和退房时间是什么时候？', '入住时间为下午2点，退房时间为中午12点。需要其他时间？请通过 WhatsApp 联系我们，我们会尽力安排。'],
      ['可以携带宠物吗？', '可以，我们欢迎宠物入住。每晚按宠物收取少量费用，请在预订时注明宠物数量。'],
      ['如何付款？', '为确保预订，我们收取50%的定金，可通过 Pix、银行卡或 PayPal 支付。余款在入住时支付。'],
      ['取消政策是什么？', '入住前7天以上取消可全额退还已付金额。此后金额将保留为未来住宿的抵用额度。'],
      ['旅馆离海滩近吗？', '是的。Vila Santa Rosa 位于伊利亚贝拉 Cocaia，靠近 Perequê 海滩，也方便前往海滩、步道和海岛游览。'],
    ],
  },
  ja: {
    title: 'イリャベラの宿泊 | Vila Santa Rosa',
    description:
      'ブラジル・イリャベラの Cocaia エリア、Perequê ビーチ近くの宿泊。独立したスイート、庭、ビーチや滝、島内観光に便利なロケーションです。',
    keywords: 'イリャベラ ホテル, イリャベラ 宿泊, イリャベラ 観光, イリャベラ ビーチ',
    faq: [
      ['チェックイン・チェックアウトの時間は？', 'チェックインは14時から、チェックアウトは12時まで。別の時間をご希望ですか？WhatsAppでご相談ください。'],
      ['ペットは宿泊できますか？', 'はい、ペットフレンドリーです。ペット1匹ごとに1泊あたり少額の料金をいただきます。予約時に匹数をお知らせください。'],
      ['支払い方法は？', 'ご予約確定のため50%のデポジットを Pix、カード、PayPal でお願いしています。残金はチェックイン時にお支払いください。'],
      ['キャンセルポリシーは？', 'チェックインの7日前までのキャンセルはお支払い金額を全額返金いたします。それ以降は将来の宿泊クレジットとして保持されます。'],
      ['ビーチに近いですか？', 'はい。Vila Santa Rosa はイリャベラの Cocaia にあり、Perequê ビーチやビーチ、トレイル、島内ツアーへのアクセスに便利です。'],
    ],
  },
}

export function localeUrl(code) {
  return `${SITE_URL}/${code}/`
}
