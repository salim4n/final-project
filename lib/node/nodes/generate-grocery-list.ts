import { generateGroceryListTool } from "../../tools/agent-tools.js";
import type { WeeklyMealPlanType, GroceryListType } from "../types.js";

/**
 * Node that generates a comprehensive grocery list from the weekly meal plan
 */
export async function generateGroceryListNode(state: { 
    weeklyMealPlan: WeeklyMealPlanType | undefined; 
}): Promise<{ groceryList: GroceryListType }> {
    console.log("🛒 Generating grocery list from weekly meal plan:", state.weeklyMealPlan);
    
    if (!state.weeklyMealPlan) {
        throw new Error("Weekly meal plan not generated yet");
    }

    try {
        // Extract meal descriptions from the entire week for grocery list generation
        const mealDescriptions: string[] = [];
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        days.forEach((day, index) => {
            const dayPlan = (state.weeklyMealPlan as any)[day];
            const dayName = dayNames[index];
            
            if (dayPlan.breakfast) {
                mealDescriptions.push(`${dayName} - Petit-déjeuner: ${dayPlan.breakfast.name} - ${dayPlan.breakfast.description}`);
            }
            mealDescriptions.push(`${dayName} - Déjeuner: ${dayPlan.lunch.name} - ${dayPlan.lunch.description}`);
            mealDescriptions.push(`${dayName} - Dîner: ${dayPlan.dinner.name} - ${dayPlan.dinner.description}`);
            if (dayPlan.snack) {
                mealDescriptions.push(`${dayName} - Collation: ${dayPlan.snack.name} - ${dayPlan.snack.description}`);
            }
        });

        console.log(`📝 Extracted ${mealDescriptions.length} meals from weekly plan`);

        const result = await generateGroceryListTool.invoke({
            mealPlan: mealDescriptions
        });
        console.log("✅ Weekly grocery list generated:", result);
        return { groceryList: result.groceryList };
    } catch (error) {
        console.error("❌ Error generating grocery list:", error);
        throw error;
    }
}
