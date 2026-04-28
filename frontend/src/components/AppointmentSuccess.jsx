import { useState } from "react";
import "./AppointmentSuccess.css";

// Patient Medical Journey Modal Component
const PatientMedicalJourney = ({ patient, onClose }) => {
	const [activeTab, setActiveTab] = useState('overview');
	
	return (
		<div className="modal-overlay">
			<div className="patient-journey-modal">
				<div className="journey-header">
					<h2>{patient.name}: Full Medical Journey</h2>
					<button onClick={onClose} className="close-btn">×</button>
				</div>
				<div className="journey-tabs">
					<button 
						className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
						onClick={() => setActiveTab('overview')}
					>
						Health Overview
					</button>
					<button 
						className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
						onClick={() => setActiveTab('appointments')}
					>
						Appointments
					</button>
					<button 
						className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
						onClick={() => setActiveTab('reports')}
					>
						Reports & Results
					</button>
				</div>
				<div className="journey-content">
					{activeTab === 'overview' && (
						<div className="overview-content">
							<p><strong>Age:</strong> {patient.age || 'N/A'}</p>
							<p><strong>Condition:</strong> {patient.condition || 'N/A'}</p>
							<p><strong>Last Visit:</strong> {patient.lastVisit || 'N/A'}</p>
						</div>
					)}
					{activeTab === 'appointments' && (
						<div className="appointments-content">
							<p>Appointment history would be displayed here</p>
						</div>
					)}
					{activeTab === 'reports' && (
						<div className="reports-content">
							<p>Medical reports and test results would be displayed here</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

// Prescription Modal Component
const PrescriptionModal = ({ patient, onClose, onSubmit }) => {
	const [prescription, setPrescription] = useState({
		medication: '',
		dosage: '',
		frequency: '',
		instructions: ''
	});
	
	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmit(prescription);
	};
	
	return (
		<div className="modal-overlay">
			<div className="prescription-modal">
				<div className="prescription-header">
					<h2>New Prescription for {patient.name}</h2>
					<button onClick={onClose} className="close-btn">×</button>
				</div>
				<form onSubmit={handleSubmit} className="prescription-form">
					<div className="form-group">
						<label>Medication</label>
						<input 
							type="text" 
							value={prescription.medication}
							onChange={(e) => setPrescription({...prescription, medication: e.target.value})}
							required 
						/>
					</div>
					<div className="form-group">
						<label>Dosage</label>
						<input 
							type="text" 
							value={prescription.dosage}
							onChange={(e) => setPrescription({...prescription, dosage: e.target.value})}
							required 
						/>
					</div>
					<div className="form-group">
						<label>Frequency</label>
						<input 
							type="text" 
							value={prescription.frequency}
							onChange={(e) => setPrescription({...prescription, frequency: e.target.value})}
							required 
						/>
					</div>
					<div className="form-group">
						<label>Instructions</label>
						<textarea 
							value={prescription.instructions}
							onChange={(e) => setPrescription({...prescription, instructions: e.target.value})}
							rows={3}
						/>
					</div>
					<div className="prescription-actions">
						<button type="submit" className="primary-action-btn">Submit Prescription</button>
						<button type="button" onClick={onClose} className="secondary-action-btn">Cancel</button>
					</div>
				</form>
			</div>
		</div>
	);
};

const AppointmentSuccess = ({ appointmentDetails, onViewAppointments, onClose }) => {
	const { doctorName, specialty, time, fee, uploadedFile } = appointmentDetails || {};
	return (
		<div className="success-modal-overlay">
			<div className="success-modal">
				<div className="success-check-circle">
					<svg viewBox="0 0 52 52" className="success-checkmark">
						<circle cx="26" cy="26" r="25" fill="none" />
						<path fill="none" d="M14 27l8 8 16-16" />
					</svg>
				</div>
				<h2 className="success-title">Appointment Confirmed! 🎉</h2>
				<p className="success-subtitle">
					Your appointment with <strong>{doctorName}</strong>{specialty ? ` (${specialty})` : ""} has been successfully scheduled.
				</p>
				<div className="success-details">
					{time && <div className="success-detail-row"><span className="detail-label">🕐 Time</span><span>{time}</span></div>}
					<div className="success-detail-row"><span className="detail-label">💳 Consultation Fee</span><span>₹{fee || 100} <em>(To be paid at the clinic)</em></span></div>
					{uploadedFile && <div className="success-detail-row"><span className="detail-label">📎 Record Uploaded</span><span>{uploadedFile}</span></div>}
				</div>
				<p className="success-notice">A confirmation message has been sent to your registered mobile number/email.</p>
				<div className="success-actions">
					<button onClick={onViewAppointments} className="success-primary-btn">View My Bookings</button>
					<button onClick={onClose} className="success-close-link">Done</button>
				</div>
			</div>
		</div>
	);
};

export default AppointmentSuccess;
export { PatientMedicalJourney, PrescriptionModal };