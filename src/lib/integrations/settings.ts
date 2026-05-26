import db from "@/lib/supabase/db";
import { apiSettings, medias } from "@/lib/supabase/schema";
import { eq, inArray } from "drizzle-orm";
import { keytoUrl } from "@/lib/utils";

export const INTEGRATION_KEYS = {
  phonepe: "phonepe",
  whatsapp: "whatsapp",
  storefrontSocial: "storefront_social",
  homeBannerSlides: "home_banner_slides",
} as const;

export type IntegrationKey =
  (typeof INTEGRATION_KEYS)[keyof typeof INTEGRATION_KEYS];

export type StorefrontSocialLinks = {
  instagram?: string;
  youtube?: string;
  facebook?: string;
  whatsapp?: string;
};

export type HomeBannerSlide = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  image: string;
  imageAlt: string;
};

export type PhonePeConfig = {
  merchantId: string;
  saltKey: string;
  saltIndex: string;
  baseUrl: string;
  merchantUserIdPrefix?: string;
  enabled: boolean;
};

export type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  templateName?: string;
  templateLanguage?: string;
  notifySeller: boolean;
  sellerMobiles: string[];
  enabled: boolean;
};

export async function getIntegrationSetting(key: IntegrationKey) {
  const setting = await db.query.apiSettings.findFirst({
    where: eq(apiSettings.key, key),
  });

  return setting ?? null;
}

export async function upsertIntegrationSetting(
  key: IntegrationKey,
  value: Record<string, unknown>,
  isEnabled: boolean,
  updatedBy?: string | null,
) {
  await db
    .insert(apiSettings)
    .values({
      key,
      value,
      isEnabled,
      updatedBy: updatedBy ?? null,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: apiSettings.key,
      set: {
        value,
        isEnabled,
        updatedBy: updatedBy ?? null,
        updatedAt: new Date().toISOString(),
      },
    });
}

export async function getPhonePeConfig(): Promise<PhonePeConfig | null> {
  const setting = await getIntegrationSetting(INTEGRATION_KEYS.phonepe);
  if (!setting || !setting.isEnabled) return null;

  const value = setting.value as Record<string, unknown>;
  const merchantId = String(value.merchantId ?? "").trim();
  const saltKey = String(value.saltKey ?? "").trim();
  const saltIndex = String(value.saltIndex ?? "").trim();
  const baseUrl = String(value.baseUrl ?? "").trim();

  if (!merchantId || !saltKey || !saltIndex || !baseUrl) return null;

  return {
    merchantId,
    saltKey,
    saltIndex,
    baseUrl,
    merchantUserIdPrefix: String(value.merchantUserIdPrefix ?? "").trim(),
    enabled: true,
  };
}

export async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  const setting = await getIntegrationSetting(INTEGRATION_KEYS.whatsapp);
  if (!setting || !setting.isEnabled) return null;

  const value = setting.value as Record<string, unknown>;
  const accessToken = String(value.accessToken ?? "").trim();
  const phoneNumberId = String(value.phoneNumberId ?? "").trim();
  const notifySeller = Boolean(value.notifySeller);
  const sellerMobilesRaw = String(value.sellerMobiles ?? "");
  const sellerMobiles = sellerMobilesRaw
    .split(/[\n,]/)
    .map((mobile) => mobile.trim())
    .filter(Boolean);

  if (!accessToken || !phoneNumberId) return null;

  return {
    accessToken,
    phoneNumberId,
    templateName: String(value.templateName ?? "").trim(),
    templateLanguage: String(value.templateLanguage ?? "en").trim() || "en",
    notifySeller,
    sellerMobiles,
    enabled: true,
  };
}

export async function getStorefrontSocialLinks(): Promise<StorefrontSocialLinks | null> {
  const setting = await getIntegrationSetting(
    INTEGRATION_KEYS.storefrontSocial,
  );
  if (!setting || !setting.isEnabled) return null;

  const value = setting.value as Record<string, unknown>;
  return {
    instagram: String(value.instagram ?? "").trim() || undefined,
    youtube: String(value.youtube ?? "").trim() || undefined,
    facebook: String(value.facebook ?? "").trim() || undefined,
    whatsapp: String(value.whatsapp ?? "").trim() || undefined,
  };
}

export async function getHomeBannerSlides(): Promise<HomeBannerSlide[] | null> {
  const setting = await getIntegrationSetting(
    INTEGRATION_KEYS.homeBannerSlides,
  );
  if (!setting || !setting.isEnabled) return null;

  const rawSlides = (setting.value as Record<string, unknown>).slides;
  if (!Array.isArray(rawSlides)) return null;

  const mediaIds = rawSlides
    .map((slide) =>
      String((slide as Record<string, unknown>).imageMediaId ?? "").trim(),
    )
    .filter(Boolean);

  const mediaLookup = new Map<string, string>();
  if (mediaIds.length > 0) {
    const mediaRows = await db
      .select({ id: medias.id, key: medias.key })
      .from(medias)
      .where(inArray(medias.id, mediaIds));
    mediaRows.forEach((row) => mediaLookup.set(row.id, keytoUrl(row.key)));
  }

  const slides = rawSlides
    .map((slide, index) => {
      const item = slide as Record<string, unknown>;
      const title = String(item.title ?? "").trim();
      const subtitle = String(item.subtitle ?? "").trim();
      const href = String(item.href ?? "").trim();
      const cta = String(item.cta ?? "").trim();
      const imageMediaId = String(item.imageMediaId ?? "").trim();
      const image =
        mediaLookup.get(imageMediaId) ?? String(item.image ?? "").trim();
      const imageAlt = String(item.imageAlt ?? "").trim();
      const id = String(item.id ?? "").trim() || `slide-${index + 1}`;

      if (!title || !subtitle || !href || !cta || !image || !imageAlt) {
        return null;
      }

      return {
        id,
        title,
        subtitle,
        href,
        cta,
        image,
        imageAlt,
      } satisfies HomeBannerSlide;
    })
    .filter((slide): slide is HomeBannerSlide => Boolean(slide));

  return slides.length > 0 ? slides : null;
}
