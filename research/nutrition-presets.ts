import { ChatOpenAI } from "@langchain/openai";
import { config } from "../config.js";
import { generateDailyMeals } from "../lib/prompt/daily-meals.js";
import { generateCourseList } from "../lib/prompt/course-list.js";
import { writeFileSync } from "fs";
import { join } from "path";

// pnpm tsx research/nutrition-presets.ts

// Définition du type Preset
type Preset = {
    temperature: number,
    topP: number,
    frequencyPenalty: number,
    presencePenalty: number
}

// Contexte de test pour les plans de repas
const testMealContext = {
    mealsAlreadyUsed: ["Salade César", "Saumon grillé", "Omelette"],
    totalCalories: 2000,
    proteinRatio: 150,
    carbohydrateRatio: 200,
    fatRatio: 89,
    dietType: "none",
    intolerances: ["lactose"],
    includeBreakfast: true
};

// Contexte de test pour les listes de courses
const testGroceryContext = [
    "Salade de quinoa aux légumes grillés",
    "Saumon grillé avec brocolis vapeur",
    "Omelette aux champignons et épinards"
];

// PRESET A — Créativité contrôlée (équilibré pour la nutrition)
// Objectif: Génère des recettes créatives mais nutritionnellement précises
// Effet attendu: Variété culinaire avec respect strict des macros
const presetA: Preset = {
    temperature: 0.8,        // Créativité modérée pour variété des plats
    topP: 0.7,              // Focus sur les choix les plus probables
    frequencyPenalty: 0.3,   // Évite les répétitions d'ingrédients
    presencePenalty: 0.1,    // Encourage la diversité des concepts
}

// PRESET B — Précision technique (focus sur l'exactitude)
// Objectif: Maximise la précision nutritionnelle et les instructions détaillées
// Effet attendu: Recettes très précises, instructions claires, macros exactes
const presetB: Preset = {
    temperature: 0.4,        // Faible créativité pour plus de précision
    topP: 0.5,              // Choix conservateurs et fiables
    frequencyPenalty: 0.1,   // Permet répétition d'éléments techniques importants
    presencePenalty: 0.0,    // Pas de pénalité pour répéter concepts nutritionnels
}

// PRESET C — Diversité maximale (exploration culinaire)
// Objectif: Maximise la variété des cuisines et techniques de cuisson
// Effet attendu: Plats très variés, techniques diverses, inspiration internationale
const presetC: Preset = {
    temperature: 1.1,        // Haute créativité pour exploration
    topP: 0.9,              // Large éventail de possibilités
    frequencyPenalty: 0.5,   // Forte pénalité contre répétitions
    presencePenalty: 0.3,    // Encourage nouveaux concepts à chaque génération
}

// PRESET D — Praticité optimisée (focus utilisateur)
// Objectif: Génère des recettes simples, rapides et pratiques
// Effet attendu: Instructions claires, ingrédients accessibles, temps réduits
const presetD: Preset = {
    temperature: 0.6,        // Créativité modérée mais pratique
    topP: 0.6,              // Équilibre entre variété et praticité
    frequencyPenalty: 0.2,   // Permet ingrédients communs et pratiques
    presencePenalty: 0.05,   // Légère diversité sans complexifier
}

// Exécute un appel LLM pour génération de plan de repas avec un preset donné
async function testMealGeneration(preset: Preset, label: string): Promise<string> {
    const llm = new ChatOpenAI({
        openAIApiKey: config.openai_api_key,
        modelName: config.model_name,
        streaming: false,
        ...preset,
    });

    console.log(`\n\n================== ${label} - MEAL GENERATION ==================\n`);
    console.log(`[${label}] Preset:`);
    console.log(JSON.stringify(preset, null, 2));

    const prompt = generateDailyMeals(
        testMealContext.mealsAlreadyUsed,
        testMealContext.totalCalories,
        testMealContext.proteinRatio,
        testMealContext.carbohydrateRatio,
        testMealContext.fatRatio,
        testMealContext.dietType,
        testMealContext.intolerances,
        testMealContext.includeBreakfast
    );

    const result = await llm.invoke(prompt);
    const output = result.content as string;
    
    console.log(`\n[${label}] Meal Plan Output:`);
    console.log(output.substring(0, 500) + "...");
    
    return output;
}

// Exécute un appel LLM pour génération de liste de courses avec un preset donné
async function testGroceryGeneration(preset: Preset, label: string): Promise<string> {
    const llm = new ChatOpenAI({
        openAIApiKey: config.openai_api_key,
        modelName: config.model_name,
        streaming: false,
        ...preset,
    });

    console.log(`\n\n================== ${label} - GROCERY GENERATION ==================\n`);
    console.log(`[${label}] Preset:`);
    console.log(JSON.stringify(preset, null, 2));

    const prompt = generateCourseList(testGroceryContext);
    const result = await llm.invoke(prompt);
    const output = result.content as string;
    
    console.log(`\n[${label}] Grocery List Output:`);
    console.log(output.substring(0, 300) + "...");
    
    return output;
}

// Calcule des métriques spécifiques à la nutrition
function analyzeNutritionOutput(text: string, type: 'meal' | 'grocery') {
    const tokens = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
    const unique = new Set(tokens);
    
    // Métriques spécifiques à la nutrition
    const nutritionKeywords = ['calories', 'protein', 'carbs', 'fat', 'vitamin', 'mineral', 'fiber'];
    const cookingKeywords = ['grill', 'steam', 'sauté', 'roast', 'boil', 'bake'];
    const diversityKeywords = ['mediterranean', 'asian', 'french', 'italian', 'japanese', 'thai'];
    
    const nutritionScore = nutritionKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
    const cookingScore = cookingKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
    const diversityScore = diversityKeywords.filter(kw => text.toLowerCase().includes(kw)).length;
    
    // Tentative de parsing JSON pour vérifier la structure
    let jsonValid = false;
    try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        JSON.parse(cleaned);
        jsonValid = true;
    } catch (e) {
        jsonValid = false;
    }
    
    return {
        length: text.length,
        tokens: tokens.length,
        uniqueTokens: unique.size,
        nutritionScore,
        cookingScore,
        diversityScore,
        jsonValid,
        type
    };
}

// Similarité de Jaccard adaptée (même fonction que votre cours)
function jaccard(a: string, b: string): number {
    const ta = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
    const tb = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
    const inter = new Set([...ta].filter(x => tb.has(x)));
    const union = new Set([...ta, ...tb]);
    return union.size ? inter.size / union.size : 0;
}

// Analyse comparative avec LLM critique spécialisé nutrition
async function analyzeNutritionDiff(outputs: string[], presets: Preset[], labels: string[], type: 'meal' | 'grocery'): Promise<void> {
    const critic = new ChatOpenAI({
        openAIApiKey: config.openai_api_key,
        modelName: config.model_name,
        temperature: 0.2,
        topP: 0.3,
        frequencyPenalty: 0,
        presencePenalty: 0,
    });

    const systemPrompt = `Tu es un expert en nutrition et développement d'applications alimentaires.

Objectif: Comparer ${outputs.length} sorties de génération de ${type === 'meal' ? 'plans de repas' : 'listes de courses'} et évaluer:
- La qualité nutritionnelle et la précision des informations
- La variété culinaire et créativité des propositions
- La praticité et clarté des instructions
- La conformité au format JSON demandé
- L'impact des hyperparamètres sur la qualité de sortie

Format de sortie en français:
1) Résumé de chaque preset (2-3 lignes chacun)
2) Comparaison des forces/faiblesses (puces)
3) Impact des hyperparamètres sur la qualité nutritionnelle
4) Évaluation de la diversité culinaire
5) Recommandation du meilleur preset pour la production`;

    let userPrompt = `Type de génération: ${type === 'meal' ? 'Plans de repas quotidiens' : 'Listes de courses'}\n\n`;
    
    outputs.forEach((output, i) => {
        userPrompt += `=== ${labels[i]} ===\n`;
        userPrompt += `Preset: ${JSON.stringify(presets[i], null, 2)}\n`;
        userPrompt += `Sortie: ${output.substring(0, 800)}...\n\n`;
    });

    const res = await critic.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ]);

    console.log(`\n\n================== ANALYSE CRITIQUE ${type.toUpperCase()} ==================\n`);
    
    if (typeof res.content === "string") {
        console.log(res.content);
        
        // Sauvegarder l'analyse dans un fichier Markdown
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `analyse-${type}-presets-${timestamp}.md`;
        const filepath = join(process.cwd(), 'research', filename);
        
        const markdownContent = `# Analyse des Presets - ${type === 'meal' ? 'Plans de Repas' : 'Listes de Courses'}

**Date d'analyse:** ${new Date().toLocaleString('fr-FR')}

## Configuration des Tests

### Presets Testés
${labels.map((label, i) => `
#### ${label}
\`\`\`json
${JSON.stringify(presets[i], null, 2)}
\`\`\`
`).join('')}

### Contexte de Test
${type === 'meal' ? `
- **Repas déjà utilisés:** ${testMealContext.mealsAlreadyUsed.join(', ')}
- **Calories totales:** ${testMealContext.totalCalories} kcal
- **Protéines:** ${testMealContext.proteinRatio}g
- **Glucides:** ${testMealContext.carbohydrateRatio}g
- **Lipides:** ${testMealContext.fatRatio}g
- **Type de régime:** ${testMealContext.dietType}
- **Intolérances:** ${testMealContext.intolerances.join(', ')}
- **Petit-déjeuner inclus:** ${testMealContext.includeBreakfast ? 'Oui' : 'Non'}
` : `
- **Plan de repas testé:**
${testGroceryContext.map(meal => `  - ${meal}`).join('\n')}
`}

## Analyse LLM Expert

${res.content}

---
*Analyse générée automatiquement par le système de test des presets nutrition*
`;

        try {
            writeFileSync(filepath, markdownContent, 'utf8');
            console.log(`\n📄 Analyse sauvegardée dans: ${filename}`);
        } catch (error) {
            console.error(`❌ Erreur lors de la sauvegarde: ${error}`);
        }
    }
}

// Point d'entrée principal
async function main(): Promise<void> {
    const presets = [presetA, presetB, presetC, presetD];
    const labels = ["Preset A (Créativité contrôlée)", "Preset B (Précision technique)", "Preset C (Diversité maximale)", "Preset D (Praticité optimisée)"];

    console.log("🍽️  COMPARAISON DES PRESETS POUR GÉNÉRATION NUTRITIONNELLE 🍽️");
    console.log("================================================================");

    // Test des plans de repas
    console.log("\n📋 PHASE 1: GÉNÉRATION DE PLANS DE REPAS");
    const mealOutputs: string[] = [];
    for (let i = 0; i < presets.length; i++) {
        const output = await testMealGeneration(presets[i], labels[i]);
        mealOutputs.push(output);
    }

    // Métriques des plans de repas
    console.log("\n📊 MÉTRIQUES PLANS DE REPAS:");
    const mealMetrics = mealOutputs.map((output, i) => {
        const metrics = analyzeNutritionOutput(output, 'meal');
        console.log(`${labels[i]}:`, metrics);
        return metrics;
    });

    // Similarités entre plans de repas
    console.log("\n🔍 SIMILARITÉS PLANS DE REPAS (Jaccard):");
    for (let i = 0; i < mealOutputs.length; i++) {
        for (let j = i + 1; j < mealOutputs.length; j++) {
            const sim = jaccard(mealOutputs[i], mealOutputs[j]);
            console.log(`${labels[i]} vs ${labels[j]}: ${sim.toFixed(3)}`);
        }
    }

    // Analyse critique des plans de repas
    await analyzeNutritionDiff(mealOutputs, presets, labels, 'meal');

    // Test des listes de courses
    console.log("\n🛒 PHASE 2: GÉNÉRATION DE LISTES DE COURSES");
    const groceryOutputs: string[] = [];
    for (let i = 0; i < presets.length; i++) {
        const output = await testGroceryGeneration(presets[i], labels[i]);
        groceryOutputs.push(output);
    }

    // Métriques des listes de courses
    console.log("\n📊 MÉTRIQUES LISTES DE COURSES:");
    const groceryMetrics = groceryOutputs.map((output, i) => {
        const metrics = analyzeNutritionOutput(output, 'grocery');
        console.log(`${labels[i]}:`, metrics);
        return metrics;
    });

    // Analyse critique des listes de courses
    await analyzeNutritionDiff(groceryOutputs, presets, labels, 'grocery');

    console.log("\n✅ ANALYSE TERMINÉE - Consultez les résultats ci-dessus pour choisir le meilleur preset!");
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { presetA, presetB, presetC, presetD, testMealGeneration, testGroceryGeneration, analyzeNutritionOutput };
