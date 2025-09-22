import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Gender, MacronutrientRatios, Objective, Preset, Profile } from "./types.js";
import { calculMetabolism, calculRepartition, calculNutrition, callLLM } from "./lib.js";
import { generateCourseList } from "../prompt/course-list.js";
import { generateDailyMeals } from "../prompt/daily-meals.js";

// Metabolism tool
const MetabolismParams = z.object({
    gender: Gender,
    age: z.number().int().positive(),
    weight: z.number().positive(),
    height: z.number().positive(),
  });
  
  export const calculMetabolismTool = tool(
    async (input: unknown) => {
      const params = MetabolismParams.parse(input);
      const calories = calculMetabolism(params.gender, params.age, params.weight, params.height);
      return { calories: Math.round(calories) };
    },
    {
      name: "calculMetabolism",
      description: "Calculate basal metabolism (kcal) from gender, age, weight, height.",
      schema: MetabolismParams,
    }
  );
  
  // Repartition tool
  const RepartitionParams = z.object({
    objective: Objective,
    calories: z.number().positive(),
  });
  
  export const calculRepartitionTool = tool(
    async (input: unknown) => {
      const params = RepartitionParams.parse(input);
      const result = calculRepartition(params.objective, params.calories);
      // Ensure shape matches schema
      return MacronutrientRatios.parse(result);
    },
    {
      name: "calculRepartition",
      description: "Compute macronutrient repartition (grams) from objective and calories.",
      schema: RepartitionParams,
    }
  );
  
  // Full nutrition tool
  export const calculNutritionTool = tool(
    async (input: unknown) => {
      const profile = Profile.parse(input);
      const result = calculNutrition(profile);
      return MacronutrientRatios.parse(result);
    },
    {
      name: "calculNutrition",
      description: "Compute full macronutrient distribution from a complete user profile.",
      schema: Profile,
    }
  );

  const BmiParams = z.object({
    weightKg: z.number().positive(),
    heightCm: z.number().positive(),
  });
  const BmiResult = z.object({
    bmi: z.number(),
    category: z.enum(["underweight", "normal", "overweight", "obese"]),
  });

  export const calculBmiTool = tool(
    async (input: unknown) => {
      const params = BmiParams.parse(input);
      const h = params.heightCm / 100;
      const bmi = params.weightKg / (h * h);
      let category: z.infer<typeof BmiResult>['category'];
      if (bmi < 18.5) category = "underweight";
      else if (bmi < 25) category = "normal";
      else if (bmi < 30) category = "overweight";
      else category = "obese";
      return BmiResult.parse({ bmi, category });
    },
    {
      name: "calculBmi",
      description: "Compute BMI and category from weight (kg) and height (cm).",
      schema: BmiParams,
    }
  );

  const callLLMParams = z.object({
    prompt: z.string(),
    preset: Preset,
  });

  const callLLMResult = z.object({
    response: z.string(),
  });

  export const callLLMTool = tool(
    async (input: unknown) => {
      const params = callLLMParams.parse(input);
      const result = await callLLM(params.prompt, params.preset);
      return callLLMResult.parse({ response: result });
    },
    {
      name: "callLLM",
      description: "Call LLM with a given prompt and preset.",
      schema: callLLMParams,
    }
  );

  // Generate grocery list from meal plan
  const generateGroceryListParams = z.object({
    mealPlan: z.array(z.string()),
    preset: Preset,
  });
  
  const GroceryItemSchema = z.object({
    name: z.string(),
    quantity: z.union([z.string(), z.number()]).transform(val => String(val)),
    unit: z.string()
  });

  const generateGroceryListResult = z.object({
    groceryList: z.object({
      fruitsEtLegumes: z.array(GroceryItemSchema),
      viandesEtPoissons: z.array(GroceryItemSchema),
      produitsLaitiers: z.array(GroceryItemSchema),
      feculentsEtCereales: z.array(GroceryItemSchema),
      epicerie: z.array(GroceryItemSchema),
      condimentsEtEpices: z.array(GroceryItemSchema)
    })
  });

  export const generateGroceryListTool = tool(
    async (input: unknown) => {
      const params = generateGroceryListParams.parse(input);
      const prompt = generateCourseList(params.mealPlan);
      const result = await callLLM(prompt, params.preset);
      
      try {
        // Clean the result to remove markdown code blocks if present
        const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedResult = JSON.parse(cleanedResult);
        return generateGroceryListResult.parse(parsedResult);
      } catch (error) {
        throw new Error(`Failed to parse LLM response as JSON: ${error}`);
      }
    },
    {
      name: "generateGroceryList",
      description: "Generate an organized grocery list from a meal plan using LLM.",
      schema: generateGroceryListParams,
    }
  );

  // Generate daily meals plan
  const generateDailyMealsParams = z.object({
    mealsAlreadyUsed: z.array(z.string()),
    totalCalories: z.number().positive(),
    proteinRatio: z.number().positive(),
    carbohydrateRatio: z.number().positive(),
    fatRatio: z.number().positive(),
    dietType: z.string(),
    intolerances: z.array(z.string()),
    includeBreakfast: z.boolean(),
    preset: Preset,
  });

  const MealSchema = z.object({
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

  const generateDailyMealsResult = z.object({
    dailyPlan: z.object({
      breakfast: MealSchema.optional(),
      lunch: MealSchema,
      dinner: MealSchema,
      snack: MealSchema.optional()
    })
  });

  export const generateDailyMealsTool = tool(
    async (input: unknown) => {
      const params = generateDailyMealsParams.parse(input);
      const prompt = generateDailyMeals(
        params.mealsAlreadyUsed,
        params.totalCalories,
        params.proteinRatio,
        params.carbohydrateRatio,
        params.fatRatio,
        params.dietType,
        params.intolerances,
        params.includeBreakfast
      );
      
      const result = await callLLM(prompt, params.preset);
      
      try {
        // Clean the result to remove markdown code blocks if present
        const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedResult = JSON.parse(cleanedResult);
        return generateDailyMealsResult.parse(parsedResult);
      } catch (error) {
        throw new Error(`Failed to parse LLM response as JSON: ${error}`);
      }
    },
    {
      name: "generateDailyMeals",
      description: "Generate a complete daily meal plan with breakfast, lunch, dinner and optional snack based on nutritional goals and dietary restrictions.",
      schema: generateDailyMealsParams,
    }
  );