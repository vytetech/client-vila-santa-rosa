import type { Locale } from '@/i18n/translations'

type SeoCopy = {
  h1: string
  localTitle: string
  localLead: string
  natureTitle: string
  natureText: string
}

export const SEO_COPY: Record<Locale, SeoCopy> = {
  pt: {
    h1: 'Pousada em Ilhabela para descansar perto da Praia do Perequê',
    localTitle: 'Hospedagem na Cocaia, no Litoral Norte de São Paulo',
    localLead:
      'A Vila Santa Rosa fica na Cocaia, em Ilhabela, uma região prática para quem quer se hospedar com tranquilidade e chegar com facilidade à Praia do Perequê, ao comércio local, restaurantes e passeios pelo Litoral Norte de São Paulo.',
    natureTitle: 'Praias, trilhas e cachoeiras próximas',
    natureText:
      'Quem procura onde ficar em Ilhabela encontra na pousada uma base confortável para explorar praias, passeios de barco, trilhas, cachoeiras, Mata Atlântica e experiências de turismo de natureza como Castelhanos, Bonete, Perequê e o Parque Estadual de Ilhabela.',
  },
  en: {
    h1: 'Where to stay in Ilhabela near Pereque Beach',
    localTitle: 'Accommodation in Cocaia on the north coast of Sao Paulo',
    localLead:
      'Vila Santa Rosa is located in Cocaia, Ilhabela, a practical and quiet area for travelers looking for accommodation close to Pereque Beach, local shops, restaurants and island tours.',
    natureTitle: 'Beaches, trails and waterfalls around Ilhabela',
    natureText:
      'The guesthouse is a comfortable base for exploring Ilhabela beaches, boat trips, hiking trails, waterfalls, Atlantic Forest scenery and nature experiences such as Castelhanos, Bonete, Pereque and Ilhabela State Park.',
  },
  es: {
    h1: 'Dónde alojarse en Ilhabela cerca de la Praia do Perequê',
    localTitle: 'Alojamiento en Cocaia, en el Litoral Norte de Sao Paulo',
    localLead:
      'Vila Santa Rosa está en Cocaia, Ilhabela, una zona tranquila y práctica para alojarse cerca de la Praia do Perequê, comercios, restaurantes y paseos por la isla.',
    natureTitle: 'Playas, senderos y cascadas en Ilhabela',
    natureText:
      'La posada es una base cómoda para descubrir playas de Ilhabela, paseos en barco, senderos, cascadas, Mata Atlántica y experiencias de naturaleza como Castelhanos, Bonete, Perequê y el Parque Estatal de Ilhabela.',
  },
  fr: {
    h1: 'Ou dormir a Ilhabela pres de la plage de Pereque',
    localTitle: 'Hebergement a Cocaia, sur le littoral nord de Sao Paulo',
    localLead:
      'Vila Santa Rosa se trouve a Cocaia, Ilhabela, un quartier calme et pratique pour loger pres de la plage de Pereque, des commerces, des restaurants et des excursions sur l ile.',
    natureTitle: 'Plages, sentiers et cascades a Ilhabela',
    natureText:
      'La maison d hotes est une base confortable pour explorer les plages d Ilhabela, les sorties en bateau, les sentiers, les cascades, la foret atlantique et des sites comme Castelhanos, Bonete, Pereque et le parc d Etat d Ilhabela.',
  },
  ar: {
    h1: 'إقامة في إلهابيلا بالقرب من شاطئ بيريكي',
    localTitle: 'إقامة في كوكايا على الساحل الشمالي لساو باولو',
    localLead:
      'تقع Vila Santa Rosa في كوكايا، إلهابيلا، وهي منطقة هادئة وعملية لمن يبحث عن إقامة قريبة من شاطئ بيريكي والمتاجر والمطاعم والجولات في الجزيرة.',
    natureTitle: 'شواطئ ومسارات وشلالات في إلهابيلا',
    natureText:
      'تعد الدار قاعدة مريحة لاستكشاف شواطئ إلهابيلا ورحلات القوارب والمسارات والشلالات وغابة الأطلسي وتجارب الطبيعة مثل كاستليانوس وبونيتي وبيريكي ومنتزه إلهابيلا الحكومي.',
  },
  zh: {
    h1: '伊利亚贝拉住宿，靠近 Perequê 海滩',
    localTitle: '位于圣保罗北海岸 Cocaia 的住宿',
    localLead:
      'Vila Santa Rosa 位于伊利亚贝拉 Cocaia，安静且交通便利，适合想靠近 Perequê 海滩、当地商店、餐厅和海岛游览的旅客。',
    natureTitle: '伊利亚贝拉的海滩、步道与瀑布',
    natureText:
      '这里是探索伊利亚贝拉海滩、乘船游览、徒步步道、瀑布、大西洋森林以及 Castelhanos、Bonete、Perequê 和伊利亚贝拉州立公园等自然体验的舒适基地。',
  },
  ja: {
    h1: 'ペレケービーチ近くのイリャベラ宿泊',
    localTitle: 'サンパウロ北海岸 Cocaia エリアの宿泊',
    localLead:
      'Vila Santa Rosa はイリャベラの Cocaia にあり、Perequê ビーチ、地元の店、レストラン、島内ツアーへアクセスしやすい静かなエリアにあります。',
    natureTitle: 'イリャベラのビーチ、トレイル、滝',
    natureText:
      '当宿は、イリャベラのビーチ、ボートツアー、ハイキングコース、滝、大西洋岸森林、Castelhanos、Bonete、Perequê、イリャベラ州立公園を楽しむための快適な拠点です。',
  },
}
