/**
 * Utility functions for robust JSON parsing with LLM responses
 */

/**
 * Attempts to parse JSON with multiple fallback strategies
 */
export function parseJsonRobustly(jsonString: string): any {
  // First, try direct parsing
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.log("🔧 Direct JSON parsing failed, attempting cleanup...");
  }

  // Clean the JSON string
  let cleaned = cleanJsonString(jsonString);
  
  // Try parsing the cleaned version
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.log("🔧 Cleaned JSON parsing failed, attempting repair...");
  }

  // Try more aggressive repair
  let repaired = repairJsonString(cleaned);
  
  try {
    return JSON.parse(repaired);
  } catch (error) {
    console.error("❌ All JSON parsing attempts failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`JSON parsing failed: ${errorMessage}`);
  }
}

/**
 * Cleans common JSON formatting issues
 */
function cleanJsonString(jsonString: string): string {
  return jsonString
    // Remove any text before the first {
    .replace(/^[^{]*/, '')
    // Remove any text after the last }
    .replace(/[^}]*$/, '')
    // Fix common escaping issues
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    // Remove any trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix double quotes issues
    .replace(/'/g, '"')
    // Remove any control characters
    .replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Attempts to repair malformed JSON
 */
function repairJsonString(jsonString: string): string {
  return jsonString
    // Fix missing quotes around property names
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Fix missing quotes around string values
    .replace(/:\s*([^",{\[\]}\s][^",{\[\]}]*)\s*([,}\]])/g, ': "$1"$2')
    // Fix empty values
    .replace(/"\s*:\s*,/g, '": "",')
    .replace(/"\s*:\s*}/g, '": ""}')
    // Remove duplicate commas
    .replace(/,\s*,/g, ',')
    // Remove leading commas
    .replace(/{\s*,/g, '{')
    .replace(/\[\s*,/g, '[')
    // Ensure proper number formatting
    .replace(/:\s*"(\d+\.?\d*)"\s*([,}\]])/g, ': $1$2')
    // Fix truncated objects/arrays
    .replace(/[^}\]]*$/, function(match) {
      if (match.trim() && !match.includes('}') && !match.includes(']')) {
        return '}';
      }
      return match;
    });
}

/**
 * Extracts JSON from text that might contain other content
 */
export function extractJsonFromText(text: string): string {
  // Look for JSON-like structures
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  // If no JSON found, return the original text
  return text;
}

/**
 * Validates that a parsed object has the expected structure
 */
export function validateJsonStructure(obj: any, requiredKeys: string[]): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  return requiredKeys.every(key => key in obj);
}
