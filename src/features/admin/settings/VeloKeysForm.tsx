"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type KeyRecord = {
  id: string;
  clientName: string;
  keyPrefix: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

type KeysPayload = {
  keys: KeyRecord[];
};

type CreatedPayload = {
  created: {
    id: string;
    clientName: string;
    keyPrefix: string;
    apiKey: string;
  };
};

export function VeloKeysForm() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [latestApiKey, setLatestApiKey] = useState("");

  const usageSnippet = useMemo(() => {
    const key = latestApiKey || "YOUR_VELO_API_KEY";
    return [
      "const apiKey = '" + key + "';",
      "let since = new Date(0).toISOString();",
      "",
      "async function pollOrders() {",
      "  const res = await fetch(",
      "    `https://sakthi-textiles-shop.vercel.app/api/velo/orders?since=${encodeURIComponent(since)}&limit=50`,",
      "    { headers: { 'x-velo-key': apiKey } },",
      "  );",
      "  if (!res.ok) throw new Error('Failed to fetch orders');",
      "  const data = await res.json();",
      "  if (Array.isArray(data.orders)) {",
      "    data.orders.forEach((order) => {",
      "      console.log('New paid order:', order.orderId, order.customer?.mobile, order.address);",
      "      // Push to your Velo DB/app here",
      "    });",
      "  }",
      "  since = data.nextSince || since;",
      "}",
      "",
      "setInterval(() => {",
      "  pollOrders().catch(console.error);",
      "}, 15000);",
    ].join("\n");
  }, [latestApiKey]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/velo/keys", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load Velo keys");
      const payload = (await res.json()) as KeysPayload;
      setKeys(payload.keys ?? []);
    } catch (error) {
      toast({
        title: "Could not load Velo keys",
        description: error instanceof Error ? error.message : "Please retry",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createKey = async () => {
    if (!clientName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/velo/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: clientName.trim() }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Could not create key");
        throw new Error(text || "Could not create key");
      }
      const payload = (await res.json()) as CreatedPayload;
      setLatestApiKey(payload.created.apiKey);
      setClientName("");
      await load();
      toast({
        title: "Velo key created",
        description:
          "Copy this key now. For security, plain keys are shown only once.",
      });
    } catch (error) {
      toast({
        title: "Create failed",
        description: error instanceof Error ? error.message : "Please retry",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const revokeKey = async (id: string) => {
    try {
      const res = await fetch("/api/admin/velo/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Could not revoke key");
      await load();
      toast({ title: "Key revoked" });
    } catch (error) {
      toast({
        title: "Revoke failed",
        description: error instanceof Error ? error.message : "Please retry",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Velo API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="velo-client-name">Client Name</Label>
            <Input
              id="velo-client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client A / Velo Site Name"
            />
          </div>
          <Button disabled={saving || !clientName.trim()} onClick={createKey}>
            {saving ? "Generating..." : "Generate Unique Key"}
          </Button>

          {latestApiKey ? (
            <div className="space-y-2">
              <Label htmlFor="velo-key-once">New API Key (copy now)</Label>
              <Textarea id="velo-key-once" value={latestApiKey} readOnly />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Velo app should collect orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Use this code in your other Velo app. It polls for newly paid orders and
            carries customer mobile + full address + line items.
          </p>
          <Textarea value={usageSnippet} readOnly className="min-h-[280px]" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Velo Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading keys...</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keys created yet.</p>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="rounded-md border p-3 flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">{key.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    Prefix: {key.keyPrefix}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last used: {key.lastUsedAt ?? "Never"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: {key.isActive && !key.revokedAt ? "Active" : "Revoked"}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  disabled={!key.isActive || Boolean(key.revokedAt)}
                  onClick={() => revokeKey(key.id)}
                >
                  Revoke
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
