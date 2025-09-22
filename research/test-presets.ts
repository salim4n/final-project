import { generateDailyMealsTool, generateGroceryListTool } from "../lib/tools/agent-tools.js";
import { presetA, presetB, presetC, presetD } from "./nutrition-presets.js";

// pnpm tsx research/test-presets.ts

// Données de test cohérentes
const testMealParams = {
    mealsAlreadyUsed: [
        "Salade César au poulet grillé",
        "Saumon teriyaki avec riz basmati",
        "Omelette aux champignons"
    ],
    totalCalories: 2000,
    proteinRatio: 150,
    carbohydrateRatio: 200,
    fatRatio: 89,
    dietType: "none",
    intolerances: ["lactose"],
    includeBreakfast: true
};

const testGroceryParams = {
    mealPlan: [
        "Salade de quinoa aux légumes grillés",
        "Saumon grillé avec brocolis vapeur",
        "Omelette aux champignons et épinards",
        "Riz sauté aux légumes et tofu"
    ]
};

// Test rapide d'un preset avec les outils
async function quickTestPreset(preset: any, label: string) {
    console.log(`\n🧪 TEST ${label}`);
    console.log("=" .repeat(50));
    console.log("Preset:", JSON.stringify(preset, null, 2));

    try {
        // Test plan de repas
        console.log("\n📋 Test plan de repas...");
        const mealResult = await generateDailyMealsTool.invoke({
            ...testMealParams,
            preset
        });
        
        console.log("✅ Plan de repas généré avec succès");
        console.log(`- Petit-déjeuner: ${mealResult.dailyPlan.breakfast?.name || 'Non inclus'}`);
        console.log(`- Déjeuner: ${mealResult.dailyPlan.lunch.name}`);
        console.log(`- Dîner: ${mealResult.dailyPlan.dinner.name}`);
        console.log(`- Collation: ${mealResult.dailyPlan.snack?.name || 'Non incluse'}`);

        // Test liste de courses
        console.log("\n🛒 Test liste de courses...");
        const groceryResult = await generateGroceryListTool.invoke({
            ...testGroceryParams,
            preset
        });
        
        console.log("✅ Liste de courses générée avec succès");
        const categories = Object.keys(groceryResult.groceryList);
        console.log(`- Catégories: ${categories.length} (${categories.join(', ')})`);
        
        // Compter le total d'articles
        const totalItems = categories.reduce((sum, cat) => {
            return sum + (groceryResult.groceryList as any)[cat].length;
        }, 0);
        console.log(`- Total articles: ${totalItems}`);

        return { success: true, mealResult, groceryResult };

    } catch (error) {
        console.log(`❌ Erreur avec ${label}:`, error);
        return { success: false, error };
    }
}

// Test de tous les presets
async function testAllPresets() {
    console.log("🍽️  TEST RAPIDE DES PRESETS NUTRITION 🍽️");
    console.log("=".repeat(60));

    const presets = [
        { preset: presetA, label: "A (Créativité contrôlée)" },
        { preset: presetB, label: "B (Précision technique)" },
        { preset: presetC, label: "C (Diversité maximale)" },
        { preset: presetD, label: "D (Praticité optimisée)" }
    ];

    const results = [];

    for (const { preset, label } of presets) {
        const result = await quickTestPreset(preset, label);
        results.push({ label, ...result });
        
        // Pause entre les tests pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Résumé final
    console.log("\n📊 RÉSUMÉ DES TESTS");
    console.log("=".repeat(30));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Presets réussis: ${successful.length}/${results.length}`);
    successful.forEach(r => console.log(`  - ${r.label}`));

    if (failed.length > 0) {
        console.log(`❌ Presets échoués: ${failed.length}/${results.length}`);
        failed.forEach(r => console.log(`  - ${r.label}: ${r.error}`));
    }

    console.log("\n💡 RECOMMANDATIONS:");
    console.log("- Preset A: Bon équilibre créativité/précision pour usage général");
    console.log("- Preset B: Idéal pour applications nécessitant une précision maximale");
    console.log("- Preset C: Parfait pour maximiser la variété culinaire");
    console.log("- Preset D: Optimal pour des recettes simples et accessibles");
}

// Exécution
testAllPresets().catch(console.error);
