export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { claim, lang } = req.body || {};
  if (!claim) return res.status(400).json({ error: 'Missing claim' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set in environment variables' });

  const prompt = `You are SatyaCheck, an automated fact-checking AI for Indian vernacular news.
Language hint: ${lang || 'EN'}
Post to fact-check: ${claim}
Respond ONLY with raw JSON (no markdown, no backticks):
{"optimized_claim":"cleaned claim","detected_language":"language name","verdict":"TRUE","confidence":0.85,"explanation":"2-3 sentence explanation","context_accuracy_notes":"","sources":["source1"],"misleading_elements":""}
verdict must be exactly one of: TRUE, FALSE, PARTIALLY TRUE, UNVERIFIED`;

  const models = [
    'gemini-pro',
    'gemini-1.0-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
  ];

  let lastError = '';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
        })
      });

      const data = await response.json();

      if (data.error) {
        lastError = data.error.message;
        if (data.error.status === 'NOT_FOUND' || data.error.message.includes('not found') || data.error.message.includes('not supported')) {
          continue;
        }
        return res.status(500).json({ error: data.error.message });
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) { lastError = 'Empty response'; continue; }

      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      parsed._model = model;
      return res.status(200).json(parsed);

    } catch (err) {
      lastError = err.message;
      continue;
    }
  }

  return res.status(500).json({
    error: `All Gemini models unavailable. Last error: ${lastError}. Verify your GEMINI_API_KEY at aistudio.google.com/apikey`
  });
}
