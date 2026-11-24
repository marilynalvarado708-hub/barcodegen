/**
 * Browser-side loader for the Zint WebAssembly engine served from /public/zint.
 * The files are loaded at runtime (webpackIgnore) so the bundler leaves them alone.
 */

export interface ZintSymbology {
  id: number;
  name: string;
  group: string;
  example: string;
  gs1?: boolean;
  primary?: string;
  opts?: string[];
}

export interface ZintResult {
  ok: boolean;
  warning: boolean;
  message: string;
  bytes: Uint8Array | null;
  hrt: string;
}

export interface ZintGenerateOptions {
  symbology: number;
  data: string;
  filetype: "svg" | "png";
  scale?: number;
  height?: number;
  fg?: string;
  bg?: string;
  showText?: boolean;
  primary?: string;
  gs1?: boolean;
  option1?: number;
}

interface ZintEngine {
  version: string;
  generate(options: Record<string, unknown>): ZintResult;
}

export interface ZintBundle {
  engine: ZintEngine;
  symbologies: ZintSymbology[];
  groups: string[];
  mode: { UNICODE: number; GS1: number; GS1PARENS: number };
}

let bundle: Promise<ZintBundle> | null = null;

export function loadZint(): Promise<ZintBundle> {
  if (!bundle) {
    bundle = (async () => {
      const engineUrl: string = "/zint/js/engine.js";
      const catalogUrl: string = "/zint/js/symbologies.js";
      const [eng, cat] = await Promise.all([
        import(/* webpackIgnore: true */ engineUrl),
        import(/* webpackIgnore: true */ catalogUrl),
      ]);
      const engine = (await eng.loadEngine()) as ZintEngine;
      return {
        engine,
        symbologies: cat.SYMBOLOGIES as ZintSymbology[],
        groups: cat.GROUPS as string[],
        mode: eng.MODE,
      };
    })();
    bundle.catch(() => {
      bundle = null; // allow retry after a failed load
    });
  }
  return bundle;
}

export function zintGenerate(z: ZintBundle, o: ZintGenerateOptions): ZintResult {
  return z.engine.generate({
    symbology: o.symbology,
    data: o.data,
    filetype: o.filetype,
    inputMode: o.gs1 ? z.mode.GS1 | z.mode.GS1PARENS : z.mode.UNICODE,
    scale: o.scale ?? 1,
    height: o.height ?? 0,
    fg: o.fg ?? "",
    bg: o.bg ?? "",
    showText: o.showText ?? true,
    primary: o.primary ?? "",
    option1: o.option1 ?? 0,
  });
}
