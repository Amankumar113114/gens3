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

  const prompt = `You are SatyaCheck, an automated fact-checking AI specialized in Indian vernacular news and social media misinformation.

PIPELINE OPTIMIZATION: First, strip all conversational fluff, filler words, emojis, and non-factual content from the input to extract only verifiable factual claims. This is critical for throughput.

Then fact-check each extracted claim rigorously using your knowledge.

Language hint: ${lang || 'EN'}

Post to fact-check:
${claim}

Respond ONLY with a valid JSON object (no markdown, no backticks, no preamble, raw JSON only):
{
  "optimized_claim": "cleaned factual claim extracted after stripping fluff",
  "detected_language": "language name",
  "verdict": "TRUE",
  "confidence": 0.85,
  "explanation": "2-3 sentence explanation of the verdict with specific reasoning",
  "context_accuracy_notes": "any notes about conflicting or outdated data",
  "sources": ["source1", "source2"],
  "misleading_elements": "what makes this claim potentially misleading if anything, or empty string"
}

verdict must be exactly one of: TRUE, FALSE, PARTIALLY TRUE, UNVERIFIED`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'Gemini API error' });
    }

    // Extract text from Gemini response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return res.status(500).json({ error: 'Empty response from Gemini' });

    // Clean and parse JSON
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
