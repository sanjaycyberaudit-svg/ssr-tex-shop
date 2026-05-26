"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiSettingRecord = {
  key: string;
  isEnabled: boolean;
  value: Record<string, unknown>;
} | null;

type IntegrationsPayload = {
  phonepe: ApiSettingRecord;
  whatsapp: ApiSettingRecord;
};

type FormState = {
  phonepe: {
    enabled: boolean;
    merchantId: string;
    saltKey: string;
    saltIndex: string;
    baseUrl: string;
    merchantUserIdPrefix: string;
  };
  whatsapp: {
    enabled: boolean;
    accessToken: string;
    phoneNumberId: string;
    templateName: string;
    templateLanguage: string;
    notifySeller: boolean;
    sellerMobiles: string;
  };
};

const DEFAULT_FORM: FormState = {
  phonepe: {
    enabled: false,
    merchantId: "",
    saltKey: "",
    saltIndex: "",
    baseUrl: "https://api.phonepe.com/apis/hermes",
    merchantUserIdPrefix: "USR",
  },
  whatsapp: {
    enabled: false,
    accessToken: "",
    phoneNumberId: "",
    templateName: "",
    templateLanguage: "en",
    notifySeller: false,
    sellerMobiles: "",
  },
};

export function ApiIntegrationsForm() {
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
        if (!res.ok) throw new Error("Could not load API settings");

        const payload = (await res.json()) as IntegrationsPayload;
        if (cancelled) return;

        const phonepeValue = payload.phonepe?.value ?? {};
        const whatsappValue = payload.whatsapp?.value ?? {};

        setForm({
          phonepe: {
            enabled: payload.phonepe?.isEnabled ?? false,
            merchantId: String(phonepeValue.merchantId ?? ""),
            saltKey: String(phonepeValue.saltKey ?? ""),
            saltIndex: String(phonepeValue.saltIndex ?? ""),
            baseUrl: String(
              phonepeValue.baseUrl ?? "https://api.phonepe.com/apis/hermes",
            ),
            merchantUserIdPrefix: String(
              phonepeValue.merchantUserIdPrefix ?? "USR",
            ),
          },
          whatsapp: {
            enabled: payload.whatsapp?.isEnabled ?? false,
            accessToken: String(whatsappValue.accessToken ?? ""),
            phoneNumberId: String(whatsappValue.phoneNumberId ?? ""),
            templateName: String(whatsappValue.templateName ?? ""),
            templateLanguage: String(whatsappValue.templateLanguage ?? "en"),
            notifySeller: Boolean(whatsappValue.notifySeller ?? false),
            sellerMobiles: String(whatsappValue.sellerMobiles ?? ""),
          },
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

  const updatePhonePe = <K extends keyof FormState["phonepe"]>(
    key: K,
    value: FormState["phonepe"][K],
  ) => {
    setForm((prev) => ({
      ...prev,
      phonepe: { ...prev.phonepe, [key]: value },
    }));
  };

  const updateWhatsApp = <K extends keyof FormState["whatsapp"]>(
    key: K,
    value: FormState["whatsapp"][K],
  ) => {
    setForm((prev) => ({
      ...prev,
      whatsapp: { ...prev.whatsapp, [key]: value },
    }));
  };

  const saveKey = async (
    key: "phonepe" | "whatsapp",
    body: Record<string, unknown>,
  ) =>
    fetch("/api/admin/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "Save failed");
        throw new Error(text || "Save failed");
      }
    });

  const onSave = async () => {
    setIsSaving(true);
    try {
      await saveKey("phonepe", {
        key: "phonepe",
        isEnabled: form.phonepe.enabled,
        value: {
          merchantId: form.phonepe.merchantId.trim(),
          saltKey: form.phonepe.saltKey.trim(),
          saltIndex: form.phonepe.saltIndex.trim(),
          baseUrl: form.phonepe.baseUrl.trim(),
          merchantUserIdPrefix: form.phonepe.merchantUserIdPrefix.trim(),
        },
      });

      await saveKey("whatsapp", {
        key: "whatsapp",
        isEnabled: form.whatsapp.enabled,
        value: {
          accessToken: form.whatsapp.accessToken.trim(),
          phoneNumberId: form.whatsapp.phoneNumberId.trim(),
          templateName: form.whatsapp.templateName.trim(),
          templateLanguage: form.whatsapp.templateLanguage.trim() || "en",
          notifySeller: form.whatsapp.notifySeller,
          sellerMobiles: form.whatsapp.sellerMobiles.trim(),
        },
      });

      toast({
        title: "API settings saved",
        description: "PhonePe and WhatsApp credentials updated.",
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
          <CardTitle>PhonePe Payment Gateway</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.phonepe.enabled}
              onChange={(e) => updatePhonePe("enabled", e.target.checked)}
            />
            Enable PhonePe checkout
          </label>

          <div className="grid gap-2">
            <Label htmlFor="phonepe-merchant">Merchant ID</Label>
            <Input
              id="phonepe-merchant"
              value={form.phonepe.merchantId}
              onChange={(e) => updatePhonePe("merchantId", e.target.value)}
              placeholder="PGTESTPAYUAT..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phonepe-salt-key">Salt Key</Label>
            <Input
              id="phonepe-salt-key"
              type="password"
              value={form.phonepe.saltKey}
              onChange={(e) => updatePhonePe("saltKey", e.target.value)}
              placeholder="Leave blank to keep existing"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phonepe-salt-index">Salt Index</Label>
            <Input
              id="phonepe-salt-index"
              value={form.phonepe.saltIndex}
              onChange={(e) => updatePhonePe("saltIndex", e.target.value)}
              placeholder="1"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phonepe-base-url">Base URL</Label>
            <Input
              id="phonepe-base-url"
              value={form.phonepe.baseUrl}
              onChange={(e) => updatePhonePe("baseUrl", e.target.value)}
              placeholder="https://api.phonepe.com/apis/hermes"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phonepe-user-prefix">Merchant User Prefix</Label>
            <Input
              id="phonepe-user-prefix"
              value={form.phonepe.merchantUserIdPrefix}
              onChange={(e) =>
                updatePhonePe("merchantUserIdPrefix", e.target.value)
              }
              placeholder="USR"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.whatsapp.enabled}
              onChange={(e) => updateWhatsApp("enabled", e.target.checked)}
            />
            Enable post-payment WhatsApp notification
          </label>

          <div className="grid gap-2">
            <Label htmlFor="wa-token">Access Token</Label>
            <Input
              id="wa-token"
              type="password"
              value={form.whatsapp.accessToken}
              onChange={(e) => updateWhatsApp("accessToken", e.target.value)}
              placeholder="Leave blank to keep existing"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wa-phone-id">Phone Number ID</Label>
            <Input
              id="wa-phone-id"
              value={form.whatsapp.phoneNumberId}
              onChange={(e) => updateWhatsApp("phoneNumberId", e.target.value)}
              placeholder="e.g. 123456789012345"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wa-template-name">Template Name (optional)</Label>
            <Input
              id="wa-template-name"
              value={form.whatsapp.templateName}
              onChange={(e) => updateWhatsApp("templateName", e.target.value)}
              placeholder="order_confirmed"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wa-template-lang">Template Language</Label>
            <Input
              id="wa-template-lang"
              value={form.whatsapp.templateLanguage}
              onChange={(e) =>
                updateWhatsApp("templateLanguage", e.target.value)
              }
              placeholder="en"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.whatsapp.notifySeller}
              onChange={(e) => updateWhatsApp("notifySeller", e.target.checked)}
            />
            Notify seller on each paid order
          </label>
          <div className="grid gap-2">
            <Label htmlFor="wa-seller-mobiles">Seller mobile numbers</Label>
            <Input
              id="wa-seller-mobiles"
              value={form.whatsapp.sellerMobiles}
              onChange={(e) => updateWhatsApp("sellerMobiles", e.target.value)}
              placeholder="7708069049, 9123456789"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={onSave} disabled={saveDisabled}>
        {isSaving ? "Saving..." : "Save API settings"}
      </Button>
    </div>
  );
}
