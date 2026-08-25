import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, BedDouble, Copy, ImagePlus, Plus, Save, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/providers/trpc'
import {
  SUITE_IDS,
  SUITE_PHOTO_SLOTS,
  SUITES_DEFAULTS,
  resolveSuiteLocale,
  sanitizeSuitesContent,
  type SuiteContentItem,
  type SuiteId,
  type SuitesContent,
} from '@contracts/suites-content'
import { BREAKFAST_LOCALE_LABELS, BREAKFAST_LOCALES, type BreakfastLocale } from '@contracts/breakfast-content'
import type { SitePhotoSlot } from '@contracts/site-photos'

type SuitePhoto = {
  id: number
  path: string
  alt: string
  sort: number
}

function cloneSuites(content: SuitesContent): SuitesContent {
  return JSON.parse(JSON.stringify(content)) as SuitesContent
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function moveArrayItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export default function SuitesManager() {
  const utils = trpc.useUtils()
  const suitesQuery = trpc.suites.adminList.useQuery()
  const [form, setForm] = useState<SuitesContent>(cloneSuites(SUITES_DEFAULTS))
  const [activeSuite, setActiveSuite] = useState<SuiteId>('luxo')
  const [activeLocale, setActiveLocale] = useState<BreakfastLocale>('pt')
  const [photoAlts, setPhotoAlts] = useState<Record<number, string>>({})
  const [loaded, setLoaded] = useState(false)
  const [feedback, setFeedback] = useState('')

  const activeApiSuite = suitesQuery.data?.find((suite) => suite.roomId === activeSuite)
  const photos = useMemo(
    () => ((activeApiSuite?.photos ?? []) as SuitePhoto[]).slice().sort((a, b) => a.sort - b.sort || a.id - b.id),
    [activeApiSuite?.photos],
  )
  const currentSuite = form[activeSuite]
  const currentLocale = currentSuite.locales[activeLocale]

  useEffect(() => {
    if (!suitesQuery.data || loaded) return
    setForm(
      sanitizeSuitesContent(
        Object.fromEntries(suitesQuery.data.map((suite) => [suite.roomId, suite])) as Partial<SuitesContent>,
      ),
    )
    setLoaded(true)
  }, [loaded, suitesQuery.data])

  useEffect(() => {
    const next: Record<number, string> = {}
    for (const photo of photos) next[photo.id] = photo.alt ?? ''
    setPhotoAlts(next)
  }, [photos])

  const invalidateSuites = () => {
    utils.suites.adminList.invalidate()
    utils.suites.publicList.invalidate()
  }

  const saveSuites = trpc.suites.updateAll.useMutation({
    onSuccess: () => {
      setFeedback('Salvo')
      invalidateSuites()
      setTimeout(() => setFeedback(''), 2500)
    },
    onError: (error) => setFeedback(error.message),
  })

  const upload = trpc.photos.upload.useMutation({
    onSuccess: () => {
      setFeedback('Imagem enviada')
      invalidateSuites()
      utils.photos.all.invalidate()
      setTimeout(() => setFeedback(''), 2500)
    },
    onError: (error) => setFeedback(error.message),
  })

  const updatePhoto = trpc.photos.update.useMutation({
    onSuccess: () => {
      invalidateSuites()
      utils.photos.all.invalidate()
    },
    onError: (error) => setFeedback(error.message),
  })

  const removePhoto = trpc.photos.remove.useMutation({
    onSuccess: () => {
      setFeedback('Imagem excluída')
      invalidateSuites()
      utils.photos.all.invalidate()
      setTimeout(() => setFeedback(''), 2500)
    },
    onError: (error) => setFeedback(error.message),
  })

  const updateSuite = (roomId: SuiteId, patch: Partial<SuiteContentItem>) => {
    setForm((current) => ({
      ...current,
      [roomId]: { ...current[roomId], ...patch },
    }))
  }

  const updateLocale = (patch: Partial<SuiteContentItem['locales'][BreakfastLocale]>) => {
    setForm((current) => ({
      ...current,
      [activeSuite]: {
        ...current[activeSuite],
        locales: {
          ...current[activeSuite].locales,
          [activeLocale]: { ...current[activeSuite].locales[activeLocale], ...patch },
        },
      },
    }))
  }

  const addAmenity = () => updateLocale({ amenities: [...currentLocale.amenities, ''] })
  const updateAmenity = (index: number, value: string) =>
    updateLocale({ amenities: currentLocale.amenities.map((item, i) => (i === index ? value : item)) })
  const removeAmenity = (index: number) =>
    updateLocale({ amenities: currentLocale.amenities.filter((_, i) => i !== index) })
  const moveAmenity = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= currentLocale.amenities.length) return
    updateLocale({ amenities: moveArrayItem(currentLocale.amenities, index, nextIndex) })
  }

  const reorderPhotos = async (ordered: SuitePhoto[]) => {
    await Promise.all(ordered.map((photo, index) => updatePhoto.mutateAsync({ id: photo.id, sort: index })))
    invalidateSuites()
  }

  const movePhoto = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= photos.length) return
    reorderPhotos(moveArrayItem(photos, index, nextIndex))
  }

  const setPrimary = (photo: SuitePhoto) => {
    reorderPhotos([photo, ...photos.filter((item) => item.id !== photo.id)])
  }

  const copyFromPortuguese = () => {
    if (activeLocale === 'pt') return
    if (!window.confirm(`Copiar o conteúdo em português para ${BREAKFAST_LOCALE_LABELS[activeLocale]}?`)) return
    updateLocale(currentSuite.locales.pt)
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h2 className="flex items-center gap-2 font-serif-display text-2xl font-semibold">
          <BedDouble className="h-5 w-5 text-primary" /> Suítes
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edite o conteúdo editorial e as fotos públicas sem alterar os roomIds operacionais.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {SUITE_IDS.map((roomId) => {
            const resolved = resolveSuiteLocale(form[roomId], 'pt')
            return (
              <button
                type="button"
                key={roomId}
                onClick={() => setActiveSuite(roomId)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  activeSuite === roomId ? 'border-primary bg-primary/10' : 'bg-background hover:bg-muted'
                }`}
              >
                <p className="font-serif-display text-xl font-semibold">{resolved.publicName}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">roomId: {roomId}</p>
                <p className={form[roomId].enabled ? 'mt-2 text-sm text-primary' : 'mt-2 text-sm text-muted-foreground'}>
                  {form[roomId].enabled ? 'Visível no site' : 'Oculta no site'}
                </p>
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={currentSuite.enabled}
                  onChange={(event) => updateSuite(activeSuite, { enabled: event.target.checked })}
                  className="h-4 w-4"
                />
                Exibir esta suíte no site
              </label>
              <Button
                disabled={saveSuites.isPending}
                onClick={() =>
                  saveSuites.mutate(
                    sanitizeSuitesContent(
                      Object.fromEntries(
                        SUITE_IDS.map((roomId) => [
                          roomId,
                          {
                            ...form[roomId],
                            locales: Object.fromEntries(
                              BREAKFAST_LOCALES.map((locale) => [
                                locale,
                                {
                                  ...form[roomId].locales[locale],
                                  amenities: form[roomId].locales[locale].amenities
                                    .map((item) => item.trim())
                                    .filter(Boolean),
                                },
                              ]),
                            ),
                          },
                        ]),
                      ) as Partial<SuitesContent>,
                    ),
                  )
                }
              >
                <Save className="h-4 w-4" /> {feedback || 'Salvar suíte'}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Capacidade de hóspedes</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={currentSuite.maxGuests}
                  onChange={(e) => updateSuite(activeSuite, { maxGuests: Number(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Máximo de pets</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={currentSuite.maxPets}
                  onChange={(e) => updateSuite(activeSuite, { maxPets: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem da suíte</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={currentSuite.order}
                  onChange={(e) => updateSuite(activeSuite, { order: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {BREAKFAST_LOCALES.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setActiveLocale(locale)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeLocale === locale
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/70'
                  }`}
                >
                  {BREAKFAST_LOCALE_LABELS[locale]}
                </button>
              ))}
              {activeLocale !== 'pt' && (
                <Button type="button" size="sm" variant="outline" onClick={copyFromPortuguese}>
                  <Copy className="h-4 w-4" /> Copiar do Português
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome público</Label>
                <Input value={currentLocale.publicName} onChange={(e) => updateLocale({ publicName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input value={currentLocale.subtitle} onChange={(e) => updateLocale({ subtitle: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Andar/localização</Label>
                <Input value={currentLocale.location} onChange={(e) => updateLocale({ location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo da suíte</Label>
                <Input value={currentLocale.type} onChange={(e) => updateLocale({ type: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de cama</Label>
                <Input value={currentLocale.bedType} onChange={(e) => updateLocale({ bedType: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Informação auxiliar</Label>
                <Input value={currentLocale.info} onChange={(e) => updateLocale({ info: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição curta</Label>
              <Textarea
                rows={3}
                value={currentLocale.shortDescription}
                onChange={(e) => updateLocale({ shortDescription: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição completa</Label>
              <Textarea
                rows={5}
                value={currentLocale.fullDescription}
                onChange={(e) => updateLocale({ fullDescription: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto auxiliar</Label>
              <Input
                value={currentLocale.auxiliaryText}
                onChange={(e) => updateLocale({ auxiliaryText: e.target.value })}
              />
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <Label>Comodidades / destaques</Label>
                <Button type="button" size="sm" variant="outline" onClick={addAmenity}>
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </div>
              {currentLocale.amenities.map((amenity, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input value={amenity} onChange={(e) => updateAmenity(index, e.target.value)} />
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="ghost" onClick={() => moveAmenity(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => moveAmenity(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeAmenity(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-display text-xl font-semibold">Fotos da suíte ({photos.length})</h3>
                <p className="text-sm text-muted-foreground">A primeira foto é a principal do card público.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                <ImagePlus className="h-4 w-4" />
                Enviar imagem
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const dataUrl = await readAsDataUrl(file)
                    upload.mutate({
                      slot: SUITE_PHOTO_SLOTS[activeSuite] as SitePhotoSlot,
                      alt: currentLocale.publicName,
                      filename: file.name,
                      dataUrl,
                    })
                    e.target.value = ''
                  }}
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {photos.map((photo, index) => (
                <div key={photo.id} className="rounded-xl border bg-background p-3">
                  <div className="relative overflow-hidden rounded-lg">
                    <img src={photo.path} alt={photo.alt} className="aspect-[4/3] w-full object-cover" />
                    {index === 0 && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                        <Star className="h-3 w-3" /> Principal
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <Label>Alt text</Label>
                    <Input
                      value={photoAlts[photo.id] ?? ''}
                      onChange={(e) => setPhotoAlts((current) => ({ ...current, [photo.id]: e.target.value }))}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => updatePhoto.mutate({ id: photo.id, alt: photoAlts[photo.id] ?? '' })}
                    >
                      <Save className="h-3.5 w-3.5" /> Salvar alt
                    </Button>
                    {index !== 0 && (
                      <Button type="button" size="sm" variant="outline" onClick={() => setPrimary(photo)}>
                        <Star className="h-3.5 w-3.5" /> Definir principal
                      </Button>
                    )}
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => movePhoto(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => movePhoto(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm('Deseja realmente excluir esta foto da suíte?')) {
                          removePhoto.mutate({ id: photo.id })
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" /> Excluir
                    </Button>
                  </div>
                </div>
              ))}
              {photos.length === 0 && (
                <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  Nenhuma foto específica para esta suíte. O site usará o fallback estático até o primeiro upload.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
