import { getSessionUser, isAdminUser } from "@/lib/auth/admin";
import {
  INTEGRATION_KEYS,
  upsertIntegrationSetting,
  getIntegrationSetting,
} from "@/lib/integrations/settings";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const keySchema = z.enum([
  INTEGRATION_KEYS.cashfree,
  INTEGRATION_KEYS.phonepe,
  INTEGRATION_KEYS.whatsapp,
  INTEGRATION_KEYS.storefrontSocial,
  INTEGRATION_KEYS.homeBannerSlides,
  INTEGRATION_KEYS.announcementBar,
]);

const saveSchema = z.object({
  key: keySchema,
  isEnabled: z.boolean(),
  value: z.record(z.any()),
});

const secretFieldsByKey: Record<string, string[]> = {
  [INTEGRATION_KEYS.cashfree]: ["clientSecret"],
  [INTEGRATION_KEYS.phonepe]: ["saltKey"],
  [INTEGRATION_KEYS.whatsapp]: ["accessToken"],
};

const homeBannerSlideSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    subtitle: z.string().trim().min(1),
    href: z.string().trim().min(1),
    cta: z.string().trim().min(1),
    imageMediaId: z.string().trim().optional(),
    image: z.string().trim().optional(),
    imageAlt: z.string().trim().min(1),
  })
  .superRefine((value, ctx) => {
    if (!value.imageMediaId?.trim() && !value.image?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each banner slide needs either imageMediaId or image URL.",
        path: ["image"],
      });
    }
  });

const homeBannerPayloadSchema = z.object({
  slides: z.array(homeBannerSlideSchema).min(1).max(12),
});
const HOME_DEFAULT_SUBTITLE = "Discover our latest collections.";

const announcementLineSchema = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(1),
  href: z.string().trim().min(1),
  cta: z.string().trim().min(1),
});

const announcementBarPayloadSchema = z.object({
  announcements: z.array(announcementLineSchema).min(1).max(20),
});

const cashfreePayloadSchema = z.object({
  clientId: z.string().trim().min(1),
  clientSecret: z.string().trim().min(1),
  baseUrl: z.string().trim().url(),
  apiVersion: z.string().trim().min(1),
  environment: z.enum(["sandbox", "production"]),
});

const phonepePayloadSchema = z.object({
  merchantId: z.string().trim().min(1),
  saltKey: z.string().trim().min(1),
  saltIndex: z.string().trim().min(1),
  baseUrl: z.string().trim().url(),
  merchantUserIdPrefix: z.string().trim().max(16).optional(),
});

const whatsappPayloadSchema = z.object({
  accessToken: z.string().trim().min(1),
  phoneNumberId: z.string().trim().min(1),
  templateName: z.string().trim().optional(),
  templateLanguage: z.string().trim().min(2).default("en"),
  notifySeller: z.boolean().default(false),
  sellerMobiles: z.string().trim().default(""),
});

async function ensureAdmin() {
  const user = await getSessionUser();
  const isAdmin = await isAdminUser(user);
  if (!user || !isAdmin) return null;
  return user;
}

export async function GET() {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [
    cashfree,
    phonepe,
    whatsapp,
    storefrontSocial,
    homeBannerSlides,
    announcementBar,
  ] = await Promise.all([
    getIntegrationSetting(INTEGRATION_KEYS.cashfree),
    getIntegrationSetting(INTEGRATION_KEYS.phonepe),
    getIntegrationSetting(INTEGRATION_KEYS.whatsapp),
    getIntegrationSetting(INTEGRATION_KEYS.storefrontSocial),
    getIntegrationSetting(INTEGRATION_KEYS.homeBannerSlides),
    getIntegrationSetting(INTEGRATION_KEYS.announcementBar),
  ]);

  return NextResponse.json({
    cashfree: cashfree ?? null,
    phonepe: phonepe ?? null,
    whatsapp: whatsapp ?? null,
    storefrontSocial: storefrontSocial ?? null,
    homeBannerSlides: homeBannerSlides ?? null,
    announcementBar: announcementBar ?? null,
  });
}

export async function POST(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = saveSchema.safeParse(payload);
  if (!parsed.success) {
    const parseError = parsed as z.SafeParseError<z.infer<typeof saveSchema>>;
    return NextResponse.json(
      { message: "Invalid payload", error: parseError.error.flatten() },
      { status: 400 },
    );
  }

  const { key, isEnabled } = parsed.data;
  const incomingValue = parsed.data.value as Record<string, unknown>;
  const normalizedValue = { ...incomingValue } as Record<string, unknown>;

  if (key === INTEGRATION_KEYS.homeBannerSlides) {
    const rawSlides = Array.isArray(incomingValue.slides)
      ? incomingValue.slides
      : [];
    const fallbackSlides = rawSlides.map((slide, index) => {
      const item = slide as Record<string, unknown>;
      const title =
        String(item.title ?? "").trim() || `Banner Slide ${index + 1}`;
      return {
        id: String(item.id ?? "").trim() || `slide-${index + 1}`,
        title,
        subtitle: String(item.subtitle ?? "").trim() || HOME_DEFAULT_SUBTITLE,
        href: String(item.href ?? "").trim() || "/shop",
        cta: String(item.cta ?? "").trim() || "Shop now",
        imageAlt: String(item.imageAlt ?? "").trim() || title,
        imageMediaId: String(item.imageMediaId ?? "").trim(),
        image: String(item.image ?? "").trim(),
      };
    });

    const homeParsed = homeBannerPayloadSchema.safeParse({
      slides: fallbackSlides,
    });
    if (!homeParsed.success) {
      const homeParseError = homeParsed as z.SafeParseError<
        z.infer<typeof homeBannerPayloadSchema>
      >;
      return NextResponse.json(
        {
          message: "Invalid home banner payload",
          error: homeParseError.error.flatten(),
        },
        { status: 400 },
      );
    }

    normalizedValue.slides = homeParsed.data.slides;
  }

  if (key === INTEGRATION_KEYS.cashfree) {
    const cashfreeParsed = cashfreePayloadSchema
      .partial({ clientSecret: true })
      .safeParse({
        clientId: String(incomingValue.clientId ?? "").trim(),
        clientSecret: String(incomingValue.clientSecret ?? "").trim(),
        baseUrl:
          String(incomingValue.baseUrl ?? "").trim() ||
          "https://sandbox.cashfree.com/pg",
        apiVersion:
          String(incomingValue.apiVersion ?? "").trim() || "2025-01-01",
        environment:
          String(incomingValue.environment ?? "sandbox")
            .trim()
            .toLowerCase() === "production"
            ? "production"
            : "sandbox",
      });
    if (!cashfreeParsed.success) {
      const cashfreeParseError = cashfreeParsed as z.SafeParseError<
        z.infer<typeof cashfreePayloadSchema>
      >;
      return NextResponse.json(
        {
          message: "Invalid Cashfree payload",
          error: cashfreeParseError.error.flatten(),
        },
        { status: 400 },
      );
    }
    Object.assign(normalizedValue, cashfreeParsed.data);
  }

  if (key === INTEGRATION_KEYS.phonepe) {
    const phonepeParsed = phonepePayloadSchema
      .partial({ saltKey: true })
      .safeParse({
        merchantId: String(incomingValue.merchantId ?? "").trim(),
        saltKey: String(incomingValue.saltKey ?? "").trim(),
        saltIndex: String(incomingValue.saltIndex ?? "").trim(),
        baseUrl:
          String(incomingValue.baseUrl ?? "").trim() ||
          "https://api.phonepe.com/apis/hermes",
        merchantUserIdPrefix:
          String(incomingValue.merchantUserIdPrefix ?? "").trim() || "USR",
      });
    if (!phonepeParsed.success) {
      const phonepeParseError = phonepeParsed as z.SafeParseError<
        z.infer<typeof phonepePayloadSchema>
      >;
      return NextResponse.json(
        {
          message: "Invalid PhonePe payload",
          error: phonepeParseError.error.flatten(),
        },
        { status: 400 },
      );
    }
    Object.assign(normalizedValue, phonepeParsed.data);
  }

  if (key === INTEGRATION_KEYS.whatsapp) {
    const whatsappParsed = whatsappPayloadSchema
      .partial({ accessToken: true })
      .safeParse({
        accessToken: String(incomingValue.accessToken ?? "").trim(),
        phoneNumberId: String(incomingValue.phoneNumberId ?? "").trim(),
        templateName: String(incomingValue.templateName ?? "").trim(),
        templateLanguage:
          String(incomingValue.templateLanguage ?? "")
            .trim()
            .toLowerCase() || "en",
        notifySeller: Boolean(incomingValue.notifySeller ?? false),
        sellerMobiles: String(incomingValue.sellerMobiles ?? "").trim(),
      });
    if (!whatsappParsed.success) {
      const whatsappParseError = whatsappParsed as z.SafeParseError<
        z.infer<typeof whatsappPayloadSchema>
      >;
      return NextResponse.json(
        {
          message: "Invalid WhatsApp payload",
          error: whatsappParseError.error.flatten(),
        },
        { status: 400 },
      );
    }
    Object.assign(normalizedValue, whatsappParsed.data);
  }

  if (key === INTEGRATION_KEYS.announcementBar) {
    const rawLines = Array.isArray(incomingValue.announcements)
      ? incomingValue.announcements
      : [];
    const fallbackLines = rawLines.map((line, index) => {
      const item = line as Record<string, unknown>;
      return {
        id: String(item.id ?? "").trim() || `line-${index + 1}`,
        text: String(item.text ?? "").trim(),
        href: String(item.href ?? "").trim() || "/shop",
        cta: String(item.cta ?? "").trim() || "Shop now",
      };
    });

    const announcementParsed = announcementBarPayloadSchema.safeParse({
      announcements: fallbackLines,
    });
    if (!announcementParsed.success) {
      const announcementParseError = announcementParsed as z.SafeParseError<
        z.infer<typeof announcementBarPayloadSchema>
      >;
      return NextResponse.json(
        {
          message: "Invalid announcement bar payload",
          error: announcementParseError.error.flatten(),
        },
        { status: 400 },
      );
    }

    normalizedValue.announcements = announcementParsed.data.announcements;
  }

  const current = await getIntegrationSetting(key);
  const existingValue = (current?.value ?? {}) as Record<string, unknown>;

  const secretFields = secretFieldsByKey[key] ?? [];
  const mergedValue = { ...existingValue, ...normalizedValue };

  for (const secretField of secretFields) {
    const incoming = String(normalizedValue?.[secretField] ?? "");
    if (!incoming.trim()) {
      mergedValue[secretField] = existingValue?.[secretField] ?? "";
    }
  }

  if (key === INTEGRATION_KEYS.phonepe && isEnabled) {
    const validated = phonepePayloadSchema.safeParse(mergedValue);
    if (!validated.success) {
      const parseError = validated as z.SafeParseError<
        z.infer<typeof phonepePayloadSchema>
      >;
      return NextResponse.json(
        {
          message: "PhonePe settings are incomplete for enabled mode",
          error: parseError.error.flatten(),
        },
        { status: 400 },
      );
    }
  }

  if (key === INTEGRATION_KEYS.cashfree && isEnabled) {
    const validated = cashfreePayloadSchema.safeParse(mergedValue);
    if (!validated.success) {
      const parseError = validated as z.SafeParseError<
        z.infer<typeof cashfreePayloadSchema>
      >;
      return NextResponse.json(
        {
          message: "Cashfree settings are incomplete for enabled mode",
          error: parseError.error.flatten(),
        },
        { status: 400 },
      );
    }
  }

  if (key === INTEGRATION_KEYS.whatsapp && isEnabled) {
    const validated = whatsappPayloadSchema.safeParse(mergedValue);
    if (!validated.success) {
      const parseError = validated as z.SafeParseError<
        z.infer<typeof whatsappPayloadSchema>
      >;
      return NextResponse.json(
        {
          message: "WhatsApp settings are incomplete for enabled mode",
          error: parseError.error.flatten(),
        },
        { status: 400 },
      );
    }
  }

  await upsertIntegrationSetting(key, mergedValue, isEnabled, user.id);

  if (key === INTEGRATION_KEYS.storefrontSocial) {
    revalidatePath("/", "layout");
    revalidatePath("/contact");
  }

  if (key === INTEGRATION_KEYS.homeBannerSlides) {
    revalidatePath("/");
  }

  if (key === INTEGRATION_KEYS.announcementBar) {
    revalidatePath("/", "layout");
  }

  return NextResponse.json({ ok: true });
}
