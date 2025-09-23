import { NutritionPlanningGraph } from "./graph.js";

async function testNutritionGraph() {
    console.log("🧪 Testing Nutrition Planning Graph");
    
    // Create the graph
    const graph = NutritionPlanningGraph();
    const compiledGraph = graph.compile();
    
    // Test profile data
    const testProfile = {
        gender: "male" as const,
        age: 30,
        weight: 75,
        height: 180,
        activityLevel: 1.5,
        objective: "muscleGain" as const,
        dietType: "none" as const,
        intolerances: "lactose"
    };
    
    console.log("📝 Test profile:", testProfile);
    
    try {
        console.log("🚀 Starting graph execution...");
        
        // Execute the graph
        const result = await compiledGraph.invoke({
            input: testProfile
        });
        
        console.log("✅ Graph execution completed!");
        console.log("📊 Final result:", JSON.stringify(result.finalResponse, null, 2));
        
        // Validate the result structure
        if (result.finalResponse) {
            console.log("\n🔍 Validation:");
            console.log("✓ Profile:", !!result.finalResponse.profile);
            console.log("✓ Macronutrients:", !!result.finalResponse.macronutrients);
            console.log("✓ Weekly Meal Plan:", !!result.finalResponse.weeklyMealPlan);
            console.log("✓ Grocery List:", !!result.finalResponse.groceryList);
            console.log("✓ Summary:", !!result.finalResponse.summary);
            
            // Display key information
            console.log("\n📈 Key Information:");
            console.log(`Calories: ${result.finalResponse.macronutrients.calories} kcal`);
            console.log(`Protein: ${result.finalResponse.macronutrients.protein}g`);
            console.log(`Carbs: ${result.finalResponse.macronutrients.carbohydrates}g`);
            console.log(`Fat: ${result.finalResponse.macronutrients.fat}g`);
            
            console.log("\n🍽️ Weekly Meals:");
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
            
            days.forEach((day, index) => {
                const dayPlan = (result.finalResponse!.weeklyMealPlan as any)[day];
                console.log(`\n${dayNames[index]}:`);
                if (dayPlan.breakfast) {
                    console.log(`  Breakfast: ${dayPlan.breakfast.name}`);
                }
                console.log(`  Lunch: ${dayPlan.lunch.name}`);
                console.log(`  Dinner: ${dayPlan.dinner.name}`);
                if (dayPlan.snack) {
                    console.log(`  Snack: ${dayPlan.snack.name}`);
                }
            });
            
            console.log("\n🛒 Grocery Categories:");
            const groceryList = result.finalResponse.groceryList;
            console.log(`Fruits & Vegetables: ${groceryList.fruitsEtLegumes.length} items`);
            console.log(`Meat & Fish: ${groceryList.viandesEtPoissons.length} items`);
            console.log(`Dairy: ${groceryList.produitsLaitiers.length} items`);
            console.log(`Grains & Cereals: ${groceryList.feculentsEtCereales.length} items`);
            console.log(`Grocery: ${groceryList.epicerie.length} items`);
            console.log(`Condiments & Spices: ${groceryList.condimentsEtEpices.length} items`);
            
            // Generate markdown report
            console.log("\n📝 Generating markdown report...");
            const markdownReport = generateMarkdownReport(result.finalResponse);
            
            // Save to file
            const fs = await import('fs/promises');
            const reportPath = './nutrition-plan-report.md';
            await fs.writeFile(reportPath, markdownReport, 'utf-8');
            console.log(`✅ Markdown report saved to: ${reportPath}`);
            
        } else {
            console.log("❌ No final response generated");
        }
        
    } catch (error) {
        console.error("❌ Graph execution failed:", error);
        
        // Log more detailed error information
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
    }
}

function generateMarkdownReport(finalResponse: any): string {
    const profile = finalResponse.profile;
    const macros = finalResponse.macronutrients;
    const weeklyPlan = finalResponse.weeklyMealPlan;
    const groceryList = finalResponse.groceryList;
    
    const currentDate = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let markdown = `# 🍽️ Plan Nutritionnel Hebdomadaire

*Généré le ${currentDate}*

---

## 👤 Profil Utilisateur

| Caractéristique | Valeur |
|------------------|--------|
| **Genre** | ${profile.gender === 'male' ? 'Homme' : 'Femme'} |
| **Âge** | ${profile.age} ans |
| **Poids** | ${profile.weight} kg |
| **Taille** | ${profile.height} cm |
| **Niveau d'activité** | ${profile.activityLevel} |
| **Objectif** | ${getObjectiveText(profile.objective)} |
| **Type de régime** | ${getDietTypeText(profile.dietType)} |
| **Intolérances** | ${profile.intolerances || 'Aucune'} |

---

## 📊 Besoins Nutritionnels Quotidiens

| Macronutriment | Quantité |
|----------------|----------|
| **🔥 Calories** | **${macros.calories} kcal** |
| **🥩 Protéines** | ${macros.protein}g |
| **🍞 Glucides** | ${macros.carbohydrates}g |
| **🥑 Lipides** | ${macros.fat}g |

---

## 📅 Plan de Repas Hebdomadaire

`;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const dayEmojis = ['🌟', '💪', '🚀', '⚡', '🎯', '🌈', '😌'];
    
    days.forEach((day, index) => {
        const dayPlan = weeklyPlan[day];
        const dayName = dayNames[index];
        const emoji = dayEmojis[index];
        
        markdown += `### ${emoji} ${dayName}

`;
        
        if (dayPlan.breakfast) {
            markdown += `#### 🌅 Petit-déjeuner
**${dayPlan.breakfast.name}**
- ${dayPlan.breakfast.description}
- 🔥 ${dayPlan.breakfast.calories}
- 🥩 ${dayPlan.breakfast.macros.protein} | 🍞 ${dayPlan.breakfast.macros.carbs} | 🥑 ${dayPlan.breakfast.macros.fats}

**Ingrédients :**
${dayPlan.breakfast.ingredients.map((ing: string) => `- ${ing}`).join('\n')}

`;
        }
        
        markdown += `#### 🌞 Déjeuner
**${dayPlan.lunch.name}**
- ${dayPlan.lunch.description}
- 🔥 ${dayPlan.lunch.calories}
- 🥩 ${dayPlan.lunch.macros.protein} | 🍞 ${dayPlan.lunch.macros.carbs} | 🥑 ${dayPlan.lunch.macros.fats}

**Ingrédients :**
${dayPlan.lunch.ingredients.map((ing: string) => `- ${ing}`).join('\n')}

#### 🌆 Dîner
**${dayPlan.dinner.name}**
- ${dayPlan.dinner.description}
- 🔥 ${dayPlan.dinner.calories}
- 🥩 ${dayPlan.dinner.macros.protein} | 🍞 ${dayPlan.dinner.macros.carbs} | 🥑 ${dayPlan.dinner.macros.fats}

**Ingrédients :**
${dayPlan.dinner.ingredients.map((ing: string) => `- ${ing}`).join('\n')}

`;
        
        if (dayPlan.snack) {
            markdown += `#### 🍎 Collation
**${dayPlan.snack.name}**
- ${dayPlan.snack.description}
- 🔥 ${dayPlan.snack.calories}
- 🥩 ${dayPlan.snack.macros.protein} | 🍞 ${dayPlan.snack.macros.carbs} | 🥑 ${dayPlan.snack.macros.fats}

**Ingrédients :**
${dayPlan.snack.ingredients.map((ing: string) => `- ${ing}`).join('\n')}

`;
        }
        
        markdown += `---

`;
    });
    
    markdown += `## 🛒 Liste de Courses Hebdomadaire

### 🥬 Fruits et Légumes
${groceryList.fruitsEtLegumes.map((item: any) => `- ${item.quantity} ${item.unit} de ${item.name}`).join('\n')}

### 🥩 Viandes et Poissons
${groceryList.viandesEtPoissons.map((item: any) => `- ${item.quantity} ${item.unit} de ${item.name}`).join('\n')}

### 🥛 Produits Laitiers
${groceryList.produitsLaitiers.map((item: any) => `- ${item.quantity} ${item.unit} de ${item.name}`).join('\n')}

### 🌾 Féculents et Céréales
${groceryList.feculentsEtCereales.map((item: any) => `- ${item.quantity} ${item.unit} de ${item.name}`).join('\n')}

### 🏪 Épicerie
${groceryList.epicerie.map((item: any) => `- ${item.quantity} ${item.unit} de ${item.name}`).join('\n')}

### 🧂 Condiments et Épices
${groceryList.condimentsEtEpices.map((item: any) => `- ${item.quantity} ${item.unit} de ${item.name}`).join('\n')}

---

## 📝 Résumé

${finalResponse.summary}

---

*Plan généré automatiquement par le système de planification nutritionnelle IA*
`;

    return markdown;
}

function getObjectiveText(objective: string): string {
    switch (objective) {
        case 'muscleGain': return 'Prise de masse musculaire';
        case 'weightLoss': return 'Perte de poids';
        case 'maintenance': return 'Maintien du poids';
        default: return objective;
    }
}

function getDietTypeText(dietType: string): string {
    switch (dietType) {
        case 'vegetarian': return 'Végétarien';
        case 'vegan': return 'Végétalien';
        case 'noPork': return 'Sans porc';
        case 'none': return 'Aucune restriction';
        default: return dietType;
    }
}

// Run the test
testNutritionGraph().catch(console.error);
