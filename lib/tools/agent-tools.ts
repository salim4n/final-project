import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Gender, MacronutrientRatios, Objective, Profile } from "./types.js";
import { calculMetabolism, calculRepartition, calculNutrition } from "./lib.js";

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