import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import type { CookNotesInterpreter } from '@application/ports/CookNotesInterpreter';
import {
  recipeSuggestionSchema,
  type RecipeDetail,
  type RecipeSuggestion,
} from '@application/types';

import { getAnthropicConfig } from '@infrastructure/config/env';

/**
 * Claude-backed {@link CookNotesInterpreter}. Sends the current recipe (with
 * stable item ids) plus the cook's free-text notes to Claude under a JSON-schema
 * output format, then re-validates every returned suggestion against the shared
 * {@link recipeSuggestionSchema} — the LLM output is untrusted, so anything that
 * doesn't match the contract is dropped rather than trusted.
 *
 * Runs server-side only; the API key never reaches the browser (idea.md §6).
 */

const MODEL = 'claude-opus-4-8';

const SYSTEM_PROMPT = [
  'You help improve a saved recipe based on the cook\'s free-text "notes for next time",',
  'written right after they finished cooking it.',
  'You are given the current recipe as JSON (with a stable id on each ingredient, prep',
  'item, and step) and the notes.',
  'Turn the notes into a list of discrete, independently-approvable suggested changes.',
  'Each suggestion must be a single atomic edit so the user can approve or reject it on',
  'its own, and must carry a short imperative "summary" the user will read next to',
  'Approve/Reject buttons (e.g. "Reduce salt to 1 tsp", "Add a 10-minute rest at the end").',
  'For update or remove suggestions, reference the exact id from the recipe.',
  'For add or rename suggestions, do not reference an id.',
  'Only suggest changes that are clearly grounded in the notes — do not invent unrelated',
  'edits. If the notes imply no concrete recipe change, return an empty list.',
].join(' ');

/** A required string property in the structured-outputs subset. */
const STRING = { type: 'string' } as const;

/** Ingredient value object, mirroring the recipe's ingredient shape. */
const INGREDIENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { name: STRING, quantity: STRING, unit: STRING },
  required: ['name', 'quantity', 'unit'],
} as const;

/** Build one discriminated-union variant: always `kind` + `summary`, plus extras. */
function variant(
  kind: RecipeSuggestion['kind'],
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const properties = { kind: { const: kind }, summary: STRING, ...extra };
  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  };
}

/**
 * JSON schema mirroring `{ suggestions: RecipeSuggestion[] }`, written to the
 * structured-outputs subset (every object sets `additionalProperties: false`
 * and lists its `required` keys; discriminator via `const`).
 */
const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    suggestions: {
      type: 'array',
      items: {
        anyOf: [
          variant('rename', { name: STRING }),
          variant('add-ingredient', { ingredient: INGREDIENT_SCHEMA }),
          variant('update-ingredient', { ingredientId: STRING, ingredient: INGREDIENT_SCHEMA }),
          variant('remove-ingredient', { ingredientId: STRING }),
          variant('add-prep', { text: STRING }),
          variant('update-prep', { prepId: STRING, text: STRING }),
          variant('remove-prep', { prepId: STRING }),
          variant('add-step', { text: STRING }),
          variant('update-step', { stepId: STRING, text: STRING }),
          variant('remove-step', { stepId: STRING }),
        ],
      },
    },
  },
  required: ['suggestions'],
} as const;

export class AnthropicCookNotesInterpreter implements CookNotesInterpreter {
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({ apiKey: getAnthropicConfig().apiKey });
    }
    return this.client;
  }

  async suggest(recipe: RecipeDetail, notes: string): Promise<RecipeSuggestion[]> {
    const userContent = [
      'Current recipe:',
      JSON.stringify(toContext(recipe)),
      '',
      'Notes for next time:',
      notes,
    ].join('\n');

    const message = await this.getClient().messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      messages: [{ role: 'user', content: userContent }],
    });

    if (message.stop_reason === 'refusal') {
      throw new Error('The recipe assistant declined to process these notes.');
    }

    const json = message.content.find((block) => block.type === 'text')?.text;
    if (!json) {
      throw new Error('Claude did not return any suggestions.');
    }

    const parsed = z.object({ suggestions: z.array(z.unknown()) }).parse(JSON.parse(json));

    // Re-validate each suggestion individually so one malformed entry doesn't
    // discard the whole batch — keep only those matching the canonical schema.
    return parsed.suggestions.flatMap((raw) => {
      const result = recipeSuggestionSchema.safeParse(raw);
      return result.success ? [result.data] : [];
    });
  }
}

/** Compact recipe view handed to Claude, exposing the ids it references. */
function toContext(recipe: RecipeDetail): unknown {
  return {
    name: recipe.name,
    ingredients: recipe.ingredients.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    })),
    prep: recipe.prep.map((item) => ({ id: item.id, text: item.text })),
    steps: recipe.steps.map((item) => ({ id: item.id, text: item.text })),
  };
}
