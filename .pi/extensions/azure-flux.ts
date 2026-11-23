// Registers FLUX.2 [pro] on Azure AI Foundry as an image model (codemode: models.generateImages).
// Endpoint and key come from environment variables. Without both, this optional provider is not registered.
// The key is never written to disk or logged.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PROVIDER = "azure-flux";
const API = "azure-flux-images";
const MODEL_ID = "flux-2-pro";
const ENDPOINT = process.env.AZURE_FLUX_ENDPOINT?.trim();
const API_KEY = process.env.AZURE_FLUX_API_KEY?.trim();
const MAX_REFERENCES = 8; // FLUX.2 [pro] takes up to eight reference images (Foundry docs)

type Block = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };

// Pure: maps an ImagesContext to the BFL request body. Text joins into one prompt; images become input_image, input_image_2, ...
export function buildBody(input: Block[], options: { width?: number; height?: number } = {}) {
  const prompt = input.filter((b): b is Extract<Block, { type: "text" }> => b.type === "text").map(b => b.text).join("\n");
  const body: Record<string, unknown> = {
    model: "FLUX.2-pro",
    prompt,
    width: options.width ?? 1024,
    height: options.height ?? 1024,
    n: 1,
    output_format: "png",
  };
  const refs = input.filter((b): b is Extract<Block, { type: "image" }> => b.type === "image");
  if (refs.length > MAX_REFERENCES) throw new Error(`FLUX.2 [pro] takes at most ${MAX_REFERENCES} reference images, got ${refs.length}`);
  refs.forEach((img, i) => { body[i === 0 ? "input_image" : `input_image_${i + 1}`] = img.data; });
  return body;
}

// Pure: reads the response. The docs say "URL or base64"; the community example uses data[0].b64_json.
export async function readImage(response: any, fetchFn: typeof fetch): Promise<{ data: string; mimeType: string }> {
  const item = response?.data?.[0];
  if (item?.b64_json) return { data: item.b64_json, mimeType: "image/png" };
  if (item?.url) {
    const res = await fetchFn(item.url);
    if (!res.ok) throw new Error(`downloading generated image failed: HTTP ${res.status}`);
    const mimeType = res.headers.get("content-type") ?? "image/png";
    return { data: Buffer.from(await res.arrayBuffer()).toString("base64"), mimeType };
  }
  throw new Error(`unexpected response shape: ${JSON.stringify(response).slice(0, 300)}`);
}

export default function (pi: ExtensionAPI) {
  if (!ENDPOINT || !API_KEY) return;

  pi.registerProvider(PROVIDER, {
    models: [
      {
        type: "image",
        id: MODEL_ID,
        name: "FLUX.2 [pro] (Azure Foundry)",
        api: API,
        baseUrl: ENDPOINT,
        input: ["text", "image"],
        output: ["image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ],
    images: {
      [API]: {
        async generateImages(model: any, context: { input: Block[] }, options: any = {}) {
          const base = { api: API, provider: PROVIDER, model: MODEL_ID, output: [] as Block[], stopReason: "error" as const, timestamp: Date.now() };
          const key = options.apiKey ?? API_KEY;
          const fetchFn: typeof fetch = options.fetch ?? fetch;
          try {
            const res = await fetchFn(model.baseUrl ?? ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json", "api-key": key },
              body: JSON.stringify(buildBody(context.input, options.metadata as any)),
              signal: options.signal,
            });
            if (!res.ok) return { ...base, errorMessage: `Azure FLUX returned HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` };
            const image = await readImage(await res.json(), fetchFn);
            return { ...base, stopReason: "stop", output: [{ type: "image", ...image }] };
          } catch (e) {
            return { ...base, stopReason: options.signal?.aborted ? "aborted" : "error", errorMessage: (e as Error).message };
          }
        },
      },
    },
  });
}
