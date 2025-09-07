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

    async getState(threadId: string = "default") {
        const config = { configurable: { thread_id: threadId } };
        const state = await this.graph.getState(config);
        return state;
    }

    async approveAndContinue(threadId: string = "default") {
        const config = { configurable: { thread_id: threadId } };
        
        try {
            // Continuer sans input - le graph reprend là où il s'était arrêté
            const stream = await this.graph.stream(null, config, { streamMode: "values" });
            let finalResponse = "";
            
            for await (const chunk of stream) {
                console.log('Continue stream chunk:', JSON.stringify(chunk, null, 2));
                
                // Chercher dans agent.messages (comme dans les logs)
                if (chunk.agent?.messages) {
                    for (const message of chunk.agent.messages) {
                        if (message.content && typeof message.content === 'string') {
                            finalResponse = message.content;
                            console.log('Found final response:', finalResponse);
                        }
                    }
                }
                
                // Fallback: chercher dans messages directement
                if (!finalResponse && chunk.messages) {
                    const lastMessage = chunk.messages[chunk.messages.length - 1];
                    if (lastMessage && (lastMessage.type === 'ai' || lastMessage._getType?.() === 'ai')) {
                        finalResponse = lastMessage.content || "";
                    }
                }
            }
            
            console.log('Final response to return:', finalResponse);
            return finalResponse;
        } catch (error) {
            console.error('Error in approveAndContinue:', error);
            throw error;
        }
    }

    async invokeWithApproval(message: string, threadId: string = "default") {
        const config = { configurable: { thread_id: threadId } };
        
        // Première exécution - peut s'arrêter aux outils
        const result = await this.graph.invoke(
            { messages: [{ role: "user", content: message }] },
            config
        );

        // Vérifier si on est interrompu
        const state = await this.graph.getState(config);
        
        if (state.next && state.next.includes("tools")) {
            // L'agent veut utiliser des outils
            const lastMessage = result.messages[result.messages.length - 1];
            return {
                needsApproval: true,
                toolCalls: lastMessage.tool_calls || [],
                threadId,
                partialResponse: lastMessage.content || ""
            };
        }

        // Pas d'interruption, retourner la réponse finale
        return {
            needsApproval: false,
            response: result.messages[result.messages.length - 1].content,
            threadId
        };
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
