/**
 * Medical Records Controller
 * POST /api/medical-records/upload        — patient uploads a record
 * GET  /api/medical-records               — patient fetches own records
 * GET  /api/medical-records/patient/:id   — doctor fetches a patient's records
 * DELETE /api/medical-records/:id         — patient deletes a record
 * POST /api/medical-records/:id/summarize — (re)generate AI summary
 */

import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import Tesseract from "tesseract.js";
import { MedicalRecordModel } from "../models/MedicalRecord.js";
import { LabResultModel }     from "../models/LabResult.js";
import { parseLabReportOcr, generateMedicalRecordSummary } from "../services/ollamaService.js";

const UPLOADS_BASE_URL = process.env.UPLOADS_BASE_URL || "http://localhost:4000/uploads";

// Use pdfplumber (via summarize.py) for digital PDFs, Tesseract for images
async function extractText(filePath, mimeType) {
	if (mimeType === 'application/pdf') {
		return new Promise((resolve) => {
			const scriptPath = path.join(process.cwd(), 'summarize.py');
			const py = spawn('python', [scriptPath, filePath]);
			let out = '', err = '';
			py.stdout.on('data', d => { out += d.toString(); });
			py.stderr.on('data', d => { err += d.toString(); });
			py.on('close', () => resolve(out.trim()));
			py.on('error', () => resolve(''));
		});
	}
	const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
	return text?.trim() || '';
}

// ─── Background: OCR + AI Summary ────────────────────────────────────────────

async function processRecordInBackground(filePath, patientId, recordId, fileType, fileName, mimeType) {
	try {
		const ocrText = await extractText(filePath, mimeType);

		if (ocrText.length < 20) {
			console.warn('[RECORDS] Extracted text too short, skipping summary for', fileName);
			return;
		}

		// Parse lab data if it's a lab report
		if (fileType === "Lab Report") {
			try {
				const structured = await parseLabReportOcr(ocrText);
				await LabResultModel.create({
					patientId,
					medicalRecordId: recordId,
					labName:        structured.labName || null,
					recordDate:     structured.recordDate ? new Date(structured.recordDate) : new Date(),
					doctorOrdered:  structured.doctorOrdered || null,
					structuredData: structured.tests || [],
					rawText:        ocrText,
					fileName,
				});
			} catch (e) {
				console.warn('[RECORDS] Lab parse failed:', e.message);
			}
		}

		// Generate AI summary using BART (no Ollama dependency)
		try {
			const scriptPath = path.join(process.cwd(), 'summarize.py');
			const bartResult = await new Promise((resolve, reject) => {
				const py = spawn('python', [scriptPath]);
				let out = '', err = '';
				py.stdin.write(ocrText);
				py.stdin.end();
				py.stdout.on('data', d => { out += d.toString(); });
				py.stderr.on('data', d => { err += d.toString(); });
				py.on('close', code => {
					if (code === 0 && out.trim()) {
						try { resolve(JSON.parse(out.trim())); }
						catch { resolve({ summary: out.trim(), extracted_meds: [] }); }
					} else {
						reject(new Error(err || 'BART failed'));
					}
				});
				py.on('error', reject);
			});

			await MedicalRecordModel.findByIdAndUpdate(recordId, {
				aiSummary:            bartResult.summary,
				aiSummaryGeneratedAt: new Date(),
			});
			console.log(`[RECORDS] BART summary saved for record ${recordId}`);
		} catch (e) {
			console.warn('[RECORDS] BART summary failed:', e.message);
			// Save a fallback so UI doesn't stay on "Generating..."
			await MedicalRecordModel.findByIdAndUpdate(recordId, {
				aiSummary:            `File: ${fileName}. Text extracted (${ocrText.length} chars). AI summary unavailable.`,
				aiSummaryGeneratedAt: new Date(),
			});
		}
	} catch (err) {
		console.error('[RECORDS] Background processing error:', err.message);
	}
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadMedicalRecord(req, res) {
	if (!req.file) {
		return res.status(400).json({ success: false, error: "No file uploaded." });
	}

	const { recordName, type, appointmentId } = req.body;
	if (!recordName?.trim()) {
		try { await fs.unlink(req.file.path); } catch {}
		return res.status(400).json({ success: false, error: "Record name is required." });
	}

	const allowedTypes = ["Lab Report", "Prescription", "Scan", "Other", "Consultation Upload"];
	const fileType = allowedTypes.includes(type) ? type : "Other";

	try {
		const fileUrl = `${UPLOADS_BASE_URL}/${req.file.filename}`;

		const record = await MedicalRecordModel.create({
			patientId:     req.user.userId,
			recordName:    recordName.trim(),
			fileUrl,
			fileName:      req.file.originalname,
			fileType,
			mimeType:      req.file.mimetype,
			fileSize:      req.file.size,
			appointmentId: appointmentId || null,
		});

		// Fire-and-forget: OCR + AI summary in background
		processRecordInBackground(req.file.path, req.user.userId, record._id, fileType, req.file.originalname, req.file.mimetype);

		res.status(201).json({
			success: true,
			message: "Record uploaded. AI summary generating in background.",
			data: {
				id:         record._id,
				recordName: record.recordName,
				fileUrl:    record.fileUrl,
				fileName:   record.fileName,
				fileType:   record.fileType,
				uploadedAt: record.uploadedAt,
				aiSummary:  '',
			},
		});
	} catch (err) {
		try { await fs.unlink(req.file.path); } catch {}
		console.error("[MEDICAL-RECORDS] Upload error:", err.message);
		res.status(500).json({ success: false, error: "Failed to save record." });
	}
}

// ─── Fetch (patient's own) ────────────────────────────────────────────────────

export async function getMedicalRecords(req, res) {
	try {
		const records = await MedicalRecordModel.find({ patientId: req.user.userId })
			.sort({ uploadedAt: -1 })
			.lean();

		res.json({
			success: true,
			data: {
				records: records.map(r => ({
					id:                   r._id,
					recordName:           r.recordName,
					fileUrl:              r.fileUrl,
					fileName:             r.fileName,
					fileType:             r.fileType,
					fileSize:             r.fileSize,
					uploadedAt:           r.uploadedAt,
					appointmentId:        r.appointmentId,
					aiSummary:            r.aiSummary || '',
					aiSummaryGeneratedAt: r.aiSummaryGeneratedAt,
				})),
				total: records.length,
			},
		});
	} catch (err) {
		console.error("[MEDICAL-RECORDS] Fetch error:", err.message);
		res.status(500).json({ success: false, error: "Failed to fetch records." });
	}
}

// ─── Fetch by patientId (doctor access) ──────────────────────────────────────

export async function getPatientMedicalRecords(req, res) {
	try {
		const { patientId } = req.params;
		const records = await MedicalRecordModel.find({ patientId })
			.sort({ uploadedAt: -1 })
			.lean();

		res.json({
			success: true,
			data: {
				records: records.map(r => ({
					id:            r._id,
					recordName:    r.recordName,
					fileUrl:       r.fileUrl,
					fileName:      r.fileName,
					fileType:      r.fileType,
					uploadedAt:    r.uploadedAt,
					appointmentId: r.appointmentId,
					aiSummary:     r.aiSummary || '',
				})),
				total: records.length,
			},
		});
	} catch (err) {
		console.error("[MEDICAL-RECORDS] Doctor fetch error:", err.message);
		res.status(500).json({ success: false, error: "Failed to fetch patient records." });
	}
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteMedicalRecord(req, res) {
	try {
		const record = await MedicalRecordModel.findOne({
			_id:       req.params.id,
			patientId: req.user.userId,
		});

		if (!record) {
			return res.status(404).json({ success: false, error: "Record not found." });
		}

		const uploadsDir = path.join(process.cwd(), "uploads");
		const filename   = path.basename(record.fileUrl);
		try { await fs.unlink(path.join(uploadsDir, filename)); } catch {}

		await MedicalRecordModel.deleteOne({ _id: record._id });

		res.json({ success: true, message: "Record deleted." });
	} catch (err) {
		console.error("[MEDICAL-RECORDS] Delete error:", err.message);
		res.status(500).json({ success: false, error: "Failed to delete record." });
	}
}
