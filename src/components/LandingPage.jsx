import React, { useRef } from 'react';
// navigation handled via Link inside GlassCard
import { Stethoscope, UserPlus, FileText, Mail, Phone } from 'lucide-react';
import GlassCard from './GlassCard';
import ThemeToggle from './ThemeToggle';

const LandingPage = () => {
  // no local navigation needed

  const helplineRef = useRef(null);

  return (
  <div className="min-h-dvh bg-gradient-to-br from-white via-primary-50 to-medical-50">
      {/* Glass Header - fixed */}
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg shadow-sm">
                <Stethoscope className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">HealthCare Portal</h1>
                <p className="hidden md:block text-xs text-gray-600">Minimal, secure, and professional</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
  <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 ar-tight-py ar-loose-py" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
        {/* Hero */}
        <section className="text-center mb-14 anim-fade-in">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 anim-fade-up">
            Welcome to <span className="text-primary-600">HealthCare Portal</span>
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto anim-fade-up anim-delay-1">
            Choose an option to continue. Designed for clarity and speed in a clinical environment.
          </p>
        </section>

        
        {/* Main Actions */}
        <section className="grid gap-9 md:gap-10 max-w-3xl mx-auto ar-card-grid anim-fade-scale anim-delay-1" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'}}>
          <GlassCard
            href="/patient-form"
            icon={<FileText className="h-12 w-12 text-medical-700" />}
            title="Patient Form"
            description="Submit your medical information securely through our online form."
            buttonText="Fill Out Form"
          />
          <GlassCard
            href="/doctor-login"
            icon={<Stethoscope className="h-12 w-12 text-primary-700" />}
            title="Doctor Portal"
            description="Sign in to review pre-authorization submissions and patient details."
            buttonText="Go to Portal"
          />
        </section>

        {/* Centered Help Button below cards */}
  <div className="flex justify-center mt-8 anim-fade-up anim-delay-2">
          <button
            onClick={() => helplineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="glass-button hover-lift px-6 py-3 shadow-lg ring-1 ring-white/60"
            aria-label="Scroll to IT Helpline information"
          >
            Need Help? View IT Helpline
          </button>
        </div>

        {/* IT Helpline (below cards, pushed further down) */}
        <section className="mt-24 md:mt-32 anim-fade-scale anim-delay-3" ref={helplineRef} id="it-helpline">
          <div className="glass-card max-w-3xl mx-auto text-center">
            <h3 className="text-xl font-semibold text-gray-900">IT Helpline</h3>
            <p className="text-gray-600 mt-1 mb-4">Having trouble? Our hospital IT support can help you access or submit forms.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <div className="flex items-center justify-center">
                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                <span>+1 (555) 123-HELP</span>
              </div>
              <div className="flex items-center justify-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span>support@medicare-portal.com</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          © 2025 HealthCare Portal
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;