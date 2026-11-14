import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const port = process.env.PORT || 8787;
const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

app.get('/health', (_req, res) => res.json({ ok: true, configured: Boolean(apiKey), model }));

app.post('/chat', async (req, res) => {
  if (!apiKey) return res.status(503).json({ error: 'Backend belum dikonfigurasi.' });
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (!messages.length) return res.status(400).json({ error: 'messages wajib diisi.' });
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'https://elara-agent.vercel.app',
        'X-Title': 'Elara Agent'
      },
      body: JSON.stringify({ model, messages, route: 'fallback' })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'OpenRouter error' });
    res.json({ reply: data?.choices?.[0]?.message?.content || 'Elara belum menerima jawaban.' });
  } catch (error) {
    res.status(502).json({ error: 'Gagal menghubungi model AI.' });
  }
});

app.listen(port, () => console.log(`Elara backend listening on ${port}`));
