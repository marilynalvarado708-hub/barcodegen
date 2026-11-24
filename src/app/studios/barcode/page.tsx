"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { Copy, Download, Wand2 } from "lucide-react";
import { loadZint, zintGenerate, type ZintBundle } from "@/lib/zint-client";
import { fetchBalance, chargeCredit } from "@/lib/credits";

const DEFAULT_SYMBOLOGY = 58; // QR Code

function download(bytes: Uint8Array, mime: string, name: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function BarcodePage() {
  const [zint, setZint] = useState<ZintBundle | null>(null);
  const [loadError, setLoadError] = useState("");
  const [symbologyId, setSymbologyId] = useState(DEFAULT_SYMBOLOGY);
  const [data, setData] = useState("https://example.com");
  const [primary, setPrimary] = useState("");
  const [scale, setScale] = useState(4);
  const [showText, setShowText] = useState(true);
  const [fg, setFg] = useState("000000");
  const [bg, setBg] = useState("FFFFFF");
  const [transparent, setTransparent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [creditError, setCreditError] = useState("");
  const lastUrl = useRef("");

  useEffect(() => {
    loadZint().then(setZint).catch((e) => setLoadError(String(e?.message || e)));
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchBalance().then((b) => {
      if (mounted) {
        setBalance(b);
        setBalanceLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const sym = useMemo(
    () => zint?.symbologies.find((s) => s.id === symbologyId),
    [zint, symbologyId]
  );

  const options = useMemo(
    () => ({
      symbology: symbologyId,
      data,
      scale,
      showText,
      fg: /^[0-9a-fA-F]{6}$/.test(fg) ? fg : "",
      bg: transparent ? "FFFFFF00" : /^[0-9a-fA-F]{6}$/.test(bg) ? bg : "",
      primary: sym?.primary !== undefined ? primary : "",
      gs1: !!sym?.gs1,
      option1: symbologyId === 57 && !primary.trim() ? 4 : 0, // MaxiCode mode 4
    }),
    [symbologyId, data, scale, showText, fg, bg, transparent, primary, sym]
  );

  // Live preview
  useEffect(() => {
    if (!zint) return;
    if (!data.trim()) {
      setPreviewUrl("");
      setMessage("Enter some data to encode.");
      return;
    }
    const r = zintGenerate(zint, { ...options, filetype: "svg" });
    if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    if (!r.ok || !r.bytes) {
      lastUrl.current = "";
      setPreviewUrl("");
      setMessage(r.message || "Could not encode this data.");
      return;
    }
    const url = URL.createObjectURL(new Blob([r.bytes as BlobPart], { type: "image/svg+xml" }));
    lastUrl.current = url;
    setPreviewUrl(url);
    setMessage(r.warning ? r.message : "");
  }, [zint, options, data]);

  const chooseSymbology = (id: number) => {
    setSymbologyId(id);
    const s = zint?.symbologies.find((x) => x.id === id);
    if (s) {
      setData(s.example);
      setPrimary(s.primary ?? "");
    }
  };

  const save = async (type: "svg" | "png") => {
    setCreditError("");
    if (balanceLoading || balance == null) {
      setCreditError("Loading your account…");
      return;
    }
    if (balance < 1) {
      setCreditError("Insufficient credits to export.");
      return;
    }
    if (!zint) return;
    const r = zintGenerate(zint, { ...options, filetype: type });
    if (!r.ok || !r.bytes) {
      setMessage(r.message || "Export failed.");
      return;
    }
    const charged = await chargeCredit("barcode", sym?.name ?? "barcode");
    if (!charged.ok) {
      setCreditError(charged.error || "Credit charge failed");
      return;
    }
    const slug = (sym?.name || "barcode").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    download(r.bytes, type === "png" ? "image/png" : "image/svg+xml", `${slug}.${type}`);
    if (charged.balance != null) setBalance(charged.balance);
  };

  const grouped = useMemo(() => {
    if (!zint) return [];
    return zint.groups
      .map((g) => ({ group: g, items: zint.symbologies.filter((s) => s.group === g) }))
      .filter((g) => g.items.length > 0);
  }, [zint]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Barcode Suite</h1>
        <p className="text-muted-foreground">
          Over 100 barcode types, generated in your browser with the Zint engine. Pick a type,
          type your data (or click Use example), and download.
        </p>
      </div>

      {loadError && <Alert variant="destructive">Could not load the barcode engine: {loadError}</Alert>}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Barcode</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="symbology">Type</Label>
              <select
                id="symbology"
                disabled={!zint}
                value={symbologyId}
                onChange={(e) => chooseSymbology(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {!zint && <option>Loading engine…</option>}
                {grouped.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.items.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="data">{sym?.gs1 ? "Data (GS1, e.g. (01)12345678901231)" : "Data"}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!sym}
                  onClick={() => sym && (setData(sym.example), setPrimary(sym.primary ?? ""))}
                >
                  <Wand2 className="mr-1 h-4 w-4" /> Use example
                </Button>
              </div>
              <textarea
                id="data"
                value={data}
                onChange={(e) => setData(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              />
            </div>

            {sym?.primary !== undefined && (
              <div className="space-y-2">
                <Label htmlFor="primary">
                  {symbologyId === 57 ? "Primary message (modes 2/3, optional)" : "Linear component"}
                </Label>
                <Input id="primary" value={primary} onChange={(e) => setPrimary(e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scale">Size ({scale}x)</Label>
                <input
                  id="scale"
                  type="range"
                  min={1}
                  max={10}
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <label className="flex items-center gap-2 text-sm mt-6">
                <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} />
                Show text below
              </label>
              <div className="space-y-2">
                <Label htmlFor="fg">Bar colour (hex)</Label>
                <Input id="fg" value={fg} maxLength={6} onChange={(e) => setFg(e.target.value.replace("#", ""))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bg">Background (hex)</Label>
                <Input id="bg" value={bg} maxLength={6} disabled={transparent} onChange={(e) => setBg(e.target.value.replace("#", ""))} />
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
                  Transparent
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center min-h-[240px] rounded-lg border border-border bg-white p-4">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={`${sym?.name ?? "Barcode"} preview`} className="max-w-full h-auto" />
              ) : (
                <p className="text-sm text-muted-foreground text-center">{message || "Loading…"}</p>
              )}
            </div>
            {previewUrl && message && <p className="text-xs text-amber-600">{message}</p>}
            {creditError && <Alert variant="destructive">{creditError}</Alert>}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!previewUrl || balance == null || balance < 1}
                onClick={() => save("png")}
              >
                <Download className="mr-2 h-4 w-4" /> PNG
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!previewUrl || balance == null || balance < 1}
                onClick={() => save("svg")}
              >
                <Download className="mr-2 h-4 w-4" /> SVG
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!data}
                onClick={() => navigator.clipboard.writeText(data).catch(() => {})}
              >
                <Copy className="mr-2 h-4 w-4" /> Copy data
              </Button>
            </div>
            {zint && <p className="text-xs text-muted-foreground">Zint engine {zint.engine.version}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
