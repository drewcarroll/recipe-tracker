import Anthropic from '@anthropic-ai/sdk';

import type { RecipeParser } from '@application/ports/RecipeParser';
import { structuredRecipeSchema, type StructuredRecipe } from '@application/types';

import { getAnthropicConfig } from '@infrastructure/config/env';

/**
 * Clean up the model's JSON before it is validated against the strict
 * {@link structuredRecipeSchema}. Real-world pastes are messy (run-on lines,
 * missing separators), so the model can emit a stray ingredient with no name
 * or a blank prep/step line. Those would make the strict schema reject the
 * whole recipe; instead we trim and drop the empty entries so a near-miss still
 * yields a usable recipe rather than a total failure.
 */
function sanitizeStructuredRecipe(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) {
    return raw;
  }
  const record = raw as Record<string, unknown>;

  const cleanStrings = (value: unknown): string[] =>
    Array.isArray(value)
      ? value
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      : [];

  const ingredients = Array.isArray(record.ingredients)
    ? record.ingredients
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => ({
          name: typeof item.name === 'string' ? item.name.trim() : '',
          quantity: typeof item.quantity === 'string' ? item.quantity.trim() : '',
          unit: typeof item.unit === 'string' ? item.unit.trim() : '',
        }))
        .filter((item) => item.name.length > 0)
    : [];

  return {
    name: typeof record.name === 'string' ? record.name.trim() : record.name,
    ingredients,
    prep: cleanStrings(record.prep),
    steps: cleanStrings(record.steps),
  };
}

/**
 * Claude-backed {@link RecipeParser}. Sends the pasted text to Claude with a
 * JSON-schema output format so the response is constrained to our recipe shape,
 * then validates it against the shared {@link structuredRecipeSchema} (the LLM
 * output is untrusted, so it is always re-validated rather than trusted as-is).
 *
 * Runs server-side only; the API key never reaches the browser (idea.md §6).
 */

// Recipe parsing is bounded structured extraction, so the fastest/cheapest
// model that supports structured outputs is the right fit.
const MODEL = 'claude-haiku-4-5';

const SYSTEM_PROMPT = [
  'You convert a pasted recipe into a structured recipe.',
  'Extract the dish name, the ingredients (each with a quantity, unit, and name —',
  'use an empty string for quantity or unit when the text does not give one), any',
  'prep tasks done before cooking, and the ordered cooking steps.',
  'Use the recipe exactly as written: do not invent ingredients or steps, and do',
  'not add commentary. If the text is not a recipe, salvage whatever structure you can.',
].join(' ');

/**
 * JSON schema mirroring {@link structuredRecipeSchema}, written to the
 * structured-outputs subset (every object sets `additionalProperties: false`
 * and lists its `required` keys; no string/number constraints).
 */
const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          quantity: { type: 'string' },
          unit: { type: 'string' },
        },
        required: ['name', 'quantity', 'unit'],
      },
    },
    prep: { type: 'array', items: { type: 'string' } },
    steps: { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'ingredients', 'prep', 'steps'],
} as const;

export class AnthropicRecipeParser implements RecipeParser {
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({ apiKey: getAnthropicConfig().apiKey });
    }
    return this.client;
  }

  async parse(text: string): Promise<StructuredRecipe> {
    const message = await this.getClient().messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      messages: [{ role: 'user', content: text }],
    });

    if (message.stop_reason === 'refusal') {
      throw new Error('The recipe parser declined to process this text.');
    }
    if (message.stop_reason === 'max_tokens') {
      throw new Error('The recipe was too long to convert in one pass.');
    }

    const json = message.content.find((block) => block.type === 'text')?.text;
    if (!json) {
      throw new Error('Claude did not return a structured recipe.');
    }

    // Re-validate the untrusted model output against the canonical schema,
    // sanitizing first so a stray empty entry from a messy paste doesn't sink
    // the whole recipe.
    return structuredRecipeSchema.parse(sanitizeStructuredRecipe(JSON.parse(json)));
  }
}
