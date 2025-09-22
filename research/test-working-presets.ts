import { generateDailyMealsTool, generateGroceryListTool } from "../lib/tools/agent-tools.js";
import { presetB, presetD } from "./nutrition-presets.js";
import { writeFileSync } from "fs";
import { join } from "path";

// pnpm tsx research/test-working-presets.ts

// Données de test
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

// Test et sauvegarde des résultats
async function testAndSavePresets() {
    const presets = [
        { preset: presetB, label: "Preset B (Précision technique)" },
        { preset: presetD, label: "Preset D (Praticité optimisée)" }
    ];

    console.log("🧪 TEST DES PRESETS FONCTIONNELS AVEC SAUVEGARDE MARKDOWN");
    console.log("=" .repeat(60));

    for (const { preset, label } of presets) {
        console.log(`\n📋 Test ${label}...`);
        
        try {
            // Test plan de repas
            const mealResult = await generateDailyMealsTool.invoke({
                ...testMealParams,
                preset
            });

            // Test liste de courses
            const groceryResult = await generateGroceryListTool.invoke({
                ...testGroceryParams,
                preset
            });

            // Créer le contenu Markdown
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `test-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.md`;
            
            const markdownContent = `# Test ${label}

**Date du test:** ${new Date().toLocaleString('fr-FR')}

## Configuration du Preset

\`\`\`json
${JSON.stringify(preset, null, 2)}
\`\`\`

## Paramètres de Test

### Plan de Repas
- **Repas déjà utilisés:** ${testMealParams.mealsAlreadyUsed.join(', ')}
- **Calories totales:** ${testMealParams.totalCalories} kcal
- **Protéines:** ${testMealParams.proteinRatio}g
- **Glucides:** ${testMealParams.carbohydrateRatio}g
- **Lipides:** ${testMealParams.fatRatio}g
- **Type de régime:** ${testMealParams.dietType}
- **Intolérances:** ${testMealParams.intolerances.join(', ')}
- **Petit-déjeuner inclus:** ${testMealParams.includeBreakfast ? 'Oui' : 'Non'}

### Liste de Courses
- **Plan de repas testé:**
${testGroceryParams.mealPlan.map(meal => `  - ${meal}`).join('\n')}

## Résultats

### ✅ Plan de Repas Généré

#### Petit-déjeuner
- **Nom:** ${mealResult.dailyPlan.breakfast?.name || 'Non inclus'}
- **Calories:** ${mealResult.dailyPlan.breakfast?.calories || 'N/A'} kcal
- **Macros:** ${mealResult.dailyPlan.breakfast ? `${mealResult.dailyPlan.breakfast.macros.protein}g protéines, ${mealResult.dailyPlan.breakfast.macros.carbs}g glucides, ${mealResult.dailyPlan.breakfast.macros.fats}g lipides` : 'N/A'}

**Description:**
\`\`\`
${mealResult.dailyPlan.breakfast?.description || 'Non inclus'}
\`\`\`

**Ingrédients:**
${mealResult.dailyPlan.breakfast?.ingredients.map(ing => `- ${ing}`).join('\n') || 'N/A'}

#### Déjeuner
- **Nom:** ${mealResult.dailyPlan.lunch.name}
- **Calories:** ${mealResult.dailyPlan.lunch.calories} kcal
- **Macros:** ${mealResult.dailyPlan.lunch.macros.protein}g protéines, ${mealResult.dailyPlan.lunch.macros.carbs}g glucides, ${mealResult.dailyPlan.lunch.macros.fats}g lipides

**Description:**
\`\`\`
${mealResult.dailyPlan.lunch.description}
\`\`\`

**Ingrédients:**
${mealResult.dailyPlan.lunch.ingredients.map(ing => `- ${ing}`).join('\n')}

#### Dîner
- **Nom:** ${mealResult.dailyPlan.dinner.name}
- **Calories:** ${mealResult.dailyPlan.dinner.calories} kcal
- **Macros:** ${mealResult.dailyPlan.dinner.macros.protein}g protéines, ${mealResult.dailyPlan.dinner.macros.carbs}g glucides, ${mealResult.dailyPlan.dinner.macros.fats}g lipides

**Description:**
\`\`\`
${mealResult.dailyPlan.dinner.description}
\`\`\`

**Ingrédients:**
${mealResult.dailyPlan.dinner.ingredients.map(ing => `- ${ing}`).join('\n')}

#### Collation
- **Nom:** ${mealResult.dailyPlan.snack?.name || 'Non incluse'}
- **Calories:** ${mealResult.dailyPlan.snack?.calories || 'N/A'} kcal
- **Macros:** ${mealResult.dailyPlan.snack ? `${mealResult.dailyPlan.snack.macros.protein}g protéines, ${mealResult.dailyPlan.snack.macros.carbs}g glucides, ${mealResult.dailyPlan.snack.macros.fats}g lipides` : 'N/A'}

**Description:**
\`\`\`
${mealResult.dailyPlan.snack?.description || 'Non incluse'}
\`\`\`

**Ingrédients:**
${mealResult.dailyPlan.snack?.ingredients.map(ing => `- ${ing}`).join('\n') || 'N/A'}

### ✅ Liste de Courses Générée

#### Fruits et Légumes
${groceryResult.groceryList.fruitsEtLegumes.map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}

#### Viandes et Poissons
${groceryResult.groceryList.viandesEtPoissons.map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}

#### Produits Laitiers
${groceryResult.groceryList.produitsLaitiers.map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}

#### Féculents et Céréales
${groceryResult.groceryList.feculentsEtCereales.map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}

#### Épicerie
${groceryResult.groceryList.epicerie.map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}

#### Condiments et Épices
${groceryResult.groceryList.condimentsEtEpices.map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}

## Statistiques

- **Total catégories liste de courses:** ${Object.keys(groceryResult.groceryList).length}
- **Total articles:** ${Object.values(groceryResult.groceryList).reduce((sum, category) => sum + category.length, 0)}
- **Statut:** ✅ Test réussi

---
*Test généré automatiquement le ${new Date().toLocaleString('fr-FR')}*
`;

            // Sauvegarder le fichier
            const filepath = join(process.cwd(), 'research', filename);
            writeFileSync(filepath, markdownContent, 'utf8');
            
            console.log(`✅ ${label} - Test réussi`);
            console.log(`📄 Résultats sauvegardés dans: ${filename}`);
            
        } catch (error) {
            console.log(`❌ ${label} - Erreur:`, error);
        }
        
        // Pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log("\n🎉 Tests terminés ! Consultez les fichiers Markdown générés dans le dossier research/");
}

// Exécution
testAndSavePresets().catch(console.error);
