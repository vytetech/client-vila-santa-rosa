import { useState } from "react";
import { ImagePlus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/providers/trpc";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  PHOTO_SLOTS,
  SITE_PHOTO_SLOT_LABELS,
  SITE_PHOTO_SLOTS,
  type SitePhotoSlot,
} from "@contracts/site-photos";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function PhotosManager() {
  const { d } = useLanguage();
  const utils = trpc.useUtils();

  const photos = trpc.photos.all.useQuery();
  const [slot, setSlot] = useState<SitePhotoSlot>(PHOTO_SLOTS.galeria);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [altEdits, setAltEdits] = useState<Record<number, string>>({});
  const invalidatePhotos = (changedSlot?: SitePhotoSlot) => {
    utils.photos.all.invalidate();
    if (changedSlot) {
      utils.photos.list.invalidate({ slot: changedSlot });
      if (
        changedSlot.startsWith("suite:") ||
        changedSlot === PHOTO_SLOTS.quartos
      ) {
        utils.suites.adminList.invalidate();
        utils.suites.publicList.invalidate();
      }
      return;
    }
    utils.photos.list.invalidate();
    utils.suites.adminList.invalidate();
    utils.suites.publicList.invalidate();
  };

  const upload = trpc.photos.upload.useMutation({
    onSuccess: (_data, variables) => {
      setFeedback("✓");
      setTimeout(() => setFeedback(""), 2500);
      setAlt("");
      invalidatePhotos(variables.slot);
    },
    onError: e => setFeedback(e.message),
  });
  const update = trpc.photos.update.useMutation({
    onSuccess: (_data, variables) => {
      const currentSlot = photos.data?.find(photo => photo.id === variables.id)
        ?.slot as SitePhotoSlot | undefined;
      invalidatePhotos(variables.slot ?? currentSlot);
    },
  });
  const remove = trpc.photos.remove.useMutation({
    onMutate: variables => {
      return {
        slot: photos.data?.find(photo => photo.id === variables.id)?.slot as
          SitePhotoSlot | undefined,
      };
    },
    onSuccess: (_data, _variables, context) => {
      invalidatePhotos(context?.slot);
    },
  });

  const onFiles = async (files: FileList | null) => {
    if (!files || busy) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await readAsDataUrl(file);
        await upload.mutateAsync({ slot, alt, filename: file.name, dataUrl });
      }
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Falha ao enviar imagem."
      );
    } finally {
      setBusy(false);
    }
  };

  const grouped = SITE_PHOTO_SLOTS.map(s => ({
    slot: s,
    items: (photos.data ?? []).filter(p => p.slot === s),
  }));

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h2 className="font-serif-display text-2xl font-semibold">
          {d.admin.photosTitle}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {d.admin.photosHint}
        </p>

        {/* Upload */}
        <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium">{d.admin.photosGroup}</label>
            <div className="flex flex-wrap gap-2">
              {SITE_PHOTO_SLOTS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                    slot === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  ].join(" ")}
                >
                  {SITE_PHOTO_SLOT_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <Input
            className="w-56"
            placeholder={d.admin.photosAlt}
            value={alt}
            onChange={e => setAlt(e.target.value)}
          />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <ImagePlus className="h-4 w-4" />
            {busy ? "…" : feedback || d.admin.photosAdd}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={e => {
                void onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {/* List by slot */}
        {grouped.map(({ slot: s, items }) => (
          <div key={s} className="mt-6">
            <h3 className="mb-2 text-sm font-semibold capitalize">
              {SITE_PHOTO_SLOT_LABELS[s]}{" "}
              <span className="font-normal text-muted-foreground">
                ({items.length})
              </span>
            </h3>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {d.admin.photosEmpty}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map(p => (
                  <div key={p.id} className="overflow-hidden rounded-xl border">
                    <img
                      src={p.path}
                      alt={p.alt}
                      className="h-32 w-full object-cover"
                    />
                    <div className="space-y-2 p-2">
                      <Input
                        className="h-8 text-xs"
                        placeholder={d.admin.photosAlt}
                        value={altEdits[p.id] ?? p.alt}
                        onChange={e =>
                          setAltEdits({ ...altEdits, [p.id]: e.target.value })
                        }
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1 text-xs"
                          disabled={update.isPending}
                          onClick={() =>
                            update.mutate({
                              id: p.id,
                              alt: altEdits[p.id] ?? p.alt,
                            })
                          }
                        >
                          <Save className="me-1 h-3 w-3" /> {d.admin.save}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 text-xs"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: p.id })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
