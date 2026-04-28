import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout.jsx';
import apiService from '../../services/api.js';
import authService from '../../services/authService.js';

export default function PatientLogin() {
	const [form, setForm]       = useState({ email: '', password: '' });
	const [error, setError]     = useState('');
	const [loading, setLoading] = useState(false);
	const navigate              = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const res = await apiService.login({ identifier: form.email, password: form.password });
			if (res.accessToken) authService.setAccessToken(res.accessToken);
			const role = res.user?.role;
			if (role !== 'PATIENT') {
				authService.logout();
				setError('This portal is for patients only. Please use the Doctor Portal.');
				return;
			}
			navigate('/patient');
		} catch (err) {
			const msg = err.message || 'Login failed';
			setError(msg.includes('fetch') ? '❌ Cannot connect to server. Make sure the backend is running.' : msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthLayout title="Patient Portal" subtitle="Sign in to your ClinIQ Patient account">
			<div className="flex items-center gap-3 mb-6 p-3 bg-success-50 border border-success-100 rounded-clinical">
				<span className="text-2xl">🏥</span>
				<div>
					<p className="text-sm font-semibold text-success-700">Patient Portal</p>
					<p className="text-xs text-success-500">Manage your health, appointments & records</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-5 max-w-sm">
				{error && (
					<div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-clinical text-sm">
						{error}
					</div>
				)}

				<div>
					<label className="block text-sm font-medium text-text-primary mb-1.5">Email Address</label>
					<input
						type="email"
						value={form.email}
						onChange={e => setForm({ ...form, email: e.target.value })}
						className="input"
						placeholder="you@example.com"
						required
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
					<input
						type="password"
						value={form.password}
						onChange={e => setForm({ ...form, password: e.target.value })}
						className="input"
						placeholder="••••••••"
						required
					/>
				</div>

				<button type="submit" disabled={loading} className="btn-primary w-full">
					{loading ? (
						<span className="flex items-center justify-center gap-2">
							<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
							Signing in...
						</span>
					) : '🏥 Sign In as Patient'}
				</button>

				<p className="text-sm text-text-secondary text-center">
					Don't have an account?{' '}
					<Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">Create Account</Link>
				</p>
				<p className="text-sm text-text-secondary text-center">
					Are you a doctor?{' '}
					<Link to="/doctor/login" className="font-semibold text-primary-600 hover:text-primary-700">Doctor Portal →</Link>
				</p>
			</form>
		</AuthLayout>
	);
}
