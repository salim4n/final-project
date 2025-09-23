import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import type { ProfileType, MacroType, WeeklyMealPlanType, GroceryListType, FinalResponseType } from "./types.js";
import { calculateMacrosNode } from "./nodes/calculate-macros.js";
import { generateWeeklyMealsNode } from "./nodes/generate-weekly-meals.js";
import { generateGroceryListNode } from "./nodes/generate-grocery-list.js";
import { assembleFinalResponseNode } from "./nodes/assemble-final-response.js";

/**
 * Creates a nutrition planning graph that processes a user profile through multiple stages:
 * 1. Calculate macronutrient requirements
 * 2. Generate weekly meal plan (7 days in parallel)
 * 3. Create comprehensive grocery list for the week
 * 4. Assemble final structured response
 * 
 * Features:
 * - Parallel generation of 7 daily meal plans for optimal performance
 * - Comprehensive weekly grocery list organized by categories
 * - Meal variety across the week to avoid repetition
 * - Complete nutritional planning with macronutrient tracking
 * - Clean separation of concerns with individual node files
 */
export function createNutritionPlanningGraph() {
    const graph = new StateGraph(Annotation.Root({
        input: Annotation<ProfileType>(),
        macroRatio: Annotation<MacroType | undefined>(),
        weeklyMealPlan: Annotation<WeeklyMealPlanType | undefined>(),
        groceryList: Annotation<GroceryListType | undefined>(),
        finalResponse: Annotation<FinalResponseType | undefined>(),
    }))
    .addNode("calculateMacros", calculateMacrosNode)
    .addNode("generateWeeklyMeals", generateWeeklyMealsNode)
    .addNode("generateGroceryList", generateGroceryListNode)
    .addNode("assembleFinalResponse", assembleFinalResponseNode)
    .addEdge(START, "calculateMacros")
    .addEdge("calculateMacros", "generateWeeklyMeals")
    .addEdge("generateWeeklyMeals", "generateGroceryList")
    .addEdge("generateGroceryList", "assembleFinalResponse")
    .addEdge("assembleFinalResponse", END);

    return graph;
}
