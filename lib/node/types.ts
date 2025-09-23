import { z } from "zod";
import { Profile, MacronutrientRatios } from "../tools/types.js";

// Define the meal structure
export const MealSchema = z.object({
  name: z.string(),
  description: z.string(),
  calories: z.string(),
  macros: z.object({
    protein: z.string(),
    carbs: z.string(),
    fats: z.string()
  }),
  ingredients: z.array(z.string())
});

// Define the daily meal plan structure
export const DailyMealPlanSchema = z.object({
  breakfast: MealSchema.optional(),
  lunch: MealSchema,
  dinner: MealSchema,
  snack: MealSchema.optional()
});

// Define the weekly meal plan structure
export const WeeklyMealPlanSchema = z.object({
  monday: DailyMealPlanSchema,
  tuesday: DailyMealPlanSchema,
  wednesday: DailyMealPlanSchema,
  thursday: DailyMealPlanSchema,
  friday: DailyMealPlanSchema,
  saturday: DailyMealPlanSchema,
  sunday: DailyMealPlanSchema
});

// Define a flexible grocery item that can handle both string and number quantities
const GroceryItemSchema = z.object({
  name: z.string(),
  quantity: z.union([z.string(), z.number()]).transform(val => String(val)), // Convert numbers to strings
  unit: z.string()
});

// Define the grocery list structure with more flexible validation
export const GroceryListSchema = z.object({
  fruitsEtLegumes: z.array(GroceryItemSchema).default([]),
  viandesEtPoissons: z.array(GroceryItemSchema).default([]),
  produitsLaitiers: z.array(GroceryItemSchema).default([]),
  feculentsEtCereales: z.array(GroceryItemSchema).default([]),
  epicerie: z.array(GroceryItemSchema).default([]),
  condimentsEtEpices: z.array(GroceryItemSchema).default([])
});

// Define the final response structure
export const FinalResponseSchema = z.object({
  profile: Profile,
  macronutrients: MacronutrientRatios,
  weeklyMealPlan: WeeklyMealPlanSchema,
  groceryList: GroceryListSchema,
  summary: z.string()
});

// Export inferred types
export type MealType = z.infer<typeof MealSchema>;
export type DailyMealPlanType = z.infer<typeof DailyMealPlanSchema>;
export type WeeklyMealPlanType = z.infer<typeof WeeklyMealPlanSchema>;
export type GroceryListType = z.infer<typeof GroceryListSchema>;
export type FinalResponseType = z.infer<typeof FinalResponseSchema>;
export type ProfileType = z.infer<typeof Profile>;
export type MacroType = z.infer<typeof MacronutrientRatios>;
