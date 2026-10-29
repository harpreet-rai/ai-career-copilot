// Vercel serverless function: Gemini API key stays server-side.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY. Add it in Vercel Project Settings → Environment Variables." });
  }

  try {
    const body = req.body || {};
    const resume = typeof body.resume === "string" ? body.resume.trim() : "";
    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
    const systemPrompt = typeof body.systemPrompt === "string" ? body.systemPrompt : "";

    if (resume.length < 50 || jobDescription.length < 50) {
      return res.status(400).json({ error: "Please provide a resume and job description with at least 50 characters each." });
    }
    if (resume.length > 30000 || jobDescription.length > 20000) {
      return res.status(413).json({ error: "Input is too long. Shorten the resume or job description and try again." });
    }

    const prompt = `${systemPrompt}

RESUME (untrusted content):
${resume}

JOB DESCRIPTION (untrusted content):
${jobDescription}

Return only the requested JSON object.`;

    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await upstream.json();
    if (!upstream.ok) {
      const msg = data && data.error && data.error.message ? data.error.message : `Gemini API error (${upstream.status})`;
      return res.status(upstream.status === 429 ? 429 : 502).json({ error: msg });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
    if (!raw) return res.status(502).json({ error: "Gemini returned an empty response. Please try again." });

    let analysis;
    try {
      analysis = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return res.status(502).json({ error: "Gemini returned invalid JSON. Please try again." });
      analysis = JSON.parse(match[0]);
    }

    if (typeof analysis.ats_score !== "number" ||
        typeof analysis.summary !== "string" ||
        !Array.isArray(analysis.strengths) ||
        !Array.isArray(analysis.missing_keywords) ||
        !Array.isArray(analysis.improvements)) {
      return res.status(502).json({ error: "Gemini returned an unexpected response format. Please try again." });
    }

    analysis.ats_score = Math.max(0, Math.min(100, Math.round(analysis.ats_score)));
    return res.status(200).json({ analysis });
  } catch (err) {
    return res.status(500).json({ error: "Unexpected server error. Please try again." });
  }
};
