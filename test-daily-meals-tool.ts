// pnpm tsx test-daily-meals-tool.ts

import { generateDailyMealsTool } from "./lib/tools/agent-tools.js";

async function testDailyMealsTool() {
  const testParams = {
    mealsAlreadyUsed: [
      "Salade César au poulet grillé",
      "Saumon teriyaki avec riz basmati",
      "Omelette aux champignons"
    ],
    totalCalories: 2000,
    proteinRatio: 150, // grams
    carbohydrateRatio: 200, // grams
    fatRatio: 89, // grams
    dietType: "none",
    intolerances: ["lactose", "gluten"],
    includeBreakfast: true,
    preset: {
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    }
  };

  try {
    console.log("Testing generateDailyMealsTool...");
    console.log("Parameters:", {
      ...testParams,
      preset: "LLM preset configured"
    });
    
    const result = await generateDailyMealsTool.invoke(testParams);

    console.log("Generated daily meal plan:");
    console.log(JSON.stringify(result, null, 2));
    
    // Verify structure
    console.log("\n=== Meal Plan Summary ===");
    if (result.dailyPlan.breakfast) {
      console.log(`Breakfast: ${result.dailyPlan.breakfast.name} (${result.dailyPlan.breakfast.calories} kcal)`);
    }
    console.log(`Lunch: ${result.dailyPlan.lunch.name} (${result.dailyPlan.lunch.calories} kcal)`);
    console.log(`Dinner: ${result.dailyPlan.dinner.name} (${result.dailyPlan.dinner.calories} kcal)`);
    if (result.dailyPlan.snack) {
      console.log(`Snack: ${result.dailyPlan.snack.name} (${result.dailyPlan.snack.calories} kcal)`);
    }
    
  } catch (error) {
    console.error("Error testing daily meals tool:", error);
  }
}

// Uncomment to run the test
testDailyMealsTool();

export { testDailyMealsTool };
