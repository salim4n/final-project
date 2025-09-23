/**
 * Test script for the nutrition planning API endpoint
 */

async function testNutritionAPI() {
    console.log("🧪 Testing Nutrition Planning API");
    
    const baseUrl = "http://localhost:3000";
    
    // Test profile data
    const testProfile = {
        gender: "male",
        age: 30,
        weight: 75,
        height: 180,
        activityLevel: 1.5,
        objective: "muscleGain",
        dietType: "none",
        intolerances: "lactose"
    };
    
    try {
        console.log("📝 Test profile:", JSON.stringify(testProfile, null, 2));
        console.log("🚀 Sending request to /nutrition-plan...");
        
        const startTime = Date.now();
        
        const response = await fetch(`${baseUrl}/nutrition-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testProfile)
        });
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log(`⏱️ Request completed in ${duration.toFixed(2)} seconds`);
        console.log(`📊 Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ API Error:", errorData);
            return;
        }
        
        const result = await response.json();
        
        console.log("✅ API Response received successfully!");
        console.log("🔍 Response structure validation:");
        
        // Validate response structure
        if (result.success) {
            console.log("✓ Success flag: true");
            console.log("✓ Message:", result.message);
            
            if (result.data) {
                const data = result.data;
                console.log("✓ Data object present");
                console.log("✓ Profile:", !!data.profile);
                console.log("✓ Macronutrients:", !!data.macronutrients);
                console.log("✓ Weekly Meal Plan:", !!data.weeklyMealPlan);
                console.log("✓ Grocery List:", !!data.groceryList);
                console.log("✓ Summary:", !!data.summary);
                
                // Display key information
                if (data.macronutrients) {
                    console.log("\n📈 Nutritional Information:");
                    console.log(`Calories: ${data.macronutrients.calories} kcal`);
                    console.log(`Protein: ${data.macronutrients.protein}g`);
                    console.log(`Carbs: ${data.macronutrients.carbohydrates}g`);
                    console.log(`Fat: ${data.macronutrients.fat}g`);
                }
                
                // Display meal plan summary
                if (data.weeklyMealPlan) {
                    console.log("\n🍽️ Weekly Meal Plan Summary:");
                    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
                    
                    days.forEach((day, index) => {
                        const dayPlan = data.weeklyMealPlan[day];
                        if (dayPlan) {
                            console.log(`${dayNames[index]}: ${dayPlan.lunch?.name || 'N/A'}`);
                        }
                    });
                }
                
                // Display grocery list summary
                if (data.groceryList) {
                    console.log("\n🛒 Grocery List Summary:");
                    const groceryList = data.groceryList;
                    console.log(`Fruits & Vegetables: ${groceryList.fruitsEtLegumes?.length || 0} items`);
                    console.log(`Meat & Fish: ${groceryList.viandesEtPoissons?.length || 0} items`);
                    console.log(`Dairy: ${groceryList.produitsLaitiers?.length || 0} items`);
                    console.log(`Grains & Cereals: ${groceryList.feculentsEtCereales?.length || 0} items`);
                    console.log(`Grocery: ${groceryList.epicerie?.length || 0} items`);
                    console.log(`Condiments & Spices: ${groceryList.condimentsEtEpices?.length || 0} items`);
                }
                
                console.log("\n📝 Summary:");
                console.log(data.summary);
                
            } else {
                console.log("❌ No data in response");
            }
        } else {
            console.log("❌ Success flag: false");
        }
        
        // Save response to file for inspection
        const fs = await import('fs/promises');
        await fs.writeFile('./api-response.json', JSON.stringify(result, null, 2), 'utf-8');
        console.log("\n💾 Full response saved to: ./api-response.json");
        
    } catch (error) {
        console.error("❌ Test failed:", error);
        
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }
    }
}

async function testExampleEndpoint() {
    console.log("\n🧪 Testing Example Endpoint");
    
    try {
        const response = await fetch("http://localhost:3000/nutrition-plan/example");
        const result = await response.json();
        
        console.log("✅ Example endpoint response:");
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error("❌ Example endpoint test failed:", error);
    }
}

// Run tests
async function runTests() {
    console.log("🚀 Starting API Tests\n");
    
    // Test example endpoint first
    await testExampleEndpoint();
    
    // Wait a bit before main test
    console.log("\n⏳ Waiting 2 seconds before main test...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test main nutrition planning endpoint
    await testNutritionAPI();
    
    console.log("\n🏁 Tests completed!");
}

runTests().catch(console.error);
