import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ChatOpenAI } from "@langchain/openai";
import { streamSSE, stream } from 'hono/streaming'
import { config } from '../config.js';
import { v4 as uuid } from 'uuid';
import agent from '../agent.js';
import { NutritionPlanningGraph } from '../graph.js';
import { Profile } from '../lib/tools/types.js';

const app = new Hono()

const llm = new ChatOpenAI({
  openAIApiKey: config.openai_api_key,
  modelName: config.model_name,
  streaming: true,
  temperature: 0.7,
});

export async function callLLM(prompt: string): Promise<string> {
  const res = await llm.invoke(prompt);
  return res.content as string;
}

export async function* streamLLM(prompt: string): AsyncGenerator<string> {
  const stream = await llm.stream(prompt);
  for await (const chunk of stream) {
    yield chunk.content as string;
  }
}

// ===== ROUTES DE TEST LLM =====

app.get('/', async (c) => {
  const message = await callLLM("Traduis Hello World en Français");
  return c.html(message);
})

app.get('/test', async (c) => {
  return c.html(`<!DOCTYPE html>
<html>
<body>
<div id="output"></div>
<script>
const es = new EventSource('/sse?q=Raconte une histoire de science-fiction');
es.addEventListener('token', (e) => {
  document.getElementById('output').insertAdjacentText('beforeend', e.data);
});
es.addEventListener('done', () => {
  es.close();
  console.log('Stream terminé');
});
</script>
</body>
</html>`);
})

app.get('/invoke', async (c) => {
  const q = c.req.query('q') ?? "Réponds en français, qui est napoleon, raconte moi son histoire"
   const message = await callLLM(q);
  return c.html(message);
})

// Http Streamable
app.get('/stream', async (c) => {
  const q = c.req.query('q') ?? "Réponds en français, qui est napoleon, raconte moi son histoire"
  return stream(c, async (stream) => {
    for await (const token of streamLLM(q)) {
      await stream.write(token);
    }
  });
})

// Server-Sent Events (SSE) streaming
app.get('/sse', async (c) => {
  const q = c.req.query('q') ?? "Réponds en français, qui est napoleon, raconte moi son histoire"
  return streamSSE(c, async (stream) => {
    for await (const token of streamLLM(q)) {
      await stream.writeSSE({ event: 'token', data: token });
    }
    await stream.writeSSE({ event: 'done', data: '' });
  });
})

// ===== ROUTE PLANIFICATION NUTRITIONNELLE =====

app.post('/nutrition-plan', async (c) => {
  try {
    // Récupérer les données du profil depuis le body de la requête
    const body = await c.req.json();
    
    // Valider le profil avec Zod
    const profile = Profile.parse(body);
    
    console.log("🍽️ Generating nutrition plan for profile:", profile);
    
    // Créer et compiler le graphe
    const graph = NutritionPlanningGraph();
    const compiledGraph = graph.compile();
    
    // Exécuter le graphe avec le profil
    const result = await compiledGraph.invoke({
      input: profile
    });
    
    if (!result.finalResponse) {
      return c.json({ 
        error: 'Failed to generate nutrition plan',
        message: 'No final response generated'
      }, 500);
    }
    
    console.log("✅ Nutrition plan generated successfully");
    
    // Retourner la réponse complète
    return c.json({
      success: true,
      data: result.finalResponse,
      message: 'Plan nutritionnel généré avec succès'
    });
    
  } catch (error) {
    console.error("❌ Error generating nutrition plan:", error);
    
    if (error instanceof Error) {
      return c.json({ 
        error: 'Validation or processing error',
        message: error.message,
        details: error.stack
      }, 400);
    }
    
    return c.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, 500);
  }
});

// Route pour obtenir un exemple de structure de profil
app.get('/nutrition-plan/example', async (c) => {
  const exampleProfile = {
    gender: "male",
    age: 30,
    weight: 75,
    height: 180,
    activityLevel: 1.5,
    objective: "muscleGain",
    dietType: "none",
    intolerances: "lactose"
  };
  
  return c.json({
    message: "Exemple de profil pour la planification nutritionnelle",
    example: exampleProfile,
    usage: "POST /nutrition-plan avec ce format de données"
  });
});

// ===== ROUTES AGENT (SSE uniquement) =====

app.post('/approve-tools', async (c) => {
  const threadId = c.req.query('threadId') ?? ""
  
  if (!threadId) {
    return c.json({ error: 'threadId required' }, 400)
  }
  
  c.header('X-Thread-ID', threadId)
  
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({ 
      event: 'thread-id', 
      data: threadId 
    });
    
    await stream.writeSSE({ 
      event: 'status', 
      data: 'Exécution des outils approuvés...' 
    });
    
    try {
      const response = await agent.approveAndContinue(threadId);
      
      await stream.writeSSE({ 
        event: 'response', 
        data: response 
      });
      
      await stream.writeSSE({ 
        event: 'done', 
        data: '' 
      });
    } catch (error) {
      await stream.writeSSE({ 
        event: 'error', 
        data: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
})


app.get('/agent-state', async (c) => {
  const threadId = c.req.query('threadId') ?? ""
  
  if (!threadId) {
    return c.json({ error: 'threadId required' }, 400)
  }
  
  const state = await agent.getState(threadId)
  return c.json({ state, threadId })
})


app.post('/stream-agent-sse', async (c) => {
  const q = c.req.query('q') ?? ""
  const threadId = uuid()
  
  // Envoyer le threadId en premier
  c.header('X-Thread-ID', threadId)
  
  // Vérifier d'abord si des outils nécessitent approbation
  const result = await agent.invokeWithApproval(q, threadId)
  
  if (result.needsApproval) {
    // Retourner les outils à approuver via SSE
    return streamSSE(c, async (stream) => {
      await stream.writeSSE({ 
        event: 'thread-id', 
        data: threadId 
      });
      await stream.writeSSE({ 
        event: 'needs-approval', 
        data: JSON.stringify(result) 
      });
    });
  }
  
  return streamSSE(c, async (stream) => {
    // Envoyer le threadId en premier événement
    await stream.writeSSE({ 
      event: 'thread-id', 
      data: threadId 
    });
    
    await stream.writeSSE({ 
      event: 'token', 
      data: result.response 
    });
    
    await stream.writeSSE({ event: 'done', data: '' });
  });
})


app.post('/continue-stream-agent-sse', async (c) => {
  const q = c.req.query('q') ?? ""
  const threadId = c.req.query('threadId') ?? ""
  
  if (!threadId) {
    return c.json({ error: 'threadId required for continuing conversation' }, 400)
  }
  
  // Vérifier d'abord si des outils nécessitent approbation
  const result = await agent.invokeWithApproval(q, threadId)
  
  if (result.needsApproval) {
    return streamSSE(c, async (stream) => {
      await stream.writeSSE({ 
        event: 'thread-id', 
        data: threadId 
      });
      await stream.writeSSE({ 
        event: 'needs-approval', 
        data: JSON.stringify(result) 
      });
    });
  }
  
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      event: 'thread-id', 
      data: threadId 
    });
    
    await stream.writeSSE({ 
      event: 'token', 
      data: result.response 
    });
    
    await stream.writeSSE({ event: 'done', data: '' });
  });
})

const port = Number(process.env.PORT) || 3000
serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

/*
@langchain/langgraph-cli @langchain/langgraph @langchain/core @langchain/community langchainhub
*/
