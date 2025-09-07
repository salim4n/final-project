import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { config } from "./config.js";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { calculBmiTool, calculMetabolismTool, calculRepartitionTool, calculNutritionTool } from "./lib/tools/agent-tools.js";

class CoachAgent {
    private model: ChatOpenAI;
    private tools: DynamicStructuredTool[];
    private memory: MemorySaver;
    private graph: any;

    // Singleton
    private static instance: CoachAgent;

    private constructor() {
        this.model = new ChatOpenAI({
            openAIApiKey: config.openai_api_key,
            modelName: config.model_name,
            streaming: true,
            temperature: 0.7,
        });
        
        this.tools = [
            calculBmiTool,
            calculMetabolismTool,
            calculRepartitionTool,
            calculNutritionTool,
        ];
        
        this.memory = new MemorySaver();
        
        // Créer le graph ReAct avec les outils
        this.graph = createReactAgent({
            llm: this.model,
            tools: this.tools,
            checkpointSaver: this.memory,
            interruptBefore: ["tools"]
        });
    }

    static getInstance(): CoachAgent {
        if (!CoachAgent.instance) {
            CoachAgent.instance = new CoachAgent();
        }
        return CoachAgent.instance;
    }

    async invoke(message: string, threadId: string = "default") {
        const config = { configurable: { thread_id: threadId } };
        const result = await this.graph.invoke(
            { messages: [{ role: "user", content: message }] },
            config
        );
        return result.messages[result.messages.length - 1].content;
    }

    async *stream(message: string, threadId: string = "default") {
        const config = { configurable: { thread_id: threadId } };
        const stream = await this.graph.stream(
            { messages: [{ role: "user", content: message }] },
            config
        );

        for await (const chunk of stream) {
            // Yield les messages de l'agent
            if (chunk.agent?.messages) {
                for (const msg of chunk.agent.messages) {
                    if (msg.content) {
                        yield msg.content;
                    }
                }
            }
        }
    }

    getTools() {
        return this.tools;
    }
}

const agent = CoachAgent.getInstance();
export default agent;

