import { generateDailyMealsTool } from "../../tools/agent-tools.js";
import type { ProfileType, MacroType, WeeklyMealPlanType } from "../types.js";

/**
 * Node that generates a complete weekly meal plan with parallel processing
 */
export async function generateWeeklyMealsNode(state: { 
    input: ProfileType; 
    macroRatio: MacroType | undefined; 
}): Promise<{ weeklyMealPlan: WeeklyMealPlanType }> {
    console.log("🍽️ Generating weekly meal plan with macros:", state.macroRatio);
    
    if (!state.macroRatio) {
        throw new Error("Macronutrients not calculated yet");
    }

    try {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        console.log("🚀 Starting parallel generation of 7 daily meal plans...");
        
        // Generate all 7 days in parallel
        const mealPromises = days.map(async (day, index) => {
            console.log(`📅 Generating meals for ${dayNames[index]}...`);
            
            // Use previously generated meals to avoid repetition
            const mealsAlreadyUsed: string[] = [];
            
            const mealParams = {
                mealsAlreadyUsed,
                totalCalories: state.macroRatio!.calories,
                proteinRatio: state.macroRatio!.protein,
                carbohydrateRatio: state.macroRatio!.carbohydrates,
                fatRatio: state.macroRatio!.fat,
                dietType: state.input.dietType,
                intolerances: state.input.intolerances ? [state.input.intolerances] : [],
                includeBreakfast: true
            };

            const result = await generateDailyMealsTool.invoke(mealParams);
            console.log(`✅ ${dayNames[index]} meal plan generated`);
            
            return { day, dailyPlan: result.dailyPlan };
        });

        // Wait for all days to complete
        const dailyResults = await Promise.all(mealPromises);
        
        // Assemble the weekly plan
        const weeklyMealPlan: WeeklyMealPlanType = {} as WeeklyMealPlanType;
        
        dailyResults.forEach(({ day, dailyPlan }) => {
            (weeklyMealPlan as any)[day] = dailyPlan;
        });

        console.log("✅ Complete weekly meal plan generated!");
        return { weeklyMealPlan };
        
    } catch (error) {
        console.error("❌ Error generating weekly meals:", error);
        throw error;
    }
}
