import type { ProfileType, MacroType, WeeklyMealPlanType, GroceryListType, FinalResponseType } from "../types.js";

/**
 * Node that assembles the final structured response with all generated data
 */
export async function assembleFinalResponseNode(state: { 
    input: ProfileType;
    macroRatio: MacroType | undefined;
    weeklyMealPlan: WeeklyMealPlanType | undefined;
    groceryList: GroceryListType | undefined;
}): Promise<{ finalResponse: FinalResponseType }> {
    console.log("📋 Assembling final response");
    
    if (!state.macroRatio || !state.weeklyMealPlan || !state.groceryList) {
        throw new Error("Missing required data for final response");
    }

    try {
        const summary = `Plan nutritionnel hebdomadaire personnalisé généré pour ${state.input.gender === 'male' ? 'un homme' : 'une femme'} de ${state.input.age} ans. ` +
                      `Objectif: ${state.input.objective}. Régime: ${state.input.dietType}. ` +
                      `Calories quotidiennes: ${state.macroRatio.calories} kcal. ` +
                      `Plan de repas complet pour 7 jours avec liste de courses hebdomadaire organisée par catégories.`;

        const finalResponse: FinalResponseType = {
            profile: state.input,
            macronutrients: state.macroRatio,
            weeklyMealPlan: state.weeklyMealPlan,
            groceryList: state.groceryList,
            summary
        };

        console.log("✅ Final response assembled");
        return { finalResponse };
    } catch (error) {
        console.error("❌ Error assembling final response:", error);
        throw error;
    }
}
