/**
 * AI Service — ClinIQ
 * Primary:  Groq (llama-3.3-70b-versatile) — fast cloud inference
 * Fallback: Ollama (llama3.2)              — local inference
 *
 * Setup:
 *   1. Add GROQ_API_KEY=your_key to backend/.env
 *      Get free key at: https://console.groq.com
 *   2. Ollama fallback: ollama pull llama3.2
 */

import { Ollama } from "ollama";

const GROQ_API_KEY  = process.env.GROQ_API_KEY;
const GROQ_MODEL    = process.env.GROQ_MODEL  || "llama-3.3-70b-versatile";
const GROQ_URL      = "https://api.groq.com/openai/v1/chat/completions";
const OLLAMA_MODEL  = process.env.OLLAMA_MODEL || "llama3.2";
const OLLAMA_HOST   = process.env.OLLAMA_HOST  || "http://localhost:11434";
const MEDICAL_DISCLAIMER = `\n\n---\n⚕️ **Medical Disclaimer**: This AI-generated content is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for medical decisions.`;

const ollamaClient = new Ollama({ host: OLLAMA_HOST });

// ── Core generate: Groq first, Ollama fallback ────────────────────────────────

async function generateGroq(prompt) {
	if (!GROQ_API_KEY) throw new Error("No GROQ_API_KEY");
	const res = await fetch(GROQ_URL, {
		method: "POST",
		headers: {
			"Content-Type":  "application/json",
			"Authorization": `Bearer ${GROQ_API_KEY}`
		},
		body: JSON.stringify({
			model:       GROQ_MODEL,
			messages:    [{ role: "user", content: prompt }],
			temperature: 0.2,
			max_tokens:  1024
		})
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Groq error ${res.status}: ${err}`);
	}
	const data = await res.json();
	return data.choices[0].message.content.trim();
}

async function generateOllama(prompt) {
	const response = await ollamaClient.generate({
		model:   OLLAMA_MODEL,
		prompt,
		stream:  false,
		options: { temperature: 0.2, num_predict: 1024 }
	});
	return response.response.trim();
}

async function generate(prompt) {
	try {
		const text = await generateGroq(prompt);
		console.log("[AI] Groq responded");
		return text;
	} catch (groqErr) {
		console.warn(`[AI] Groq failed (${groqErr.message}), falling back to Ollama...`);
		try {
			const text = await generateOllama(prompt);
			console.log("[AI] Ollama fallback responded");
			return text;
		} catch (ollamaErr) {
			console.error("[AI] Both Groq and Ollama failed:", ollamaErr.message);
			throw new Error("AI service unavailable. Please try again later.");
		}
	}
}

function safeJson(text, fallback) {
	try {
		let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
		const start = cleaned.indexOf('{');
		const end   = cleaned.lastIndexOf('}');
		if (start === -1 || end === -1) return fallback;
		return JSON.parse(cleaned.substring(start, end + 1));
	} catch {
		console.error("[AI] JSON parse failed. Snippet:", text.substring(0, 100));
		return fallback;
	}
}

// ── Exported functions ────────────────────────────────────────────────────────

export async function generateMedicalRecordSummary(ocrText, fileName) {
	const prompt = `You are a holistic health assistant analyzing a medical document.
Document: "${fileName}"
Content: ${ocrText.substring(0, 3000)}

Provide a structured analysis in JSON only (no markdown):
{
  "summary": "2-3 sentence plain-language summary of what this document shows",
  "keyFindings": ["finding 1", "finding 2"],
  "naturalRemedies": [
    "Specific dietary change or natural remedy",
    "Lifestyle recommendation",
    "Herbal or nutritional suggestion"
  ],
  "severityFlag": "none|mild|moderate|urgent",
  "flagReason": "If urgent or moderate, explain why. Otherwise empty string."
}

RULES:
1. Do NOT recommend pharmaceutical drugs.
2. Only suggest natural remedies: diet, herbs, lifestyle, sleep, hydration, exercise.
3. If any value is critically abnormal, set severityFlag to "urgent".`;

	const text = await generate(prompt);
	return safeJson(text, {
		summary: 'Summary generation in progress.',
		keyFindings: [],
		naturalRemedies: ['Stay hydrated', 'Maintain a balanced diet', 'Get regular exercise'],
		severityFlag: 'none',
		flagReason: ''
	});
}

export async function parseLabReportOcr(rawText) {
	const prompt = `You are a medical lab report parser.
Given the following raw OCR text from a lab report, extract ALL test results.
Return ONLY valid JSON (no markdown):
{
  "labName": "string or null",
  "recordDate": "YYYY-MM-DD or null",
  "doctorOrdered": "string or null",
  "tests": [
    {
      "testName": "string",
      "value": "string",
      "numericValue": number_or_null,
      "unit": "string or null",
      "referenceRange": "string or null",
      "flag": "normal|high|low|critical|unknown"
    }
  ]
}

RAW OCR TEXT:
---
${rawText.substring(0, 4000)}
---`;

	const text = await generate(prompt);
	return safeJson(text, { tests: [], rawResponse: text });
}

export async function generatePreConsultSummary({ patientName, prescriptions, labResults }) {
	const rxSummary = prescriptions.slice(0, 5).map((p, i) =>
		`${i + 1}. Prescribed on ${p.createdAt?.toISOString?.().split("T")[0] || "unknown"}: ` +
		p.medicines.map(m => `${m.name} ${m.dosage} ${m.frequency}`).join(", ")
	).join("\n") || "No prescriptions on record.";

	const labSummary = labResults.slice(0, 5).map((l, i) =>
		`${i + 1}. ${l.fileName} (${l.recordDate?.toISOString?.().split("T")[0] || "unknown"}): ` +
		l.structuredData.slice(0, 6).map(t => `${t.testName}=${t.value}${t.unit || ""}`).join(", ")
	).join("\n") || "No lab results on record.";

	const prompt = `You are a clinical AI assistant helping a doctor prepare for a consultation.
Patient: ${patientName}

RECENT PRESCRIPTIONS:
${rxSummary}

RECENT LAB RESULTS:
${labSummary}

Generate a concise pre-consultation clinical brief in JSON only (no markdown):
{
  "summary": "2-3 sentence clinical overview",
  "keyFindings": ["finding1", "finding2"],
  "flaggedLabValues": ["any abnormal values"],
  "recommendations": ["brief action items for the doctor"],
  "riskLevel": "low|moderate|high"
}`;

	const text = await generate(prompt);
	const parsed = safeJson(text, {
		summary: "Unable to generate summary.", keyFindings: [],
		flaggedLabValues: [], recommendations: [], riskLevel: "unknown"
	});
	return { ...parsed, disclaimer: MEDICAL_DISCLAIMER };
}

export async function runCdssCheck({ medicationName, patientLabHistory, existingMedications }) {
	const labContext = patientLabHistory.slice(0, 5).flatMap(l =>
		l.structuredData.slice(0, 8).map(t => `${t.testName}: ${t.value}${t.unit || ""} (${t.flag})`)
	).join(", ") || "No lab data available";

	const meds = existingMedications.slice(0, 8).join(", ") || "None";

	const prompt = `You are a Clinical Decision Support System (CDSS) for a hospital.
A doctor is about to prescribe: "${medicationName}"

Patient's current medications: ${meds}
Patient's recent lab values: ${labContext}

Classification:
- "contraindicated" = absolute contraindications exist
- "warning" = serious interactions exist
- "caution" = minor interactions only
- "safe" = no significant risks

Return ONLY valid JSON:
{
  "riskLevel": "safe|caution|warning|contraindicated",
  "interactions": ["clean interaction summary"],
  "contraindications": ["clean contraindication"],
  "labConcerns": ["concern based on lab values"],
  "recommendation": "one sentence actionable advice for the doctor",
  "requiresAttention": true
}`;

	const text = await generate(prompt);
	const parsed = safeJson(text, {
		riskLevel: "caution", interactions: [], contraindications: [],
		labConcerns: [], recommendation: text, requiresAttention: true
	});
	return { ...parsed, disclaimer: MEDICAL_DISCLAIMER };
}

export async function generateChatbotResponse({ userMessage, context }) {
	const hasRecords = context && context.length > 50 && context !== 'No history available.';

	const prompt = `You are ClinIQ AI, a professional and empathetic clinical health assistant.

PATIENT HISTORY:
${hasRecords ? context.substring(0, 3000) : 'No previous medical records found for this patient.'}

USER QUESTION: "${userMessage}"

GOAL:
- If the answer is in the PATIENT HISTORY, use it to give a personalised response.
- If not, use your general medical knowledge.
- For emergencies like chest pain or difficulty breathing, advise calling emergency services immediately.
- Always end with a Possible Next Steps section.

RULES:
1. Be concise, empathetic, use bullet points.
2. Never give a definitive diagnosis or specific drug dosages.
3. Always recommend consulting a doctor for final decisions.
4. Keep response under 200 words.`;

	const answer = await generate(prompt);
	return {
		answer,
		disclaimer: '⚕️ AI-generated guidance. Consult a doctor for medical decisions.'
	};
}

export async function mapMedsToInventory(extractedNames, storeProducts) {
	if (!extractedNames.length || !storeProducts.length) return [];

	const storeNames = storeProducts.map(p => p.name).join(", ");
	const prompt = `You are a pharmacist. A prescription contains: [${extractedNames.join(", ")}].
Our store has: [${storeNames}].
Match each prescription item to the closest store product (brand=generic is fine).
Return ONLY a JSON array of matched store names, no explanation.
Example: ["Paracetamol 500mg", "Amoxicillin 250mg"]`;

	try {
		const raw   = await generate(prompt);
		const match = raw.match(/\[.*?\]/s);
		if (match) {
			const names = JSON.parse(match[0]);
			return storeProducts.filter(p => names.some(n =>
				p.name.toLowerCase().includes(n.toLowerCase()) ||
				n.toLowerCase().includes(p.name.toLowerCase())
			));
		}
	} catch {
		console.warn('[AI] Fuzzy mapping failed, falling back to regex');
	}

	return storeProducts.filter(p =>
		extractedNames.some(n =>
			p.name.toLowerCase().includes(n.toLowerCase()) ||
			n.toLowerCase().includes(p.name.toLowerCase()) ||
			(p.genericName && p.genericName.toLowerCase().includes(n.toLowerCase()))
		)
	);
}

export async function generateHealthInsights(labResults) {
	if (!labResults || labResults.length === 0) {
		return [
			{ icon: "🚶", title: "Stay Active",  tip: "Aim for 30 minutes of walking daily.", urgency: "info" },
			{ icon: "💧", title: "Hydrate",      tip: "Drink at least 8 glasses of water daily.", urgency: "info" },
			{ icon: "😴", title: "Rest Well",    tip: "Maintain 7-8 hours of sleep each night.", urgency: "info" }
		];
	}

	const latestTests = labResults[0]?.structuredData?.slice(0, 10)
		.map(t => `${t.testName}: ${t.value}${t.unit || ""} (${t.flag})`)
		.join("\n") || "";

	const prompt = `You are a preventive health AI.
Based on these latest lab values:
${latestTests}

Generate 3 short, personalized health tips in JSON only:
{
  "insights": [
    { "icon": "emoji", "title": "short title", "tip": "actionable 1-sentence tip", "urgency": "info|warning|critical" }
  ]
}
Focus on lifestyle changes, not medications.`;

	try {
		const text   = await generate(prompt);
		const parsed = safeJson(text, null);
		if (parsed?.insights?.length) return parsed.insights;
	} catch {}

	return [
		{ icon: "💡", title: "Stay Active", tip: "Regular exercise helps maintain overall health.", urgency: "info" }
	];
}

export async function generatePatientBriefingSummary({ patientName, reason, prescriptions, labResults, transcripts }) {
	const rxSummary = prescriptions.slice(0, 5).map((p, i) =>
		`${i + 1}. Prescribed on ${p.createdAt?.toISOString?.().split("T")[0] || "unknown"}: ` +
		p.medicines.map(m => `${m.name} ${m.dosage} ${m.frequency}`).join(", ")
	).join("\n") || "No prescriptions on record.";

	const labSummary = labResults.slice(0, 5).map((l, i) =>
		`${i + 1}. ${l.fileName} (${l.recordDate?.toISOString?.().split("T")[0] || "unknown"}): ` +
		l.structuredData.slice(0, 6).map(t => `${t.testName}=${t.value}${t.unit || ""} [${t.flag}]`).join(", ")
	).join("\n") || "No lab results on record.";

	const transcriptSummary = transcripts?.slice(0, 3).map((t, i) =>
		`${i + 1}. Session on ${t.createdAt?.toISOString?.().split("T")[0] || "unknown"}: ` +
		(t.summaryAi || t.rawText?.substring(0, 200) || "No summary available")
	).join("\n") || "No previous consultations.";

	const prompt = `You are a clinical AI assistant preparing a structured pre-consultation briefing.

Patient: ${patientName}
Reason for Visit: ${reason || "General consultation"}

RECENT PRESCRIPTIONS:
${rxSummary}

RECENT LAB RESULTS:
${labSummary}

PREVIOUS CONSULTATION NOTES:
${transcriptSummary}

Return ONLY valid JSON (no markdown):
{
  "patientOverview": "2-3 sentence summary of patient health status and reason for visit",
  "riskLevel": "low|moderate|high",
  "conditions": ["known condition 1", "condition 2"],
  "labFindings": [
    { "test": "test name", "value": "value with unit", "flag": "normal|high|low|critical", "note": "brief clinical note" }
  ],
  "prescriptions": [
    { "name": "medication name", "dosage": "dosage", "frequency": "frequency" }
  ],
  "concerns": ["clinical concern 1", "concern 2"],
  "insights": ["clinical insight 1", "insight 2"],
  "discussionPoints": ["suggested discussion point 1", "point 2", "point 3"],
  "editableNotes": ["patient note 1", "note 2"]
}`;

	const text = await generate(prompt);
	const parsed = safeJson(text, {
		patientOverview: text.substring(0, 300),
		riskLevel: "unknown", conditions: [], labFindings: [], prescriptions: [],
		concerns: ["Review current medications", "Discuss recent symptoms"],
		insights: [],
		discussionPoints: ["Review current medications", "Discuss recent symptoms", "Follow up on lab results"],
		editableNotes: []
	});
	return { ...parsed, disclaimer: MEDICAL_DISCLAIMER };
}

export async function generatePostConsultationSummary({ transcript, patientName, doctorName, reason }) {
	const prompt = `You are a clinical AI assistant. Analyze this consultation transcript and generate a structured summary.

Patient: ${patientName}
Doctor: ${doctorName}
Reason for Visit: ${reason || "Consultation"}

TRANSCRIPT:
${transcript.substring(0, 4000)}

Generate a post-consultation summary in JSON format only (no markdown):
{
  "meetingSummary": "Concise 3-5 sentence summary",
  "medicines": [
    { "name": "medication name", "dosage": "dosage", "frequency": "how often", "duration": "how long" }
  ],
  "keyDecisions": ["decision 1", "decision 2"],
  "diagnosis": "primary diagnosis",
  "followUp": "follow-up instructions"
}`;

	const text = await generate(prompt);
	return safeJson(text, {
		meetingSummary: text.substring(0, 500), medicines: [],
		keyDecisions: [], diagnosis: "See transcript", followUp: "Consult your doctor"
	});
}

export async function aiAdminVerifyDoctor(doctorData, licenseOcrText) {
	const prompt = `You are the ClinIQ AI System Administrator.
Verify if a doctor's registration data matches their uploaded medical license.

REGISTRATION DATA:
- Name: ${doctorData.name}
- Specialty: ${doctorData.specialty}
- Claimed License Number: ${doctorData.licenseNumber || 'Not provided'}

EXTRACTED TEXT FROM LICENSE PHOTO (OCR):
"${licenseOcrText.substring(0, 2000)}"

RULES:
1. The name on the license must closely match the registration name.
2. The license number must appear in the OCR text (if provided).
3. The document must look like a valid medical license.
4. If fake, expired, or names don't match, REJECT.

Return ONLY valid JSON:
{
  "decision": "approved" | "rejected",
  "confidenceScore": 0-100,
  "reason": "short explanation",
  "nameMatch": true | false,
  "licenseNumberFound": true | false
}`;

	const text = await generate(prompt);
	return safeJson(text, { decision: "rejected", confidenceScore: 0, reason: "AI verification error — manual review required", nameMatch: false, licenseNumberFound: false });
}

export async function aiAdminSystemReport({ appointments, recentLogins, flaggedUsers }) {
	const apptSummary  = `Total: ${appointments.total}, Completed: ${appointments.completed}, Cancelled: ${appointments.cancelled}, Pending: ${appointments.pending}`;
	const loginSummary = `Total logins (24h): ${recentLogins.total}, Failed: ${recentLogins.failed}, Locked accounts: ${recentLogins.locked}`;
	const flagSummary  = flaggedUsers.length > 0 ? flaggedUsers.map(u => `${u.email} — ${u.reason}`).join('; ') : 'None';

	const prompt = `You are the ClinIQ AI System Administrator generating a platform health report.

SYSTEM METRICS (last 24 hours):
- Appointments: ${apptSummary}
- Login Activity: ${loginSummary}
- Flagged Users: ${flagSummary}

Generate a concise system health report in JSON only:
{
  "overallHealth": "healthy|warning|critical",
  "summary": "2-3 sentence platform status overview",
  "securityAlerts": ["alert1", "alert2"],
  "recommendations": ["action1", "action2"],
  "metrics": {
    "appointmentCompletionRate": "percentage string",
    "loginSuccessRate": "percentage string",
    "activeThreats": 0
  }
}`;

	const text = await generate(prompt);
	return safeJson(text, {
		overallHealth: "warning",
		summary: "System report generation failed. Manual review recommended.",
		securityAlerts: [], recommendations: ["Check system logs manually"],
		metrics: { appointmentCompletionRate: "N/A", loginSuccessRate: "N/A", activeThreats: 0 }
	});
}

export async function aiAdminModerateRecord(recordName, ocrText) {
	const prompt = `You are the ClinIQ AI Content Moderator.
Review this medical record and determine if it contains legitimate medical content.

Record Name: "${recordName}"
Content Preview: "${ocrText.substring(0, 1000)}"

Return ONLY valid JSON:
{
  "isMedical": true | false,
  "flagged": true | false,
  "reason": "brief explanation",
  "contentType": "lab_report|prescription|scan|non_medical|unknown"
}`;

	const text = await generate(prompt);
	return safeJson(text, { isMedical: true, flagged: false, reason: "Moderation check skipped", contentType: "unknown" });
}
