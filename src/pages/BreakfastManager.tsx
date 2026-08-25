import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Coffee, Copy, ImagePlus, Plus, Save, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/providers/trpc'
import {
  BREAKFAST_DEFAULTS,
  BREAKFAST_LOCALE_LABELS,
  BREAKFAST_LOCALES,
  isBreakfastLocaleComplete,
  type BreakfastContent,
  type BreakfastLocale,
} from '@contracts/breakfast-content'
import { PHOTO_SLOTS } from '@contracts/site-photos'

type CafePhoto = {
  id: number
  path: string
  alt: string
  sort: number
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function cloneBreakfast(content: BreakfastContent): BreakfastContent {
  return JSON.parse(JSON.stringify(content)) as BreakfastContent
}

function moveArrayItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export default function BreakfastManager() {
  const utils = trpc.useUtils()
  const breakfast = trpc.settings.breakfast.useQuery()
  const cafePhotos = trpc.photos.list.useQuery({ slot: PHOTO_SLOTS.cafe })
  const captions = trpc.settings.photoCaptions.useQuery()
  const [form, setForm] = useState<BreakfastContent>(cloneBreakfast(BREAKFAST_DEFAULTS))
  const [activeLocale, setActiveLocale] = useState<BreakfastLocale>('pt')
  const [photoAlts, setPhotoAlts] = useState<Record<number, string>>({})
  const [photoCaptions, setPhotoCaptions] = useState<Record<number, string>>({})
  const [loaded, setLoaded] = useState(false)
  const [feedback, setFeedback] = useState('')

  const photos = useMemo(
    () => ((cafePhotos.data ?? []) as CafePhoto[]).slice().sort((a, b) => a.sort - b.sort || a.id - b.id),
    [cafePhotos.data],
  )
  const current = form.locales[activeLocale]

  useEffect(() => {
    if (!breakfast.data || loaded) return
    setForm(cloneBreakfast(breakfast.data))
    setLoaded(true)
  }, [breakfast.data, loaded])

  useEffect(() => {
    const next: Record<number, string> = {}
    for (const photo of photos) next[photo.id] = photo.alt ?? ''
    setPhotoAlts(next)
  }, [photos])

  useEffect(() => {
    const next: Record<number, string> = {}
    for (const photo of photos) {
      next[photo.id] = captions.data?.[String(photo.id)]?.[activeLocale] ?? ''
    }
    setPhotoCaptions(next)
  }, [activeLocale, captions.data, photos])

  const invalidateBreakfast = () => {
    utils.settings.breakfast.invalidate()
  }

  const invalidatePhotos = () => {
    utils.photos.list.invalidate({ slot: PHOTO_SLOTS.cafe })
    utils.photos.all.invalidate()
  }

  const save = trpc.settings.setBreakfast.useMutation({
    onSuccess: () => {
      setFeedback('Salvo')
      invalidateBreakfast()
      setTimeout(() => setFeedback(''), 2500)
    },
    onError: (error) => setFeedback(error.message),
  })

  const upload = trpc.photos.upload.useMutation({
    onSuccess: () => {
      setFeedback('Imagem enviada')
      invalidatePhotos()
      setTimeout(() => setFeedback(''), 2500)
    },
    onError: (error) => setFeedback(error.message),
  })

  const updatePhoto = trpc.photos.update.useMutation({
    onSuccess: invalidatePhotos,
    onError: (error) => setFeedback(error.message),
  })
  const setPhotoCaption = trpc.settings.setPhotoCaption.useMutation({
    onSuccess: () => {
      utils.settings.photoCaptions.invalidate()
      setFeedback('Legenda salva')
      setTimeout(() => setFeedback(''), 2500)
    },
    onError: (error) => setFeedback(error.message),
  })

  const removePhoto = trpc.photos.remove.useMutation({
    onSuccess: () => {
      setFeedback('Imagem excluída')
      invalidatePhotos()
      setTimeout(() => setFeedback(''), 2500)
    },
    onError: (error) => setFeedback(error.message),
  })

  const updateLocale = (
    locale: BreakfastLocale,
    patch: Partial<BreakfastContent['locales'][BreakfastLocale]>,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      locales: {
        ...currentForm.locales,
        [locale]: { ...currentForm.locales[locale], ...patch },
      },
    }))
  }

  const addBadge = () => {
    setForm((currentForm) => {
      const locales = { ...currentForm.locales }
      for (const locale of BREAKFAST_LOCALES) {
        locales[locale] = { ...locales[locale], badges: [...locales[locale].badges, ''] }
      }
      return { ...currentForm, locales }
    })
  }

  const updateBadge = (locale: BreakfastLocale, index: number, value: string) => {
    updateLocale(locale, {
      badges: current.badges.map((item, i) => (i === index ? value : item)),
    })
  }

  const removeBadge = (index: number) => {
    setForm((currentForm) => {
      const locales = { ...currentForm.locales }
      for (const locale of BREAKFAST_LOCALES) {
        locales[locale] = { ...locales[locale], badges: locales[locale].badges.filter((_, i) => i !== index) }
      }
      return { ...currentForm, locales }
    })
  }

  const moveBadge = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= current.badges.length) return
    setForm((currentForm) => {
      const locales = { ...currentForm.locales }
      for (const locale of BREAKFAST_LOCALES) {
        locales[locale] = { ...locales[locale], badges: moveArrayItem(locales[locale].badges, index, nextIndex) }
      }
      return { ...currentForm, locales }
    })
  }

  const reorderPhotos = async (ordered: CafePhoto[]) => {
    await Promise.all(ordered.map((photo, index) => updatePhoto.mutateAsync({ id: photo.id, sort: index })))
    invalidatePhotos()
  }

  const movePhoto = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= photos.length) return
    reorderPhotos(moveArrayItem(photos, index, nextIndex))
  }

  const setPrimary = (photo: CafePhoto) => {
    reorderPhotos([photo, ...photos.filter((item) => item.id !== photo.id)])
  }

  const copyFromPortuguese = () => {
    if (activeLocale === 'pt') return
    if (!window.confirm(`Copiar o conteúdo em português para ${BREAKFAST_LOCALE_LABELS[activeLocale]}?`)) return
    updateLocale(activeLocale, cloneBreakfast({ ...BREAKFAST_DEFAULTS, locales: form.locales }).locales.pt)
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-serif-display text-2xl font-semibold">
              <Coffee className="h-5 w-5 text-primary" /> Café da manhã
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie exibição, textos multilíngues, destaques e fotos do slot Cafe.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
              className="h-4 w-4"
            />
            Exibir seção Café da Manhã no site
            <span className={form.enabled ? 'text-primary' : 'text-muted-foreground'}>
              {form.enabled ? 'ATIVADO' : 'DESATIVADO'}
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {BREAKFAST_LOCALES.map((locale) => {
            const complete = isBreakfastLocaleComplete(form.locales[locale])
            return (
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
                {BREAKFAST_LOCALE_LABELS[locale]} {complete ? '✓' : '⚠'}
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-serif-display text-xl font-semibold">
                Conteúdo em {BREAKFAST_LOCALE_LABELS[activeLocale]}
              </h3>
              {activeLocale !== 'pt' && (
                <Button type="button" variant="outline" size="sm" onClick={copyFromPortuguese}>
                  <Copy className="h-4 w-4" /> Copiar do Português
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Label da seção</Label>
                <Input value={current.label} onChange={(e) => updateLocale(activeLocale, { label: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Horário do café</Label>
                <Input
                  value={current.hours}
                  onChange={(e) => updateLocale(activeLocale, { hours: e.target.value })}
                  placeholder="Texto do horário no idioma selecionado"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título principal</Label>
              <Input value={current.title} onChange={(e) => updateLocale(activeLocale, { title: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                rows={5}
                value={current.description}
                onChange={(e) => updateLocale(activeLocale, { description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Texto auxiliar/overlay da imagem</Label>
                <Input value={current.note} onChange={(e) => updateLocale(activeLocale, { note: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Alt fallback das imagens</Label>
                <Input
                  value={current.imageAlt}
                  onChange={(e) => updateLocale(activeLocale, { imageAlt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <Label>Destaques / badges</Label>
                <Button type="button" size="sm" variant="outline" onClick={addBadge}>
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </div>
              {current.badges.map((badge, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Item {index + 1}</span>
                  <Input value={badge} onChange={(e) => updateBadge(activeLocale, index, e.target.value)} />
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="ghost" onClick={() => moveBadge(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => moveBadge(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeBadge(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="w-fit"
              disabled={save.isPending}
              onClick={() =>
                save.mutate({
                  ...form,
                  locales: Object.fromEntries(
                    BREAKFAST_LOCALES.map((locale) => [
                      locale,
                      {
                        ...form.locales[locale],
                        badges: form.locales[locale].badges.map((item) => item.trim()).filter(Boolean),
                      },
                    ]),
                  ) as BreakfastContent['locales'],
                })
              }
            >
              <Save className="h-4 w-4" /> {feedback || 'Salvar conteúdo'}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif-display text-xl font-semibold">Fotos do Café ({photos.length})</h3>
                  <p className="text-sm text-muted-foreground">
                    A primeira foto da ordem é a imagem principal do site.
                  </p>
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
                        slot: PHOTO_SLOTS.cafe,
                        alt: current.imageAlt,
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
                        onChange={(e) => setPhotoAlts((currentAlts) => ({ ...currentAlts, [photo.id]: e.target.value }))}
                      />
                    </div>
                    <div className="mt-3 space-y-2">
                      <Label>Descrição curta ({BREAKFAST_LOCALE_LABELS[activeLocale]})</Label>
                      <Input
                        value={photoCaptions[photo.id] ?? ''}
                        maxLength={100}
                        onChange={(e) =>
                          setPhotoCaptions((currentCaptions) => ({
                            ...currentCaptions,
                            [photo.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          updatePhoto.mutate({ id: photo.id, alt: photoAlts[photo.id] ?? '' })
                          setPhotoCaption.mutate({
                            photoId: photo.id,
                            locale: activeLocale,
                            caption: photoCaptions[photo.id] ?? '',
                          })
                        }}
                      >
                        <Save className="h-3.5 w-3.5" /> Salvar
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
                          if (window.confirm('Deseja realmente excluir esta imagem do café?')) {
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
                    Nenhuma foto dinâmica no slot Cafe. O site usará as imagens estáticas de fallback.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
