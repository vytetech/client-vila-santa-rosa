import { useEffect } from 'react'
import { trpc } from '@/providers/trpc'

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void
}

/**
 * Injects Google Analytics 4, Google Search Console verification meta and
 * Meta Pixel — only when the owner has filled the IDs in the admin panel.
 */
export default function Analytics() {
  const { data } = trpc.settings.analytics.useQuery(undefined, {
    staleTime: 5 * 60_000,
    retry: false,
  })

  useEffect(() => {
    if (!data) return
    const { gaId, gscVerification, metaPixelId } = data

    if (gscVerification && !document.querySelector('meta[name="google-site-verification"]')) {
      const meta = document.createElement('meta')
      meta.name = 'google-site-verification'
      meta.content = gscVerification
      document.head.appendChild(meta)
    }

    if (gaId && !document.getElementById('ga4-inline')) {
      const gtagWindow = window as GtagWindow

      if (gtagWindow.gtag) {
        gtagWindow.gtag('config', gaId)
        const marker = document.createElement('script')
        marker.id = 'ga4-inline'
        marker.type = 'application/json'
        marker.text = JSON.stringify({ configured: gaId })
        document.head.appendChild(marker)
      } else {
        const s = document.createElement('script')
        s.id = 'ga4-script'
        s.async = true
        s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`
        document.head.appendChild(s)
        const inline = document.createElement('script')
        inline.id = 'ga4-inline'
        inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`
        document.head.appendChild(inline)
      }
    }

    if (metaPixelId && !document.getElementById('meta-pixel')) {
      const s = document.createElement('script')
      s.id = 'meta-pixel'
      s.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`
      document.head.appendChild(s)
    }
  }, [data])

  return null
}
