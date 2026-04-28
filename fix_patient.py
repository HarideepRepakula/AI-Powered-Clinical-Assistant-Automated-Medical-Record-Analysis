import re

file = r'c:\Users\DELL\OneDrive\Desktop\AI Medical Record\ClinIQ\frontend\src\pages\dashboards\Patient.jsx'

with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 2: Insert success modal before the form modal
old_modal = "{bookingDoctor && bookingStep === 'form' && ("
success_modal = """{bookingDoctor && bookingStep === 'success' && bookedInfo && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
					<div className="bg-white rounded-2xl shadow-clinical-lg w-full max-w-md p-8 text-center animate-slide-up">
						<div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg viewBox="0 0 52 52" className="w-9 h-9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"><path d="M14 27l8 8 16-16" /></svg>
						</div>
						<h2 className="text-xl font-bold text-gray-900 mb-2">Appointment Confirmed! \U0001f389</h2>
						<p className="text-sm text-gray-500 mb-5">Your appointment with <strong>{bookedInfo.doctorName}</strong> has been successfully scheduled.</p>
						<div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2.5 mb-4">
							<div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">\U0001f550 Time</span><span className="text-gray-800">{bookedInfo.time}</span></div>
							<div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">\U0001f4c5 Date</span><span className="text-gray-800">{bookedInfo.date}</span></div>
							<div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">\U0001fa7a Visit Type</span><span className="text-gray-800">{bookedInfo.visitType}</span></div>
							<div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">\U0001f4b3 Fee</span><span className="text-gray-800">\u20b9{bookingDoctor.consultationFee || 2000} <span className="text-gray-400 text-xs">(at clinic)</span></span></div>
							{bookingForm.uploadedFile && <div className="flex justify-between text-sm"><span className="text-gray-500 font-medium">\U0001f4ce Record</span><span className="text-gray-800 truncate max-w-[180px]">{bookingForm.uploadedFile.name}</span></div>}
						</div>
						<p className="text-xs text-gray-400 mb-5">A confirmation has been sent to your registered email/mobile.</p>
						<div className="flex flex-col gap-2">
							<button onClick={() => { closeBookingModal(); handleTabChange('appointments'); }} className="btn-primary w-full">View My Bookings</button>
							<button onClick={closeBookingModal} className="text-sm text-gray-400 hover:text-gray-600 underline py-1">Done</button>
						</div>
					</div>
				</div>
			)}

			"""
new_modal = success_modal + "{bookingDoctor && bookingStep === 'form' && ("
content = content.replace(old_modal, new_modal, 1)

# Fix 3: wire up real cancel
old_cancel = "onCancel={(apt) => showToast(`Cancel appointment coming soon`, 'info')}"
new_cancel = """onCancel={async (apt) => {
							const doctorName = typeof apt.doctor === 'object' ? apt.doctor.name : apt.doctor;
							if (!window.confirm(`Cancel appointment with ${doctorName} on ${apt.date} at ${apt.startTime}?\\n\\nNote: Cannot cancel within 3 hours of the appointment.`)) return;
							try {
								await apiService.cancelAppointment(apt.id, { reason: 'Cancelled by patient' });
								showToast('Appointment cancelled successfully.', 'success');
								loadAppointments();
							} catch (err) {
								showToast(err.message || 'Failed to cancel appointment', 'error');
							}
						}}"""
content = content.replace(old_cancel, new_cancel, 1)

with open(file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
