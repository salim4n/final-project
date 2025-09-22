import { z } from "zod";

// Schema Zod pour les presets (cohérent avec types.ts)
export const Preset = z.object({
    temperature: z.number(),
    topP: z.number(),
    frequencyPenalty: z.number(),
    presencePenalty: z.number()
});

export type PresetType = z.infer<typeof Preset>;

// PRESET D - Praticité optimisée (recommandé par l'analyse LLM expert)
// Optimal pour les plans de repas ET listes de courses
export const OPTIMAL_PRESET: PresetType = {
    temperature: 0.6,        // Créativité modérée mais pratique
    topP: 0.6,              // Équilibre entre variété et praticité
    frequencyPenalty: 0.2,   // Permet ingrédients communs et pratiques
    presencePenalty: 0.05,   // Légère diversité sans complexifier
};

// Presets alternatifs pour des cas spécifiques
export const PRECISION_PRESET: PresetType = {
    temperature: 0.4,        // Maximum de précision
    topP: 0.5,              // Choix conservateurs
    frequencyPenalty: 0.1,   // Permet répétitions techniques
    presencePenalty: 0.0,    // Pas de pénalité
};

export const CREATIVE_PRESET: PresetType = {
    temperature: 0.8,        // Plus de créativité
    topP: 0.7,              // Choix plus variés
    frequencyPenalty: 0.3,   // Évite répétitions
    presencePenalty: 0.1,    // Encourage diversité
};

// Preset par défaut (utilise l'optimal)
export const DEFAULT_PRESET = OPTIMAL_PRESET;

// Fonction utilitaire pour valider un preset
export function validatePreset(preset: unknown): PresetType {
    return Preset.parse(preset);
}

// Fonction pour créer un preset personnalisé avec validation
export function createCustomPreset(
    temperature: number,
    topP: number,
    frequencyPenalty: number,
    presencePenalty: number
): PresetType {
    return validatePreset({
        temperature,
        topP,
        frequencyPenalty,
        presencePenalty
    });
}
