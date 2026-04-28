import { useState, useEffect } from "react";
import apiService from "../services/api.js";
import AppointmentSuccess from "./AppointmentSuccess.jsx";
import "./AppointmentBooking.css";

const TIME_SLOT_MAP = {
	"9:00 AM": "09:00", "9:30 AM": "09:30",
	"10:00 AM": "10:00", "10:30 AM": "10:30",
	"11:00 AM": "11:00", "11:30 AM": "11:30",
	"12:00 PM": "12:00", "12:30 PM": "12:30",
	"1:00 PM": "13:00", "1:30 PM": "13:30",
	"2:00 PM": "14:00", "2:30 PM": "14:30",
	"3:00 PM": "15:00", "3:30 PM": "15:30",
	"4:00 PM": "16:00", "4:30 PM": "16:30",
	"5:00 PM": "17:00", "5:30 PM": "17:30",
	"6:00 PM": "18:00", "6:30 PM": "18:30",
	"7:00 PM": "19:00", "7:30 PM": "19:30",
	"8:00 PM": "20:00", "8:30 PM": "20:30",
	"9:00 PM": "21:00", "9:30 PM": "21:30",
	"10:00 PM": "22:00", "10:30 PM": "22:30",
};

const AppointmentBooking = ({ doctor, onClose, onSuccess }) => {
	const [selectedDate, setSelectedDate] = useState("");
	const [selectedTime, setSelectedTime] = useState("");
	const [reason, setReason] = useState("");
	const [notes, setNotes] = useState("");
	const [showSuccess, setShowSuccess] = useState(false);
	const [appointmentDetails, setAppointmentDetails] = useState(null);
	const [bookedSlots, setBookedSlots] = useState([]);

	const timeSlots = Object.keys(TIME_SLOT_MAP);

	useEffect(() => {
		if (!selectedDate || !doctor?.id) return;
		apiService.getDoctorAvailability(doctor.id, selectedDate)
			.then(res => setBookedSlots(res?.data?.bookedSlots || []))
			.catch(() => setBookedSlots([]));
		setSelectedTime("");
	}, [selectedDate, doctor?.id]);

	const isSlotBooked = (displayTime) => {
		const slotStart = TIME_SLOT_MAP[displayTime];
		return bookedSlots.some(b => b.startTime === slotStart);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const startTime = TIME_SLOT_MAP[selectedTime];
			const appointmentData = {
				doctorId: doctor.id,
				appointmentDate: selectedDate,
				startTime,
				reason,
				notes
			};
			const token = localStorage.getItem('token');
			if (token !== 'mock-token') {
				await apiService.bookAppointment(appointmentData);
			}
			setAppointmentDetails({ date: selectedDate, time: selectedTime, doctorName: doctor.name, specialty: doctor.specialty, fee: doctor.consultationFee, reason });
			setShowSuccess(true);
			if (onSuccess) onSuccess();
		} catch (error) {
			console.error('Booking error:', error);
			alert('Failed to book appointment: ' + error.message);
		}
	};

	const handleViewAppointments = () => {
		setShowSuccess(false);
		onClose('appointments');
	};

	const handleBackToDashboard = () => {
		setShowSuccess(false);
		onClose();
	};

	if (showSuccess) {
		return (
			<AppointmentSuccess
				appointmentDetails={appointmentDetails}
				onViewAppointments={handleViewAppointments}
				onClose={handleBackToDashboard}
			/>
		);
	}

	return (
		<div className="booking-modal-overlay">
			<div className="booking-modal">
				<div className="booking-header">
					<h2 className="booking-title">Book Appointment</h2>
					<button onClick={onClose} className="close-btn">
						×
					</button>
				</div>

				<div className="doctor-info-panel">
					<h3 className="doctor-name">{doctor.name}</h3>
					<p className="doctor-specialty">{doctor.specialty}</p>
					<p className="doctor-experience">{doctor.experience}</p>
				</div>

				<form onSubmit={handleSubmit} className="booking-form">
					<div className="form-group">
						<label className="form-label">Select Date</label>
						<input
							type="date"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							min={new Date().toISOString().split('T')[0]}
							className="date-input"
							required
						/>
					</div>

					<div className="form-group">
						<label className="form-label">Select Time</label>
						<div className="time-slots-grid">
							{timeSlots.map(time => {
								const booked = isSlotBooked(time);
								return (
									<button
										key={time}
										type="button"
										onClick={() => !booked && setSelectedTime(time)}
										disabled={booked}
										className={`time-slot ${selectedTime === time ? 'selected' : ''} ${booked ? 'booked' : ''}`}
										title={booked ? 'Already booked' : ''}
									>
										{time}
									</button>
								);
							})}
						</div>
					</div>

					<div className="form-group">
						<label className="form-label">Reason for Visit</label>
						<select
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							className="reason-select"
							required
						>
							<option value="">Select a reason</option>
							<option value="consultation">General Consultation</option>
							<option value="follow-up">Follow-up Visit</option>
							<option value="checkup">Regular Checkup</option>
							<option value="emergency">Emergency</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div className="form-group">
						<label className="form-label">Additional Notes (Optional)</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							className="notes-textarea"
							placeholder="Any additional information you'd like to share..."
						/>
					</div>

					<div className="booking-actions">
						<button type="button" onClick={onClose} className="cancel-btn">
							Cancel
						</button>
						<button
							type="submit"
							disabled={!selectedDate || !selectedTime || !reason}
							className="book-btn"
						>
							Book Appointment
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AppointmentBooking;
