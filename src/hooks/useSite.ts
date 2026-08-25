import { trpc } from '@/providers/trpc'
import { WHATSAPP_PRIMARY, WHATSAPP_SECONDARY } from '@/data/rooms'

export interface SiteData {
  whatsappPrimary: string
  whatsappSecondary: string
  pixKey: string
  pixOwner: string
  paypalEmail: string
  tudoAppUrl: string
}

const FALLBACK: SiteData = {
  whatsappPrimary: WHATSAPP_PRIMARY,
  whatsappSecondary: WHATSAPP_SECONDARY,
  pixKey: 'vilasantarosailhabela@gmail.com',
  pixOwner: 'Ahmad Taha',
  paypalEmail: 'a1989a2029@gmail.com',
  tudoAppUrl: '',
}

/**
 * Owner-editable site data (WhatsApp numbers, Pix, PayPal, app links).
 * Edited in /admin — every page reads from here, with safe fallbacks.
 */
export function useSite(): SiteData {
  const q = trpc.settings.site.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  })
  return q.data ?? FALLBACK
}
