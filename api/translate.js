export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, speaker, langCode, context, terms } = req.body;
  if (!text || !speaker || !langCode) return res.status(400).json({ error: "Missing fields" });

  const src = speaker === "doctor" ? "ko" : langCode;
  const tgt = speaker === "doctor" ? langCode : "ko";
  const role = speaker === "doctor" ? "DOCTOR (Korean medical staff)" : "PATIENT (foreign visitor)";

  // Build matched terms section
  let termSection = "";
  if (terms && terms.length > 0) {
    termSection = "\n[Medical Dictionary - USE THESE EXACT TERMS]\n" +
      terms.map(t => `${t.ko} = ${t.en} = ${t.ja} = ${t.cn} = ${t.tw}`).join("\n") + "\n";
  }

  const SYSTEM = `You are a professional medical interpreter at a Korean clinic.
Speaker: ${role}
Direction: ${src} → ${tgt}
${termSection}
RULES:
1. Output ONLY the translated text. No JSON, no quotes, no explanation.
2. The speaker is ${role}. Translate from THEIR perspective and intent.
3. PATIENT speech patterns:
   - Casual statements are often questions → add question markers (요?/까?)
   - "oh really" = surprise → "아, 정말요?" NOT "네, 맞습니다"
   - "you need passport?" = asking/confirming → "여권이 필요한 건가요?" NOT "여권이 필요합니다"
   - Preserve emotion: surprise, worry, pain, confusion, relief
4. DOCTOR speech patterns:
   - Professional, polite, reassuring tone
   - Clear instructions and explanations
5. Use dictionary terms EXACTLY when they appear in the input.
6. ZH-TW: NEVER use simplified Chinese characters.
7. If message involves pregnancy/medication/allergy/anesthesia/side effects/complications → start with ⚠️
8. Numbers, dosages, dates: keep exact.`;

  const userMsg = context
    ? `[Conversation so far]\n${context}\n\n[${role} now says]: ${text}`
    : `[${role} says]: ${text}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 250,
        temperature: 0.2,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    const data = await r.json();
    let translated = (data.content?.[0]?.text || "").trim();

    // Clean up any accidental formatting
    if (translated.startsWith("{")) {
      try { translated = JSON.parse(translated).t || translated; } catch {}
    }
    if (translated.startsWith('"') && translated.endsWith('"')) translated = translated.slice(1, -1);

    const warn = translated.startsWith("⚠️");
    return res.status(200).json({ translated, warn });
  } catch (err) {
    return res.status(500).json({ error: "fail" });
  }
}
