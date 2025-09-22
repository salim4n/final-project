import { generateDailyMealsTool, generateGroceryListTool } from "../lib/tools/agent-tools.js";
import { OPTIMAL_PRESET } from "../lib/config/presets.js";
import z from "zod";

// pnpm tsx examples/nutrition-app-example.ts

/**
 * Exemple d'utilisation des outils de nutrition avec le preset optimal
 * 
 * Ce fichier montre comment utiliser les outils dans une vraie application
 */

// Exemple de profil utilisateur
const UserProfileSchema = z.object({
    name: z.string(),
    totalCalories: z.number(),
    proteinRatio: z.number(),
    carbohydrateRatio: z.number(),
    fatRatio: z.number(),
    dietType: z.string(),
    intolerances: z.array(z.string()),
    includeBreakfast: z.boolean(),
    mealsHistory: z.array(z.string())
});
type UserProfile = z.infer<typeof UserProfileSchema>;

// Profil exemple
const exampleUser: UserProfile = {
    name: "Marie",
    totalCalories: 1800,
    proteinRatio: 135,
    carbohydrateRatio: 180,
    fatRatio: 80,
    dietType: "vegetarian",
    intolerances: ["lactose", "gluten"],
    includeBreakfast: true,
    mealsHistory: [
        "Salade de lentilles aux légumes",
        "Tofu sauté aux légumes asiatiques",
        "Quinoa bowl aux légumes grillés"
    ]
};

/**
 * Génère un plan de repas personnalisé pour un utilisateur
 */
async function generatePersonalizedMealPlan(user: UserProfile) {
    console.log(`🍽️ Génération du plan de repas pour ${user.name}`);
    console.log(`📊 Objectifs: ${user.totalCalories} kcal | ${user.proteinRatio}g protéines | ${user.carbohydrateRatio}g glucides | ${user.fatRatio}g lipides`);
    console.log(`🥗 Régime: ${user.dietType} | Intolérances: ${user.intolerances.join(', ')}`);

    try {
        const mealPlan = await generateDailyMealsTool.invoke({
            mealsAlreadyUsed: user.mealsHistory,
            totalCalories: user.totalCalories,
            proteinRatio: user.proteinRatio,
            carbohydrateRatio: user.carbohydrateRatio,
            fatRatio: user.fatRatio,
            dietType: user.dietType,
            intolerances: user.intolerances,
            includeBreakfast: user.includeBreakfast,
            preset: OPTIMAL_PRESET
        });

        console.log("\n✅ Plan de repas généré !");
        
        // Affichage formaté du plan
        if (mealPlan.dailyPlan.breakfast) {
            console.log(`\n🌅 Petit-déjeuner: ${mealPlan.dailyPlan.breakfast.name}`);
            console.log(`   Calories: ${mealPlan.dailyPlan.breakfast.calories} kcal`);
        }
        
        console.log(`\n🌞 Déjeuner: ${mealPlan.dailyPlan.lunch.name}`);
        console.log(`   Calories: ${mealPlan.dailyPlan.lunch.calories} kcal`);
        
        console.log(`\n🌙 Dîner: ${mealPlan.dailyPlan.dinner.name}`);
        console.log(`   Calories: ${mealPlan.dailyPlan.dinner.calories} kcal`);
        
        if (mealPlan.dailyPlan.snack) {
            console.log(`\n🍎 Collation: ${mealPlan.dailyPlan.snack.name}`);
            console.log(`   Calories: ${mealPlan.dailyPlan.snack.calories} kcal`);
        }

        return mealPlan;

    } catch (error) {
        console.error("❌ Erreur lors de la génération du plan de repas:", error);
        throw error;
    }
}

/**
 * Génère une liste de courses basée sur un plan de repas
 */
async function generateShoppingList(mealNames: string[]) {
    console.log("\n🛒 Génération de la liste de courses...");
    console.log(`📝 Basée sur: ${mealNames.join(', ')}`);

    try {
        const groceryList = await generateGroceryListTool.invoke({
            mealPlan: mealNames,
            preset: OPTIMAL_PRESET
        });

        console.log("\n✅ Liste de courses générée !");
        
        // Affichage formaté de la liste
        const categories = Object.entries(groceryList.groceryList);
        
        categories.forEach(([categoryKey, items]) => {
            const categoryNames: { [key: string]: string } = {
                fruitsEtLegumes: "🥬 Fruits et Légumes",
                viandesEtPoissons: "🥩 Viandes et Poissons",
                produitsLaitiers: "🥛 Produits Laitiers",
                feculentsEtCereales: "🌾 Féculents et Céréales",
                epicerie: "🏪 Épicerie",
                condimentsEtEpices: "🧂 Condiments et Épices"
            };
            
            if (items.length > 0) {
                console.log(`\n${categoryNames[categoryKey] || categoryKey}:`);
                items.forEach(item => {
                    console.log(`  - ${item.name}: ${item.quantity} ${item.unit}`);
                });
            }
        });

        return groceryList;

    } catch (error) {
        console.error("❌ Erreur lors de la génération de la liste de courses:", error);
        throw error;
    }
}

/**
 * Workflow complet : Plan de repas + Liste de courses
 */
async function completeNutritionWorkflow(user: UserProfile) {
    console.log("🚀 WORKFLOW COMPLET DE NUTRITION");
    console.log("=" .repeat(50));

    try {
        // 1. Générer le plan de repas
        const mealPlan = await generatePersonalizedMealPlan(user);
        
        // 2. Extraire les noms des repas
        const mealNames = [
            mealPlan.dailyPlan.breakfast?.name,
            mealPlan.dailyPlan.lunch.name,
            mealPlan.dailyPlan.dinner.name,
            mealPlan.dailyPlan.snack?.name
        ].filter(Boolean) as string[];
        
        // 3. Générer la liste de courses
        const groceryList = await generateShoppingList(mealNames);
        
        console.log("\n🎉 Workflow terminé avec succès !");
        console.log(`✅ Plan de repas personnalisé pour ${user.name}`);
        console.log(`✅ Liste de courses optimisée`);
        console.log(`✅ Respect des contraintes alimentaires`);
        
        return { mealPlan, groceryList };

    } catch (error) {
        console.error("❌ Erreur dans le workflow:", error);
        throw error;
    }
}

// Exécution de l'exemple
if (import.meta.url === `file://${process.argv[1]}`) {
    completeNutritionWorkflow(exampleUser)
        .then(() => console.log("\n✨ Exemple terminé !"))
        .catch(console.error);
}

export { generatePersonalizedMealPlan, generateShoppingList, completeNutritionWorkflow };
