# 🍽️ API de Planification Nutritionnelle

Cette API utilise un graphe LangGraph pour générer des plans nutritionnels hebdomadaires personnalisés avec génération parallèle de repas et liste de courses automatique.

## 🚀 Endpoints Disponibles

### 1. Génération de Plan Nutritionnel

**POST** `/nutrition-plan`

Génère un plan nutritionnel complet pour une semaine basé sur le profil utilisateur.

#### Paramètres d'entrée

```json
{
  "gender": "male" | "female",
  "age": number,
  "weight": number,
  "height": number,
  "activityLevel": number,
  "objective": "muscleGain" | "weightLoss" | "maintenance",
  "dietType": "vegetarian" | "vegan" | "noPork" | "none",
  "intolerances": string
}
```

#### Exemple de requête

```bash
curl -X POST http://localhost:3000/nutrition-plan \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "male",
    "age": 30,
    "weight": 75,
    "height": 180,
    "activityLevel": 1.5,
    "objective": "muscleGain",
    "dietType": "none",
    "intolerances": "lactose"
  }'
```

#### Réponse

```json
{
  "success": true,
  "message": "Plan nutritionnel généré avec succès",
  "data": {
    "profile": {
      "gender": "male",
      "age": 30,
      "weight": 75,
      "height": 180,
      "activityLevel": 1.5,
      "objective": "muscleGain",
      "dietType": "none",
      "intolerances": "lactose"
    },
    "macronutrients": {
      "calories": 2977,
      "protein": 223,
      "carbohydrates": 335,
      "fat": 83
    },
    "weeklyMealPlan": {
      "monday": {
        "breakfast": {
          "name": "Mediterranean Chickpea Shakshuka",
          "description": "Prep time: 10 min | Cook time: 20 min...",
          "calories": "450",
          "macros": {
            "protein": "20g",
            "carbs": "35g",
            "fats": "15g"
          },
          "ingredients": ["200g canned chickpeas", "2 large eggs", "..."]
        },
        "lunch": { /* ... */ },
        "dinner": { /* ... */ },
        "snack": { /* ... */ }
      },
      "tuesday": { /* ... */ },
      // ... autres jours
    },
    "groceryList": {
      "fruitsEtLegumes": [
        {
          "name": "Tomates",
          "quantity": "2",
          "unit": "kg"
        }
        // ... autres items
      ],
      "viandesEtPoissons": [ /* ... */ ],
      "produitsLaitiers": [ /* ... */ ],
      "feculentsEtCereales": [ /* ... */ ],
      "epicerie": [ /* ... */ ],
      "condimentsEtEpices": [ /* ... */ ]
    },
    "summary": "Plan nutritionnel hebdomadaire personnalisé généré pour un homme de 30 ans..."
  }
}
```

### 2. Exemple de Profil

**GET** `/nutrition-plan/example`

Retourne un exemple de structure de profil utilisateur.

#### Réponse

```json
{
  "message": "Exemple de profil pour la planification nutritionnelle",
  "example": {
    "gender": "male",
    "age": 30,
    "weight": 75,
    "height": 180,
    "activityLevel": 1.5,
    "objective": "muscleGain",
    "dietType": "none",
    "intolerances": "lactose"
  },
  "usage": "POST /nutrition-plan avec ce format de données"
}
```

## 📊 Structure des Données

### Profil Utilisateur

| Champ | Type | Description | Valeurs possibles |
|-------|------|-------------|-------------------|
| `gender` | string | Genre | "male", "female" |
| `age` | number | Âge en années | > 0 |
| `weight` | number | Poids en kg | > 0 |
| `height` | number | Taille en cm | > 0 |
| `activityLevel` | number | Niveau d'activité | 1.2 (sédentaire) à 2.0 (très actif) |
| `objective` | string | Objectif | "muscleGain", "weightLoss", "maintenance" |
| `dietType` | string | Type de régime | "vegetarian", "vegan", "noPork", "none" |
| `intolerances` | string | Intolérances alimentaires | Texte libre |

### Plan de Repas

Chaque jour contient :
- **breakfast** (optionnel) : Petit-déjeuner
- **lunch** : Déjeuner  
- **dinner** : Dîner
- **snack** (optionnel) : Collation

Chaque repas contient :
- **name** : Nom du plat
- **description** : Instructions de préparation
- **calories** : Valeur calorique
- **macros** : Répartition des macronutriments
- **ingredients** : Liste des ingrédients avec quantités

### Liste de Courses

Organisée par catégories :
- **fruitsEtLegumes** : Fruits et légumes
- **viandesEtPoissons** : Viandes et poissons
- **produitsLaitiers** : Produits laitiers
- **feculentsEtCereales** : Féculents et céréales
- **epicerie** : Épicerie générale
- **condimentsEtEpices** : Condiments et épices

## ⚡ Fonctionnalités

### 🔄 Génération Parallèle
- **7 plans de repas** générés simultanément
- **Temps d'exécution optimisé** (~50 secondes au lieu de 5+ minutes)
- **Variété garantie** entre les jours

### 🧮 Calculs Nutritionnels
- **Métabolisme de base** calculé automatiquement
- **Besoins caloriques** adaptés à l'objectif
- **Répartition des macronutriments** optimisée

### 🛒 Liste de Courses Intelligente
- **Consolidation automatique** des ingrédients de la semaine
- **Organisation par catégories** pour faciliter les achats
- **Quantités optimisées** pour éviter le gaspillage

### 🔧 Gestion d'Erreurs Robuste
- **Validation Zod** des données d'entrée
- **Fallbacks intelligents** en cas d'erreur LLM
- **Messages d'erreur détaillés**

## 🚀 Démarrage

1. **Installer les dépendances** :
   ```bash
   pnpm install
   ```

2. **Configurer les variables d'environnement** :
   ```bash
   cp .env.example .env
   # Ajouter votre clé OpenAI
   ```

3. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```

4. **Tester l'API** :
   ```bash
   npx tsx test-api-nutrition.ts
   ```

## 📝 Exemples d'Usage

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/nutrition-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gender: 'female',
    age: 25,
    weight: 60,
    height: 165,
    activityLevel: 1.3,
    objective: 'weightLoss',
    dietType: 'vegetarian',
    intolerances: 'gluten'
  })
});

const result = await response.json();
console.log(result.data.weeklyMealPlan);
```

### Python

```python
import requests

profile = {
    "gender": "male",
    "age": 35,
    "weight": 80,
    "height": 175,
    "activityLevel": 1.6,
    "objective": "maintenance",
    "dietType": "none",
    "intolerances": ""
}

response = requests.post(
    'http://localhost:3000/nutrition-plan',
    json=profile
)

result = response.json()
print(result['data']['summary'])
```

## 🔍 Monitoring et Logs

Le serveur affiche des logs détaillés :
- 🍽️ Début de génération du plan
- 🧮 Calcul des macronutriments
- 🚀 Génération parallèle des 7 jours
- 🛒 Création de la liste de courses
- ✅ Succès de la génération

## ⚠️ Limitations

- **Temps de réponse** : 30-60 secondes selon la complexité
- **Rate limiting** : Dépend des limites OpenAI
- **Qualité des repas** : Dépend de la performance du LLM

## 🔧 Configuration Avancée

### Presets LLM
L'API utilise un preset optimal par défaut :
- **Temperature** : 0.6 (créativité modérée)
- **TopP** : 0.6 (équilibre variété/praticité)
- **Frequency Penalty** : 0.2 (permet ingrédients communs)
- **Presence Penalty** : 0.05 (légère diversité)

### Fallbacks
En cas d'erreur de parsing JSON :
- **Réparation automatique** du JSON
- **Plans de repas par défaut** si nécessaire
- **Liste de courses basique** en fallback
