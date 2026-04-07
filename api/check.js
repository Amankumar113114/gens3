// export default async function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'OPTIONS') return res.status(200).end();
//   if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

//   const { claim, lang } = req.body || {};
//   if (!claim) return res.status(400).json({ error: 'Missing claim' });

//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set in environment variables' });

//   const prompt = `You are SatyaCheck, an automated fact-checking AI for Indian vernacular news.
// Language hint: ${lang || 'EN'}
// Post to fact-check: ${claim}
// Respond ONLY with raw JSON (no markdown, no backticks):
// {"optimized_claim":"cleaned claim","detected_language":"language name","verdict":"TRUE","confidence":0.85,"explanation":"2-3 sentence explanation","context_accuracy_notes":"","sources":["source1"],"misleading_elements":""}
// verdict must be exactly one of: TRUE, FALSE, PARTIALLY TRUE, UNVERIFIED`;

//   const models = [
//     'gemini-pro',
//     'gemini-1.0-pro',
//     'gemini-1.5-pro',
//     'gemini-1.5-flash',
//     'gemini-2.0-flash-lite',
//     'gemini-2.0-flash',
//   ];

//   let lastError = '';

//   for (const model of models) {
//     try {
//       const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           contents: [{ parts: [{ text: prompt }] }],
//           generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
//         })
//       });

//       const data = await response.json();

//       if (data.error) {
//         lastError = data.error.message;
//         if (data.error.status === 'NOT_FOUND' || data.error.message.includes('not found') || data.error.message.includes('not supported')) {
//           continue;
//         }
//         return res.status(500).json({ error: data.error.message });
//       }

//       const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
//       if (!text) { lastError = 'Empty response'; continue; }

//       const clean = text.replace(/```json|```/g, '').trim();
//       const parsed = JSON.parse(clean);
//       parsed._model = model;
//       return res.status(200).json(parsed);

//     } catch (err) {
//       lastError = err.message;
//       continue;
//     }
//   }

//   return res.status(500).json({
//     error: `All Gemini models unavailable. Last error: ${lastError}. Verify your GEMINI_API_KEY at aistudio.google.com/apikey`
//   });
// }

// export default async function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'OPTIONS') return res.status(200).end();
//   if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

//   const { claim, lang } = req.body || {};
//   if (!claim) return res.status(400).json({ error: 'Missing claim' });

//   const prompt = `You are SatyaCheck, an automated fact-checking AI for Indian vernacular news.
// Language hint: ${lang || 'EN'}
// Post to fact-check: ${claim}
// Respond ONLY with raw JSON (no markdown):
// {"optimized_claim":"cleaned claim","detected_language":"language name","verdict":"TRUE","confidence":0.85,"explanation":"2-3 sentence explanation","sources":["source1"]}
// verdict must be exactly one of: TRUE, FALSE, PARTIALLY TRUE, UNVERIFIED`;

//   // ================= GEMINI =================
//   const geminiKey = process.env.GEMINI_API_KEY;

//   const geminiModels = [
//     'gemini-1.5-flash',
//     'gemini-1.5-pro',
//     'gemini-2.0-flash-lite'
//   ];

//   if (geminiKey) {
//     for (const model of geminiModels) {
//       try {
//         const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

//         const r = await fetch(url, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             contents: [{ parts: [{ text: prompt }] }]
//           })
//         });

//         const data = await r.json();

//         if (!data.error) {
//           const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
//           if (text) {
//             const clean = text.replace(/```json|```/g, '').trim();
//             const parsed = JSON.parse(clean);
//             parsed._provider = 'gemini';
//             parsed._model = model;
//             return res.status(200).json(parsed);
//           }
//         }
//       } catch (e) {}
//     }
//   }

//   // ================= GROQ =================
//   const groqKey = process.env.GROQ_API_KEY;

//   if (groqKey) {
//     try {
//       const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${groqKey}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           model: "llama3-8b-8192",
//           messages: [{ role: "user", content: prompt }]
//         })
//       });

//       const data = await r.json();
//       const text = data?.choices?.[0]?.message?.content;

//       if (text) {
//         const parsed = JSON.parse(text);
//         parsed._provider = 'groq';
//         return res.status(200).json(parsed);
//       }
//     } catch (e) {}
//   }

//   // ================= OPENAI =================
//   const openaiKey = process.env.OPENAI_API_KEY;

//   if (openaiKey) {
//     try {
//       const r = await fetch("https://api.openai.com/v1/chat/completions", {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${openaiKey}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           model: "gpt-4o-mini",
//           messages: [{ role: "user", content: prompt }]
//         })
//       });

//       const data = await r.json();
//       const text = data?.choices?.[0]?.message?.content;

//       if (text) {
//         const parsed = JSON.parse(text);
//         parsed._provider = 'openai';
//         return res.status(200).json(parsed);
//       }
//     } catch (e) {}
//   }

//   // ================= CLAUDE (OPTIONAL) =================
//   const claudeKey = process.env.CLAUDE_API_KEY;

//   if (claudeKey) {
//     try {
//       const r = await fetch("https://api.anthropic.com/v1/messages", {
//         method: "POST",
//         headers: {
//           "x-api-key": claudeKey,
//           "anthropic-version": "2023-06-01",
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           model: "claude-3-haiku-20240307",
//           max_tokens: 1000,
//           messages: [{ role: "user", content: prompt }]
//         })
//       });

//       const data = await r.json();
//       const text = data?.content?.[0]?.text;

//       if (text) {
//         const parsed = JSON.parse(text);
//         parsed._provider = 'claude';
//         return res.status(200).json(parsed);
//       }
//     } catch (e) {}
//   }

//   // ================= FINAL FALLBACK =================
//   return res.status(200).json({
//     optimized_claim: claim,
//     detected_language: lang || "unknown",
//     verdict: "UNVERIFIED",
//     confidence: 0.5,
//     explanation: "Due to API limits, this claim could not be fully verified. Please try again later.",
//     sources: [],
//     _provider: "fallback"
//   });
// }


export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { claim, lang } = req.body || {};
  if (!claim) return res.status(400).json({ error: 'Missing claim' });

  const prompt = `You are SatyaCheck AI.
Fact-check this claim: ${claim}
Respond ONLY in JSON:
{"optimized_claim":"","detected_language":"","verdict":"TRUE","confidence":0.8,"explanation":"short explanation","sources":[]}
Verdict must be one of: TRUE, FALSE, PARTIALLY TRUE, UNVERIFIED`;

  // 🔒 Safe JSON parser
  function safeParse(text) {
    try {
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return null;
    }
  }

  // ================= GEMINI =================
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro'];

    for (const model of models) {
      try {
        console.log("👉 Trying Gemini:", model);

        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        const data = await r.json();

        if (data.error) {
          console.log("❌ Gemini error:", data.error.message);
          continue; // IMPORTANT: try next
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = safeParse(text);

        if (parsed) {
          parsed._provider = 'gemini';
          parsed._model = model;
          return res.status(200).json(parsed);
        }

      } catch (e) {
        console.log("❌ Gemini failed:", e.message);
      }
    }
  }

  // ================= GROQ =================
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey) {
    try {
      console.log("👉 Trying Groq...");

      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await r.json();
      const parsed = safeParse(data?.choices?.[0]?.message?.content);

      if (parsed) {
        parsed._provider = 'groq';
        return res.status(200).json(parsed);
      }

    } catch (e) {
      console.log("❌ Groq failed:", e.message);
    }
  }

  // ================= OPENAI =================
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    try {
      console.log("👉 Trying OpenAI...");

      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await r.json();
      const parsed = safeParse(data?.choices?.[0]?.message?.content);

      if (parsed) {
        parsed._provider = 'openai';
        return res.status(200).json(parsed);
      }

    } catch (e) {
      console.log("❌ OpenAI failed:", e.message);
    }
  }

  // ================= CLAUDE =================
  const claudeKey = process.env.CLAUDE_API_KEY;

  if (claudeKey) {
    try {
      console.log("👉 Trying Claude...");

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": claudeKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await r.json();
      const parsed = safeParse(data?.content?.[0]?.text);

      if (parsed) {
        parsed._provider = 'claude';
        return res.status(200).json(parsed);
      }

    } catch (e) {
      console.log("❌ Claude failed:", e.message);
    }
  }

  // ================= FINAL FALLBACK =================
  console.log("⚠️ All APIs failed. Using fallback.");

  return res.status(200).json({
    optimized_claim: claim,
    detected_language: lang || "unknown",
    verdict: "UNVERIFIED",
    confidence: 0.5,
    explanation: "API limits reached. This is a fallback response.",
    sources: [],
    _provider: "fallback"
  });
}