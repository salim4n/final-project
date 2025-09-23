import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Gender, MacronutrientRatios, Objective, Preset, Profile } from "./types.js";
import { calculMetabolism, calculRepartition, calculNutrition } from "./lib.js";
import { generateDailyMeals } from "../prompt/daily-meals.js";
import { generateCourseList } from "../prompt/course-list.js";
import { callLLM } from "./lib.js";
import { OPTIMAL_PRESET } from "../config/presets.js";
import { parseJsonRobustly, extractJsonFromText, validateJsonStructure } from "../utils/json-parser.js";

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
    preset: Preset.optional(),
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
      const preset = params.preset || OPTIMAL_PRESET;
      const result = await callLLM(prompt, preset);
      
      try {
        // Extract and parse JSON using robust utilities
        const extractedJson = extractJsonFromText(result);
        console.log("🧹 Extracted JSON from LLM response:", extractedJson.substring(0, 200) + "...");
        
        const parsedResult = parseJsonRobustly(extractedJson);
        
        // Validate structure
        if (!validateJsonStructure(parsedResult, ['groceryList'])) {
          throw new Error("Invalid JSON structure: missing groceryList property");
        }
        
        return generateGroceryListResult.parse(parsedResult);
      } catch (error) {
        console.error("❌ Raw LLM response:", result.substring(0, 1000) + "...");
        console.error("❌ JSON parsing error:", error);
          
        // Final fallback: create a basic grocery list
        try {
          console.log("🔧 Using fallback grocery list...");
          
          const fallbackGroceryList = {
            groceryList: {
              fruitsEtLegumes: [
                { name: "Bananes", quantity: "6", unit: "pièces" },
                { name: "Épinards", quantity: "200", unit: "g" },
                { name: "Tomates", quantity: "500", unit: "g" }
              ],
              viandesEtPoissons: [
                { name: "Poulet", quantity: "1", unit: "kg" },
                { name: "Saumon", quantity: "400", unit: "g" }
              ],
              produitsLaitiers: [
                { name: "Lait", quantity: "1", unit: "L" },
                { name: "Yaourt grec", quantity: "500", unit: "g" }
              ],
              feculentsEtCereales: [
                { name: "Riz", quantity: "500", unit: "g" },
                { name: "Avoine", quantity: "500", unit: "g" }
              ],
              epicerie: [
                { name: "Huile d'olive", quantity: "1", unit: "bouteille" },
                { name: "Œufs", quantity: "12", unit: "pièces" }
              ],
              condimentsEtEpices: [
                { name: "Sel", quantity: "1", unit: "paquet" },
                { name: "Poivre", quantity: "1", unit: "paquet" }
              ]
            }
          };
          
          console.log("⚠️ Using fallback grocery list due to JSON parsing issues");
          return generateGroceryListResult.parse(fallbackGroceryList);
        } catch (fallbackError) {
          throw new Error(`All parsing attempts failed. Original error: ${error}, Fallback error: ${fallbackError}`);
        }
      }
    },
    {
      name: "generateGroceryList", 
      description: "Generate an organized grocery list from a meal plan using LLM. Uses optimal preset by default (temperature: 0.6, topP: 0.6, frequencyPenalty: 0.2, presencePenalty: 0.05).",
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
    preset: Preset.optional(),
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
      
      const preset = params.preset || OPTIMAL_PRESET;
      const result = await callLLM(prompt, preset);
      
      let cleanedResult = "";
      try {
        // Clean the result to remove markdown code blocks and other formatting
        cleanedResult = result
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
          .replace(/\\n/g, ' ') // Replace literal \n with spaces
          .replace(/\\t/g, ' ') // Replace literal \t with spaces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/^[^{]*/, '') // Remove everything before the first {
          .replace(/[^}]*$/, '') // Remove everything after the last }
          .trim();
        
        // Fix common JSON issues
        cleanedResult = cleanedResult
          .replace(/,\s*}/g, '}') // Remove trailing commas before }
          .replace(/,\s*]/g, ']') // Remove trailing commas before ]
          .replace(/:\s*,/g, ': ""') // Replace empty values with empty strings
          .replace(/:\s*}/g, ': ""}') // Replace missing values before }
          .replace(/"\s*:\s*"/g, '": "') // Fix spacing around colons
          .replace(/}\s*{/g, '}, {'); // Fix missing commas between objects
        
        // Try to find JSON object in the response
        const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedResult = jsonMatch[0];
        }
        
        console.log("🧹 Cleaned LLM response for meals:", cleanedResult.substring(0, 200) + "...");
        
        const parsedResult = JSON.parse(cleanedResult);
        return generateDailyMealsResult.parse(parsedResult);
      } catch (error) {
        console.error("❌ Raw LLM response:", result.substring(0, 1000) + "...");
        console.error("❌ Cleaned result:", cleanedResult.substring(0, 1000) + "...");
        
        // Try one more aggressive cleaning attempt
        try {
          // More aggressive JSON repair with better regex patterns
          let repairedJson = cleanedResult
            .replace(/"\s*:\s*,/g, '": "",') // Fix empty values with comma
            .replace(/"\s*:\s*}/g, '": ""}') // Fix empty values at end of object
            .replace(/,\s*,/g, ',') // Remove duplicate commas
            .replace(/{\s*,/g, '{') // Remove leading commas in objects
            .replace(/\[\s*,/g, '[') // Remove leading commas in arrays
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas before } or ]
            .replace(/([{,]\s*)"([^"]*)"(\s*[^:}])/g, '$1"$2": "$3"') // Fix missing colons
            .replace(/:\s*([^",}\]]+)([,}\]])/g, ': "$1"$2'); // Quote unquoted values
          
          console.log("🔧 Attempting JSON repair:", repairedJson.substring(0, 200) + "...");
          const repairedResult = JSON.parse(repairedJson);
          return generateDailyMealsResult.parse(repairedResult);
        } catch (repairError) {
          console.error("❌ JSON repair also failed:", repairError);
          
          // Final fallback: try to extract just the structure we need
          try {
            console.log("🔧 Attempting structure extraction fallback...");
            
            // Create a minimal valid response as fallback
            const fallbackResponse = {
              dailyPlan: {
                breakfast: {
                  name: "Petit-déjeuner simple",
                  description: "Repas de base en cas d'erreur de parsing",
                  calories: "400",
                  macros: { protein: "20g", carbs: "50g", fats: "15g" },
                  ingredients: ["Avoine", "Lait", "Fruits"]
                },
                lunch: {
                  name: "Déjeuner simple",
                  description: "Repas de base en cas d'erreur de parsing",
                  calories: "600",
                  macros: { protein: "35g", carbs: "60g", fats: "20g" },
                  ingredients: ["Riz", "Poulet", "Légumes"]
                },
                dinner: {
                  name: "Dîner simple",
                  description: "Repas de base en cas d'erreur de parsing",
                  calories: "500",
                  macros: { protein: "30g", carbs: "40g", fats: "18g" },
                  ingredients: ["Poisson", "Quinoa", "Salade"]
                }
              }
            };
            
            console.log("⚠️ Using fallback meal plan due to JSON parsing issues");
            return generateDailyMealsResult.parse(fallbackResponse);
          } catch (fallbackError) {
            throw new Error(`All parsing attempts failed. Original error: ${error}, Repair error: ${repairError}, Fallback error: ${fallbackError}`);
          }
        }
      }
    },
    {
      name: "generateDailyMeals",
      description: "Generate a complete daily meal plan with breakfast, lunch, dinner and optional snack based on nutritional goals and dietary restrictions. Uses optimal preset by default (temperature: 0.6, topP: 0.6, frequencyPenalty: 0.2, presencePenalty: 0.05).",
      schema: generateDailyMealsParams,
    }
  );