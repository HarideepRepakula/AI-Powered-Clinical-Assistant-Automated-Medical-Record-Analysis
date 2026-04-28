import { Link } from 'react-router-dom';

export default function Home() {
	return (
		<div className="min-h-screen bg-background">
			{/* Navbar */}
			<nav className="bg-white border-b border-gray-100 px-6 lg:px-16 py-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-9 h-9 rounded-clinical bg-primary-600 flex items-center justify-center">
						<span className="text-white text-lg font-bold">C</span>
					</div>
					<span className="text-xl font-bold text-text-primary">ClinIQ <span className="text-ai-500 text-sm font-semibold">AI</span></span>
				</div>
				<div className="flex items-center gap-3">
					<Link to="/doctor/login" className="btn-ghost btn-sm">Doctor Login</Link>
					<Link to="/patient/login" className="btn-primary btn-sm">Patient Login</Link>
				</div>
			</nav>

			{/* Hero */}
			<section className="px-6 lg:px-16 py-20 lg:py-28">
				<div className="max-w-6xl mx-auto text-center">
					<div className="badge-ai mb-6 mx-auto">✨ AI-Powered Clinical Intelligence</div>
					<h1 className="text-4xl lg:text-6xl font-extrabold text-text-primary mb-6 leading-tight text-balance">
						Your Health, <br className="hidden sm:block" />
						<span className="text-primary-600">Intelligently</span> Managed
					</h1>
					<p className="text-lg lg:text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
						Connect with healthcare professionals, get AI-powered health insights,
						and manage your clinical journey — all in one platform.
					</p>

					{/* Portal Cards */}
					<div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
						{/* Doctor Portal */}
						<Link to="/doctor/login" className="group block p-8 bg-white border-2 border-primary-100 hover:border-primary-400 rounded-clinical-lg shadow-clinical hover:shadow-clinical-md transition-all text-left">
							<div className="w-14 h-14 bg-primary-50 rounded-clinical flex items-center justify-center text-3xl mb-4 group-hover:bg-primary-100 transition-colors">
								🩺
							</div>
							<h2 className="text-xl font-bold text-text-primary mb-1">Doctor Portal</h2>
							<p className="text-sm text-text-secondary mb-4">Access patient records, AI briefings, video consultations, and clinical tools.</p>
							<span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-2.5 transition-all">
								Sign in as Doctor <span>→</span>
							</span>
						</Link>

						{/* Patient Portal */}
						<Link to="/patient/login" className="group block p-8 bg-white border-2 border-success-100 hover:border-success-400 rounded-clinical-lg shadow-clinical hover:shadow-clinical-md transition-all text-left">
							<div className="w-14 h-14 bg-success-50 rounded-clinical flex items-center justify-center text-3xl mb-4 group-hover:bg-success-100 transition-colors">
								🏥
							</div>
							<h2 className="text-xl font-bold text-text-primary mb-1">Patient Portal</h2>
							<p className="text-sm text-text-secondary mb-4">Book appointments, view records, chat with AI, and manage your health journey.</p>
							<span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success-600 group-hover:gap-2.5 transition-all">
								Sign in as Patient <span>→</span>
							</span>
						</Link>
					</div>

					<p className="text-sm text-text-secondary">
						New patient?{' '}
						<Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">Create a free account →</Link>
					</p>
				</div>
			</section>

			{/* Features */}
			<section className="px-6 lg:px-16 pb-20">
				<div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
					{[
						{ icon: '🧠', title: 'AI Health Insights', desc: 'Get personalized health analysis powered by BART AI, from lab reports to drug safety checks.', badge: 'AI Assisted' },
						{ icon: '📋', title: 'Smart Records', desc: 'Upload lab reports and get instant OCR parsing with structured data visualization and trend tracking.', badge: null },
						{ icon: '💊', title: 'Pharmacy Automation', desc: 'Auto-generated medicine carts from prescriptions, with real-time order tracking and inventory matching.', badge: null },
						{ icon: '🎙️', title: 'AI Medical Scribe', desc: 'Real-time voice transcription during consultations using Web Speech API — no cost, no setup.', badge: 'AI Assisted' },
						{ icon: '🛡️', title: 'Drug Safety (CDSS)', desc: 'Clinical decision support with OpenFDA integration and Groq analysis for drug interactions.', badge: 'AI Assisted' },
						{ icon: '📊', title: 'Health Timeline', desc: 'Track lab values over time with interactive charts, color-coded flags, and trend analysis.', badge: null },
					].map((f, i) => (
						<div key={i} className={`card hover:shadow-clinical-md transition-shadow duration-300 ${f.badge ? 'border-ai-100' : ''}`}>
							<span className="text-3xl mb-4 block">{f.icon}</span>
							<div className="flex items-center gap-2 mb-2">
								<h3 className="text-lg font-bold text-text-primary">{f.title}</h3>
								{f.badge && <span className="badge-ai text-[10px]">{f.badge}</span>}
							</div>
							<p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* CTA */}
			<section className="px-6 lg:px-16 pb-20">
				<div className="max-w-4xl mx-auto bg-gradient-to-r from-primary-600 to-primary-800 rounded-clinical-lg p-10 lg:p-14 text-center text-white relative overflow-hidden">
					<div className="absolute inset-0 opacity-10">
						<div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
					</div>
					<div className="relative z-10">
						<h2 className="text-2xl lg:text-3xl font-bold mb-4">Ready to experience intelligent healthcare?</h2>
						<p className="text-primary-100 mb-8 max-w-lg mx-auto">Join ClinIQ AI and access the future of clinical intelligence — for free.</p>
						<Link to="/signup" className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-clinical font-semibold hover:bg-primary-50 transition-colors">
							Create Patient Account →
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-gray-100 px-6 lg:px-16 py-8">
				<div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-text-secondary">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-text-primary">ClinIQ AI</span>
						<span>• Clinical Intelligence Assistant</span>
					</div>
					<div className="flex items-center gap-4">
						<Link to="/doctor/login" className="hover:text-text-primary transition-colors">Doctor Portal</Link>
						<Link to="/patient/login" className="hover:text-text-primary transition-colors">Patient Portal</Link>
						<span>© 2026 ClinIQ AI</span>
					</div>
				</div>
			</footer>
		</div>
	);
}
