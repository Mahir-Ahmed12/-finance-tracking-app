import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// AI Studio dev server must run on port 3000
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get GoogleGenAI client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Check AI status endpoint
app.get('/api/ai/status', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    available: hasKey,
    model: 'gemini-3.8-flash',
    message: hasKey ? 'Gemini 3.8 Flash operational' : 'No GEMINI_API_KEY found in environment'
  });
});

// AI Financial Advisor / Chat endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, financialContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI service unavailable. Please check that GEMINI_API_KEY is configured in Settings > Secrets.',
      });
    }

    const systemInstruction = `You are NEONVAULT's cybernetic financial AI advisor.
Your persona: highly analytical, futuristic yet grounded, razor-sharp, objective, and deeply encouraging. You prioritize wealth preservation, debt reduction, disciplined saving, and smart optimization.
You are given verified user financial context (currency, balances, monthly income, expenses, categories, top spending, budget limits, savings goals).
Rules:
1. Always base financial answers and recommendations directly on the provided user metrics.
2. Never make up transactions or pretend numbers exist when they don't.
3. Be concise, structured, and actionable. Use bullet points or short paragraphs.
4. Format monetary figures clearly with the user's currency.
5. If the user asks a general financial or budgeting question, provide tactical, practical cybernetic wisdom.`;

    const prompt = `User Financial Context:
${JSON.stringify(financialContext || {}, null, 2)}

User Question/Prompt:
${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || 'Unable to generate advice at this moment.';
    return res.json({ reply });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Gemini chat error:', errorMsg);
    return res.status(500).json({ error: 'Failed to process AI query', details: errorMsg });
  }
});

// AI Quick Financial Deep Insights Endpoint
app.post('/api/gemini/insights', async (req, res) => {
  try {
    const { financialData } = req.body;
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI service unavailable' });
    }

    const prompt = `Analyze this user's monthly financial report and return 3-4 ultra-tactical, cyber-styled executive observations.
Financial Snapshot:
${JSON.stringify(financialData, null, 2)}

Provide your response strictly as JSON with this structure:
{
  "summary": "One sentence verdict on current fiscal velocity",
  "healthScore": 85,
  "observations": [
    { "type": "warning" | "opportunity" | "achievement" | "neutral", "title": "...", "detail": "...", "action": "..." }
  ],
  "runwayAnalysis": "Estimated runway or savings projection note"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'You are an advanced fiscal auditor AI operating in a high-tech financial terminal. Be precise, numerical, and actionable.',
      },
    });

    const text = response.text || '{}';
    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch {
      return res.json({ raw: text });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Gemini insights error:', errorMsg);
    return res.status(500).json({ error: 'Failed to generate insights', details: errorMsg });
  }
});

// Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[NEONVAULT] Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[NEONVAULT] Server boot failure:', err);
  process.exit(1);
});
