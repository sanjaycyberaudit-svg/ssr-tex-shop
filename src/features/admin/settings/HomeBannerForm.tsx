"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageDialog } from "@/features/medias";

type ApiSettingRecord = {
  key: string;
  isEnabled: boolean;
  value: Record<string, unknown>;
} | null;

type IntegrationsPayload = {
  homeBannerSlides: ApiSettingRecord;
};

type SlideForm = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  imageAlt: string;
  imageMediaId: string;
  image: string;
};

type FormState = {
  enabled: boolean;
  slides: SlideForm[];
};

const createDefaultSlide = (index: number): SlideForm => ({
  id: `slide-${index}`,
  title: "",
  subtitle: "",
  href: "/shop",
  cta: "Shop now",
  imageAlt: "",
  imageMediaId: "",
  image: "",
});

const DEFAULT_FORM: FormState = {
  enabled: true,
  slides: [createDefaultSlide(1)],
};

const DEFAULT_SUBTITLE = "Discover our latest collections.";
const DEFAULT_TITLE_PREFIX = "Banner Slide";

function normalizeSlideForSave(slide: SlideForm, index: number) {
  const title = slide.title.trim() || `${DEFAULT_TITLE_PREFIX} ${index + 1}`;
  const subtitle = slide.subtitle.trim() || DEFAULT_SUBTITLE;
  const href = slide.href.trim() || "/shop";
  const cta = slide.cta.trim() || "Shop now";
  const imageAlt = slide.imageAlt.trim() || title;

  return {
    id: slide.id.trim() || `slide-${index + 1}`,
    title,
    subtitle,
    href,
    cta,
    imageAlt,
    imageMediaId: slide.imageMediaId.trim(),
    image: slide.image.trim(),
  };
}

export function HomeBannerForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/integrations", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Could not load home banner settings");

        const payload = (await res.json()) as IntegrationsPayload;
        if (cancelled) return;

        const value = payload.homeBannerSlides?.value ?? {};
        const inputSlides = Array.isArray(value.slides) ? value.slides : [];
        const parsedSlides = inputSlides
          .map((slide, index) => {
            const item = slide as Record<string, unknown>;
            return {
              id: String(item.id ?? `slide-${index + 1}`),
              title: String(item.title ?? ""),
              subtitle: String(item.subtitle ?? ""),
              href: String(item.href ?? "/shop"),
              cta: String(item.cta ?? "Shop now"),
              imageAlt: String(item.imageAlt ?? ""),
              imageMediaId: String(item.imageMediaId ?? ""),
              image: String(item.image ?? ""),
            } satisfies SlideForm;
          })
          .filter((slide) => slide.id.trim().length > 0);

        setForm({
          enabled: payload.homeBannerSlides?.isEnabled ?? true,
          slides:
            parsedSlides.length > 0 ? parsedSlides : [createDefaultSlide(1)],
        });
      } catch (error) {
        toast({
          title: "Could not load settings",
          description: error instanceof Error ? error.message : "Please retry",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const saveDisabled = useMemo(
    () => isSaving || isLoading,
    [isSaving, isLoading],
  );

  const updateSlide = <K extends keyof SlideForm>(
    index: number,
    key: K,
    value: SlideForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, i) =>
        i === index ? { ...slide, [key]: value } : slide,
      ),
    }));
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    setForm((prev) => {
      const slides = [...prev.slides];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= slides.length) return prev;
      [slides[index], slides[targetIndex]] = [
        slides[targetIndex],
        slides[index],
      ];
      return { ...prev, slides };
    });
  };

  const addSlide = () => {
    setForm((prev) => ({
      ...prev,
      slides: [...prev.slides, createDefaultSlide(prev.slides.length + 1)],
    }));
  };

  const removeSlide = (index: number) => {
    setForm((prev) => {
      if (prev.slides.length <= 1) return prev;
      return { ...prev, slides: prev.slides.filter((_, i) => i !== index) };
    });
  };

  const onSave = async () => {
    setIsSaving(true);
    try {
      const slides = form.slides.map(normalizeSlideForSave);
      const slideWithoutImage = slides.findIndex(
        (slide) => !slide.imageMediaId && !slide.image,
      );
      if (slideWithoutImage >= 0) {
        throw new Error(
          `Slide ${slideWithoutImage + 1} needs an image (media or fallback URL).`,
        );
      }

      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "home_banner_slides",
          isEnabled: form.enabled,
          value: { slides },
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          message?: string;
          error?: unknown;
        } | null;
        if (payload?.message) {
          throw new Error(payload.message);
        }
        throw new Error("Save failed");
      }

      toast({
        title: "Home banner saved",
        description: "Homepage carousel now uses the updated slide content.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please retry",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Homepage Banner Carousel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, enabled: e.target.checked }))
              }
            />
            Enable admin-managed home banner slides
          </label>
          <p className="text-xs text-muted-foreground">
            Current slides are shown below. Add, reorder, and update text or
            image per slide.
          </p>
        </CardContent>
      </Card>

      {form.slides.map((slide, index) => (
        <Card key={`${slide.id}-${index}`}>
          <CardHeader>
            <CardTitle className="text-base">Slide {index + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => moveSlide(index, "up")}
                disabled={index === 0}
              >
                Move Up
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => moveSlide(index, "down")}
                disabled={index === form.slides.length - 1}
              >
                Move Down
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeSlide(index)}
                disabled={form.slides.length <= 1}
              >
                Remove
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`slide-id-${index}`}>Slide ID</Label>
              <Input
                id={`slide-id-${index}`}
                value={slide.id}
                onChange={(e) => updateSlide(index, "id", e.target.value)}
                placeholder="festive-silk"
              />
            </div>

            <div className="grid gap-2">
              <Label>Slide Image</Label>
              <ImageDialog
                value={slide.imageMediaId}
                defaultValue={slide.imageMediaId}
                onChange={(mediaId) =>
                  updateSlide(index, "imageMediaId", mediaId)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`slide-image-url-${index}`}>
                Slide Image URL (fallback)
              </Label>
              <Input
                id={`slide-image-url-${index}`}
                value={slide.image}
                onChange={(e) => updateSlide(index, "image", e.target.value)}
                placeholder="https://.../banner-image.webp"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`slide-title-${index}`}>Heading</Label>
              <Input
                id={`slide-title-${index}`}
                value={slide.title}
                onChange={(e) => updateSlide(index, "title", e.target.value)}
                placeholder="Festive Silk"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`slide-subtitle-${index}`}>Subheading</Label>
              <Input
                id={`slide-subtitle-${index}`}
                value={slide.subtitle}
                onChange={(e) => updateSlide(index, "subtitle", e.target.value)}
                placeholder="Kanjivaram, soft silk, and wedding weaves..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`slide-cta-${index}`}>Button Text</Label>
              <Input
                id={`slide-cta-${index}`}
                value={slide.cta}
                onChange={(e) => updateSlide(index, "cta", e.target.value)}
                placeholder="Shop now"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`slide-href-${index}`}>Button Link</Label>
              <Input
                id={`slide-href-${index}`}
                value={slide.href}
                onChange={(e) => updateSlide(index, "href", e.target.value)}
                placeholder="/collections/kanjivaram-wedding-sarees"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`slide-alt-${index}`}>Image Alt Text</Label>
              <Input
                id={`slide-alt-${index}`}
                value={slide.imageAlt}
                onChange={(e) => updateSlide(index, "imageAlt", e.target.value)}
                placeholder="Model in Kanjivaram silk saree"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={addSlide}>
          Add Slide
        </Button>
        <Button onClick={onSave} disabled={saveDisabled}>
          {isSaving ? "Saving..." : "Save home banner"}
        </Button>
      </div>
    </div>
  );
}
