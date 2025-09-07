import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { ChatOpenAI } from "@langchain/openai";
import { streamSSE, stream } from 'hono/streaming'
import { config } from '../config.js';

const app = new Hono()

const llm = new ChatOpenAI({
  openAIApiKey: config.openai_api_key,
  modelName: "gpt-4.1-mini",
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

app.get('/', async (c) => {
  const message = await callLLM("Traduis Hello World en Français");
  return c.text(message);
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
  return c.text(message);
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
