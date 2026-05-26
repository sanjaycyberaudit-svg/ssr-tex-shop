import { getSessionUser, isAdminUser } from "@/lib/auth/admin";
import {
  INTEGRATION_KEYS,
  upsertIntegrationSetting,
  getIntegrationSetting,
} from "@/lib/integrations/settings";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const keySchema = z.enum([
  INTEGRATION_KEYS.phonepe,
  INTEGRATION_KEYS.whatsapp,
  INTEGRATION_KEYS.storefrontSocial,
  INTEGRATION_KEYS.homeBannerSlides,
]);

const saveSchema = z.object({
  key: keySchema,
  isEnabled: z.boolean(),
  value: z.record(z.any()),
});

const secretFieldsByKey: Record<string, string[]> = {
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

  const [phonepe, whatsapp, storefrontSocial, homeBannerSlides] =
    await Promise.all([
      getIntegrationSetting(INTEGRATION_KEYS.phonepe),
      getIntegrationSetting(INTEGRATION_KEYS.whatsapp),
      getIntegrationSetting(INTEGRATION_KEYS.storefrontSocial),
      getIntegrationSetting(INTEGRATION_KEYS.homeBannerSlides),
    ]);

  return NextResponse.json({
    phonepe: phonepe ?? null,
    whatsapp: whatsapp ?? null,
    storefrontSocial: storefrontSocial ?? null,
    homeBannerSlides: homeBannerSlides ?? null,
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

  if (key === INTEGRATION_KEYS.homeBannerSlides) {
    const homeParsed = homeBannerPayloadSchema.safeParse(incomingValue);
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
  }

  const current = await getIntegrationSetting(key);
  const existingValue = (current?.value ?? {}) as Record<string, unknown>;

  const secretFields = secretFieldsByKey[key] ?? [];
  const mergedValue = { ...existingValue, ...incomingValue };

  for (const secretField of secretFields) {
    const incoming = String(incomingValue?.[secretField] ?? "");
    if (!incoming.trim()) {
      mergedValue[secretField] = existingValue?.[secretField] ?? "";
    }
  }

  await upsertIntegrationSetting(key, mergedValue, isEnabled, user.id);

  return NextResponse.json({ ok: true });
}
