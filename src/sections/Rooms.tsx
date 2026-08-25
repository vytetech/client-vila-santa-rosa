import { useRef, useState, type PointerEvent, type TouchEvent } from "react";
import {
  Users,
  DoorOpen,
  Sun,
  Coffee,
  Wifi,
  PawPrint,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicPhoto } from "@/components/PublicPhoto";
import { useReveal } from "@/hooks/useReveal";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBookingRoom } from "@/hooks/useBookingRoom";
import { ROOM_FALLBACK_IMAGES, ROOM_IMAGES, type RoomId } from "@/data/rooms";
import { trpc } from "@/providers/trpc";
import {
  SUITE_IDS,
  mergeSuiteWithDefaults,
  resolveSuiteLocaleWithDefaults,
  type SuiteId,
} from "@contracts/suites-content";
import {
  createSuiteCarouselPhotos,
  type SuiteCarouselPhoto,
} from "@contracts/suite-room-photos";

const PERK_ICONS = [Coffee, Wifi, PawPrint];

function guestLabel(locale: string, count: number) {
  if (locale === "pt")
    return `${count} ${count === 1 ? "hóspede" : "hóspedes"}`;
  if (locale === "es")
    return `${count} ${count === 1 ? "huésped" : "huéspedes"}`;
  if (locale === "fr")
    return `${count} ${count === 1 ? "personne" : "personnes"}`;
  if (locale === "ar") return `${count} ضيف`;
  if (locale === "zh") return `${count} 位客人`;
  if (locale === "ja") return `${count}名様`;
  return `${count} ${count === 1 ? "guest" : "guests"}`;
}

function petLabel(locale: string, count: number) {
  if (locale === "pt") return `Até ${count} ${count === 1 ? "pet" : "pets"}`;
  if (locale === "es")
    return `Hasta ${count} ${count === 1 ? "mascota" : "mascotas"}`;
  if (locale === "fr")
    return `Jusqu’à ${count} ${count === 1 ? "animal" : "animaux"}`;
  if (locale === "ar") return `حتى ${count} حيوان أليف`;
  if (locale === "zh") return `最多 ${count} 只宠物`;
  if (locale === "ja") return `ペット最大${count}匹`;
  return `Up to ${count} ${count === 1 ? "pet" : "pets"}`;
}

function SuitePhotoCarousel({
  photos,
  fallbackSrc,
}: {
  photos: SuiteCarouselPhoto[];
  fallbackSrc: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const lastPointerSwipeAt = useRef(0);
  const hasMultiplePhotos = photos.length > 1;

  const goToPrevious = () => {
    setCurrentIndex(current =>
      current === 0 ? photos.length - 1 : current - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex(current =>
      current === photos.length - 1 ? 0 : current + 1
    );
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!hasMultiplePhotos) return;
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!hasMultiplePhotos || touchStartX.current === null) return;
    if (Date.now() - lastPointerSwipeAt.current < 400) {
      touchStartX.current = null;
      return;
    }
    const touchEndX = event.changedTouches[0]?.clientX;
    const deltaX = touchStartX.current - (touchEndX ?? touchStartX.current);
    touchStartX.current = null;
    if (touchEndX === undefined) return;
    if (Math.abs(deltaX) < 40) return;
    lastPointerSwipeAt.current = Date.now();
    if (deltaX > 0) {
      goToNext();
    } else {
      goToPrevious();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasMultiplePhotos || event.pointerType === "mouse") return;
    pointerStartX.current = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasMultiplePhotos || pointerStartX.current === null) return;
    const deltaX = pointerStartX.current - event.clientX;
    pointerStartX.current = null;
    if (Math.abs(deltaX) < 40) return;
    lastPointerSwipeAt.current = Date.now();
    if (deltaX > 0) {
      goToNext();
    } else {
      goToPrevious();
    }
  };

  return (
    <div
      className="relative overflow-hidden"
      aria-label="Fotos da suíte"
      role="region"
      data-slot="carousel"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div data-slot="carousel-content" className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {photos.map((photo, index) => (
            <div
              key={photo.key}
              className="min-w-0 shrink-0 grow-0 basis-full"
              aria-hidden={index !== currentIndex}
            >
              <PublicPhoto
                src={photo.src}
                fallbackSrc={photo.fallbackSrc || fallbackSrc}
                alt={photo.alt}
                draggable={false}
                loading={index === 0 ? "eager" : "lazy"}
                data-photo-slot={photo.slot}
                className="aspect-[3/2] w-full select-none object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
      {hasMultiplePhotos && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            data-slot="carousel-previous"
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-foreground shadow-md transition hover:bg-white"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            data-slot="carousel-next"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-foreground shadow-md transition hover:bg-white"
            aria-label="Próxima foto"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((photo, index) => (
              <span
                key={`${photo.key}-dot`}
                className={`h-1.5 rounded-full bg-white/85 shadow-sm transition-all ${
                  index === currentIndex ? "w-4" : "w-1.5"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
export default function Rooms() {
  const ref = useReveal<HTMLElement>();
  const { d, locale } = useLanguage();
  const { setRoomId } = useBookingRoom();
  const suitesQuery = trpc.suites.publicList.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
  });
  const suites = suitesQuery.data?.suites ?? [];
  const visibleSuites = SUITE_IDS.map(roomId => {
    const dynamicSuite = suites.find(suite => suite.roomId === roomId);
    const merged = mergeSuiteWithDefaults(dynamicSuite, roomId);
    return {
      ...merged,
      photos: dynamicSuite?.photos?.length ? dynamicSuite.photos : [],
    };
  })
    .filter(suite => suite.enabled !== false)
    .sort((a, b) => a.order - b.order);

  return (
    <section id="acomodacoes" ref={ref} className="bg-muted/50 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {d.rooms.kicker}
          </p>
          <h2 className="font-serif-display text-4xl font-semibold sm:text-5xl">
            {d.rooms.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {d.rooms.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {visibleSuites.map(room => {
            const t = resolveSuiteLocaleWithDefaults(
              room,
              room.roomId as SuiteId,
              locale
            );
            const roomId = room.roomId as RoomId;
            const carouselPhotos = createSuiteCarouselPhotos(
              room.roomId as SuiteId,
              room.photos,
              ROOM_FALLBACK_IMAGES[roomId],
              t.publicName
            );
            return (
              <Card
                key={room.roomId}
                className="reveal group overflow-hidden border-0 bg-card shadow-lg transition-shadow hover:shadow-2xl"
              >
                <div className="relative overflow-hidden">
                  <SuitePhotoCarousel
                    photos={carouselPhotos}
                    fallbackSrc={ROOM_IMAGES[roomId]}
                  />
                  {room.roomId === "marrok" && (
                    <Badge className="absolute start-4 top-4 bg-accent text-accent-foreground">
                      {d.rooms.highlight}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-6">
                  <h3 className="font-serif-display text-2xl font-semibold">
                    {t.publicName}
                  </h3>
                  {t.subtitle && (
                    <p className="mt-1 text-sm font-medium text-primary">
                      {t.subtitle}
                    </p>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t.shortDescription}
                  </p>

                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-primary" />{" "}
                      {guestLabel(locale, room.maxGuests)}
                    </p>
                    {room.maxPets > 0 && (
                      <p className="flex items-center gap-2">
                        <PawPrint className="h-4 w-4 shrink-0 text-primary" />{" "}
                        {petLabel(locale, room.maxPets)}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4 shrink-0 text-primary" />{" "}
                      {t.type}
                    </p>
                    <p className="flex items-center gap-2">
                      <Sun className="h-4 w-4 shrink-0 text-primary" />{" "}
                      {t.location}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {t.amenities.map(f => (
                      <span
                        key={f}
                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  <Button
                    asChild
                    className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <a href="#reservas" onClick={() => setRoomId(roomId)}>
                      {d.rooms.reserve}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="reveal mt-8 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-5 py-2 text-sm font-semibold text-accent-foreground ring-1 ring-accent/40">
            {d.rooms.discountBadge}
          </span>
        </div>

        <p className="reveal mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {d.rooms.perks.map((perk, i) => {
            const Icon = PERK_ICONS[i];
            return (
              <span key={perk} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" /> {perk}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
