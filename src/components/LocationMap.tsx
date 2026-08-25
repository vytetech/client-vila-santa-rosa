import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLanguage } from '@/i18n/LanguageContext'
import { SITE } from '@/config/site'

/** Vila Santa Rosa — Rua Rafael Pinto da Rocha, 141 · Cocaia, Ilhabela */
const POUSADA: [number, number] = [SITE.geo.latitude, SITE.geo.longitude]

interface Poi {
  pos: [number, number]
  name: string
  kind: 'beach' | 'food' | 'market'
  distance: string
}

const POIS: Poi[] = [
  // Beaches (closest first)
  { pos: [-23.8062, -45.3605], name: 'Praia do Perequê', kind: 'beach', distance: '1,0 km' },
  { pos: [-23.7966, -45.3610], name: 'Praia do Itaguassu', kind: 'beach', distance: '2,0 km' },
  { pos: [-23.8330, -45.3530], name: 'Praia do Julião', kind: 'beach', distance: '2,4 km' },
  { pos: [-23.8375, -45.3555], name: 'Praia Grande', kind: 'beach', distance: '2,8 km' },
  { pos: [-23.8470, -45.3490], name: 'Praia da Feiticeira', kind: 'beach', distance: '3,8 km' },
  { pos: [-23.8515, -45.3425], name: 'Praia do Curral', kind: 'beach', distance: '4,5 km' },
  // Restaurants
  { pos: [-23.8055, -45.3630], name: 'Restaurantes do Perequê', kind: 'food', distance: '1,0 km' },
  { pos: [-23.7790, -45.3580], name: 'Vila (centro histórico)', kind: 'food', distance: '4,0 km' },
  // Market
  { pos: [-23.8105, -45.3615], name: 'Supermercado (Cocaia)', kind: 'market', distance: '500 m' },
]

const COLORS: Record<Poi['kind'], string> = {
  beach: '#0e7490',
  food: '#b45309',
  market: '#4d7c0f',
}

function markerIcon(color: string, big = false) {
  const size = big ? 22 : 14
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function LocationMap() {
  const { d } = useLanguage()
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!el.current || mapRef.current) return
    const map = L.map(el.current, {
      center: POUSADA,
      zoom: 13,
      scrollWheelZoom: false,
    })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    L.marker(POUSADA, { icon: markerIcon('#be123c', true) })
      .addTo(map)
      .bindPopup(`<strong>${SITE.name}</strong><br/>${SITE.address.street} — ${SITE.address.neighborhood}`)
      .openPopup()

    for (const poi of POIS) {
      L.marker(poi.pos, { icon: markerIcon(COLORS[poi.kind]) })
        .addTo(map)
        .bindPopup(`<strong>${poi.name}</strong><br/>${poi.distance}`)
    }

    requestAnimationFrame(() => map.invalidateSize())
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 250)
    mapRef.current = map
    return () => {
      window.clearTimeout(resizeTimer)
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div className="reveal mt-14">
      <div className="overflow-hidden rounded-3xl border shadow-sm">
        <div ref={el} className="h-105 w-full sm:h-120" style={{ zIndex: 0 }} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: '#be123c' }} />
          Vila Santa Rosa
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: COLORS.beach }} />
          {d.location.mapBeaches}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: COLORS.food }} />
          {d.location.mapFood}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: COLORS.market }} />
          {d.location.mapMarket}
        </span>
      </div>
    </div>
  )
}
