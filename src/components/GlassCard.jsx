import React from 'react';
import { Link } from 'react-router-dom';

/**
 * GlassCard
 * Props:
 * - href: string (route path)
 * - icon: React.ReactNode
 * - title: string
 * - description: string
 * - buttonText: string
 */
export default function GlassCard({ href, icon, title, description, buttonText }) {
  return (
    <div className="relative group">
      {/* Gradient glow background with tilt animation */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-medical-600 rounded-xl blur opacity-25 group-hover:opacity-80 transition duration-1000 group-hover:duration-200 animate-tilt" />

      {/* Glass card */}
      <div className="relative glass-card h-full flex flex-col items-center text-center p-8 transition-transform duration-300 group-hover:scale-[1.02]">
        <div className="mb-4">{icon}</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900">{title}</h2>
        <p className="text-gray-600 mb-6 flex-grow">{description}</p>
        <Link to={href} className="w-full">
          <div className="glass-button w-full text-center">{buttonText}</div>
        </Link>
      </div>
    </div>
  );
}
