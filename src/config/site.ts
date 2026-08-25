import siteData from './site-data.json'

export const SITE = siteData

export const SITE_ADDRESS_LINE = `${SITE.address.street} — ${SITE.address.neighborhood}, ${SITE.address.city}/${SITE.address.state}`
