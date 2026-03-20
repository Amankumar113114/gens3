export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — allow any origin so your GitHub Pages or any site can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Pre-flight
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { claim, lang } = req.body;

  if (!claim) {
    return res.status(400).json({ error: 'Missing claim field' });
  }

  const systemPrompt = `You are SatyaCheck, an automated fact-checking AI specialized in Indian vernacular news and social media misinformation.

PIPELINE OPTIMIZATION: First, strip all conversational fluff, filler words, emojis, and non-factual content from the input to extract only verifiable factual claims. This is critical for throughput.

Then fact-check each extracted claim rigorously.

Respond ONLY with a valid JSON object (no markdown, no preamble):
{
  "optimized_claim": "cleaned factual claim(s) extracted after stripping fluff",
  "detected_language": "language name",
  "verdict": "TRUE" | "FALSE" | "PARTIALLY TRUE" | "UNVERIFIED",
  "confidence": 0.0-1.0,
  "explanation": "2-3 sentence explanation of the verdict with specific reasoning",
  "context_accuracy_notes": "any notes about conflicting or outdated data in retrieval",
  "sources": ["source1", "source2"],
  "misleading_elements": "what makes this claim potentially misleading if anything"
}

Be factual, concise, and use your knowledge of Indian current events, politics, science, and culture.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,   // ← key lives ONLY here on server
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Language hint: ${lang || 'EN'}\n\nPost to fact-check:\n${claim}` }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'Anthropic API error' });
    }

    const text = data.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
