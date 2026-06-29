import Anthropic from '@anthropic-ai/sdk';

import type { RecipeParser } from '@application/ports/RecipeParser';
import { structuredRecipeSchema, type StructuredRecipe } from '@application/types';

import { getAnthropicConfig } from '@infrastructure/config/env';

/**
 * Claude-backed {@link RecipeParser}. Sends the pasted text to Claude with a
 * JSON-schema output format so the response is constrained to our recipe shape,
 * then validates it against the shared {@link structuredRecipeSchema} (the LLM
 * output is untrusted, so it is always re-validated rather than trusted as-is).
 *
 * Runs server-side only; the API key never reaches the browser (idea.md §6).
 */

const MODEL = 'claude-opus-4-8';

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
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      messages: [{ role: 'user', content: text }],
    });

    if (message.stop_reason === 'refusal') {
      throw new Error('The recipe parser declined to process this text.');
    }

    const json = message.content.find((block) => block.type === 'text')?.text;
    if (!json) {
      throw new Error('Claude did not return a structured recipe.');
    }

    // Re-validate the untrusted model output against the canonical schema.
    return structuredRecipeSchema.parse(JSON.parse(json));
  }
}
