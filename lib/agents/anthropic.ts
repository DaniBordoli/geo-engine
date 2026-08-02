import Anthropic from "@anthropic-ai/sdk";

// Modelos de agente, separados por rol y costo.
// Generador: pocas llamadas por scan (1) → prioriza calidad.
export const GENERATOR_MODEL = "claude-opus-5";
// Analizador: 1 llamada por (prompt × engine), decenas por scan → modelo barato.
export const ANALYZER_MODEL = "claude-haiku-4-5-20251001";

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
