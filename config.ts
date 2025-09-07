import * as dotenv from "dotenv";
dotenv.config();

class Config {
    openai_api_key: string = "";
    together_ai_api_key: string = "";
    openrouter_api_key: string = "";
    have_openai_api_key: boolean = false;
    have_together_ai_api_key: boolean = false;
    have_openrouter_api_key: boolean = false;
    have_model: boolean = false;
    model_name: string = "gpt-4.1-mini";

    constructor() {
        this.init();
    }

    populate(name: string): string {
        return process.env[name] || "";
    }

    apiKeyExists(name: string): boolean {
        return this.populate(name) !== "";
    }

    init() {
        this.have_openai_api_key = this.apiKeyExists("OPENAI_API_KEY");
        this.have_together_ai_api_key = this.apiKeyExists("TOGETHER_AI_API_KEY");
        this.have_openrouter_api_key = this.apiKeyExists("OPENROUTER_API_KEY");
        this.have_model = this.apiKeyExists("MODEL_NAME");

        // Do not throw here: allow zero-network tests to import modules and inject fakes.
        // Fail fast only when a real network-dependent dependency is actually invoked.
        this.openai_api_key = this.populate("OPENAI_API_KEY");
        this.together_ai_api_key = this.populate("TOGETHER_AI_API_KEY");
        this.openrouter_api_key = this.populate("OPENROUTER_API_KEY");
        this.model_name = this.populate("MODEL_NAME");
    }
}

export const config = new Config();