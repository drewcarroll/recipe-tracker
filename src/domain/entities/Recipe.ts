import { ValidationError } from '../errors/DomainError';
import { Ingredient } from '../value-objects/Ingredient';
import { RecipeId } from '../value-objects/RecipeId';

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

interface RecipeProps {
  id: RecipeId;
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Recipe Entity — the aggregate root of the recipe domain.
 * Protects its own invariants. Has identity (RecipeId) and a lifecycle.
 */
export class Recipe {
  private constructor(private props: RecipeProps) {}

  static create(props: {
    id: RecipeId;
    title: string;
    description?: string;
    ingredients: Ingredient[];
    steps: string[];
    servings: number;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    difficulty?: RecipeDifficulty;
    createdAt?: Date;
    updatedAt?: Date;
  }): Recipe {
    const title = props.title?.trim();
    if (!title) {
      throw new ValidationError('Recipe title cannot be empty.');
    }
    if (props.ingredients.length === 0) {
      throw new ValidationError('A recipe must have at least one ingredient.');
    }
    if (props.steps.length === 0) {
      throw new ValidationError('A recipe must have at least one step.');
    }
    if (!Number.isInteger(props.servings) || props.servings <= 0) {
      throw new ValidationError('Servings must be a positive integer.');
    }
    if (props.prepTimeMinutes < 0 || props.cookTimeMinutes < 0) {
      throw new ValidationError('Times cannot be negative.');
    }

    const now = new Date();
    return new Recipe({
      id: props.id,
      title,
      description: props.description?.trim() ?? '',
      ingredients: props.ingredients,
      steps: props.steps.map((s) => s.trim()).filter(Boolean),
      servings: props.servings,
      prepTimeMinutes: props.prepTimeMinutes,
      cookTimeMinutes: props.cookTimeMinutes,
      difficulty: props.difficulty ?? 'medium',
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  get id(): RecipeId {
    return this.props.id;
  }
  get title(): string {
    return this.props.title;
  }
  get description(): string {
    return this.props.description;
  }
  get ingredients(): ReadonlyArray<Ingredient> {
    return this.props.ingredients;
  }
  get steps(): ReadonlyArray<string> {
    return this.props.steps;
  }
  get servings(): number {
    return this.props.servings;
  }
  get prepTimeMinutes(): number {
    return this.props.prepTimeMinutes;
  }
  get cookTimeMinutes(): number {
    return this.props.cookTimeMinutes;
  }
  get difficulty(): RecipeDifficulty {
    return this.props.difficulty;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Total time is a derived business rule, owned by the entity. */
  get totalTimeMinutes(): number {
    return this.props.prepTimeMinutes + this.props.cookTimeMinutes;
  }

  rename(newTitle: string): void {
    const title = newTitle?.trim();
    if (!title) {
      throw new ValidationError('Recipe title cannot be empty.');
    }
    this.props.title = title;
    this.touch();
  }

  addIngredient(ingredient: Ingredient): void {
    this.props.ingredients = [...this.props.ingredients, ingredient];
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
