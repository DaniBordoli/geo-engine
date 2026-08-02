import Anthropic from "@anthropic-ai/sdk";

// Modelo de los agentes. Configurable en un solo lugar.
// Nota de costo: el analizador corre una vez por (prompt × engine) — decenas de
// llamadas por scan. Si el volumen pesa, evaluar un modelo más barato acá.
export const AGENT_MODEL = "claude-opus-5";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY no está definida");
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

// Extrae y parsea el bloque de texto JSON de una respuesta con salida
// estructurada (ignora bloques de thinking que puedan venir antes).
export function parseJsonContent<T>(message: Anthropic.Message): T {
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Respuesta sin bloque de texto");
  }
  return JSON.parse(textBlock.text) as T;
}
