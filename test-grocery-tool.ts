// pnpm tsx test-grocery-tool.ts

import { generateGroceryListTool } from "./lib/tools/agent-tools.js";

async function testGroceryListTool() {
  const testMealPlan = [
    "Salade de quinoa aux légumes grillés",
    "Saumon grillé avec brocolis vapeur",
    "Omelette aux champignons et épinards",
    "Riz sauté aux légumes et tofu"
  ];

  const testPreset = {
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0
  };

  try {
    console.log("Testing generateGroceryListTool...");
    console.log("Meal plan:", testMealPlan);
    
    const result = await generateGroceryListTool.invoke({
      mealPlan: testMealPlan,
      preset: testPreset
    });

    console.log("Generated grocery list:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error testing grocery list tool:", error);
  }
}

// Uncomment to run the test
testGroceryListTool();

export { testGroceryListTool };
