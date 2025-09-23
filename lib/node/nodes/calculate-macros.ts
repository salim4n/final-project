import { calculNutritionTool } from "../../tools/agent-tools.js";
import type { ProfileType, MacroType } from "../types.js";

/**
 * Node that calculates macronutrient requirements based on user profile
 */
export async function calculateMacrosNode(state: { input: ProfileType }): Promise<{ macroRatio: MacroType }> {
    console.log("🧮 Calculating macronutrients for profile:", state.input);
    
    try {
        const result = await calculNutritionTool.invoke(state.input);
        console.log("✅ Macronutrients calculated:", result);
        return { macroRatio: result };
    } catch (error) {
        console.error("❌ Error calculating macros:", error);
        throw error;
    }
}
