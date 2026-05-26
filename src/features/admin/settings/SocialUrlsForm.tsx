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
  storefrontSocial: ApiSettingRecord;
};

type FormState = {
  enabled: boolean;
  instagram: string;
  youtube: string;
  facebook: string;
  whatsapp: string;
};

const DEFAULT_FORM: FormState = {
  enabled: true,
  instagram: "",
  youtube: "",
  facebook: "",
  whatsapp: "",
};

export function SocialUrlsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/integrations", { cache: "no-store" });
        if (!res.ok) throw new Error("Could not load social URL settings");

        const payload = (await res.json()) as IntegrationsPayload;
        if (cancelled) return;

        const value = payload.storefrontSocial?.value ?? {};

        setForm({
          enabled: payload.storefrontSocial?.isEnabled ?? true,
          instagram: String(value.instagram ?? ""),
          youtube: String(value.youtube ?? ""),
          facebook: String(value.facebook ?? ""),
          whatsapp: String(value.whatsapp ?? ""),
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

  const saveDisabled = useMemo(() => isSaving || isLoading, [isSaving, isLoading]);

  const onSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "storefront_social",
          isEnabled: form.enabled,
          value: {
            instagram: form.instagram.trim(),
            youtube: form.youtube.trim(),
            facebook: form.facebook.trim(),
            whatsapp: form.whatsapp.trim(),
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "Save failed");
        throw new Error(text || "Save failed");
      }

      toast({
        title: "Social URLs saved",
        description: "Contact page links will now use these values.",
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
          <CardTitle>Storefront Social URLs</CardTitle>
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
            Enable admin-managed social links
          </label>
          <div className="grid gap-2">
            <Label htmlFor="social-instagram">Instagram URL</Label>
            <Input
              id="social-instagram"
              value={form.instagram}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, instagram: e.target.value }))
              }
              placeholder="https://www.instagram.com/..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="social-youtube">YouTube URL</Label>
            <Input
              id="social-youtube"
              value={form.youtube}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, youtube: e.target.value }))
              }
              placeholder="https://www.youtube.com/..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="social-facebook">Facebook URL</Label>
            <Input
              id="social-facebook"
              value={form.facebook}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, facebook: e.target.value }))
              }
              placeholder="https://www.facebook.com/..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="social-whatsapp">WhatsApp URL</Label>
            <Input
              id="social-whatsapp"
              value={form.whatsapp}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, whatsapp: e.target.value }))
              }
              placeholder="https://wa.me/9177..."
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={onSave} disabled={saveDisabled}>
        {isSaving ? "Saving..." : "Save social URLs"}
      </Button>
    </div>
  );
}
