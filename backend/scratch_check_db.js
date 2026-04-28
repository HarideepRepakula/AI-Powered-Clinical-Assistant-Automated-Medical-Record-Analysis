import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MedicalRecordSchema = new mongoose.Schema({
    recordName: String,
    aiSummary: String,
    fileUrl: String,
    uploadedAt: Date
});

const MedicalRecord = mongoose.model('MedicalRecord', MedicalRecordSchema, 'medicalrecords');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medhub');
        const latest = await MedicalRecord.findOne().sort({ uploadedAt: -1 });
        console.log(JSON.stringify(latest, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
