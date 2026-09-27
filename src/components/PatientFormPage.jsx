import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PatientForm from './PatientForm';

export default function PatientFormPage() {
  return (
  <div className="flex min-h-screen flex-col bg-gradient-to-br from-medical-50 via-white to-primary-50 p-4 pt-24 ar-tight-py ar-loose-py">
      <div className="container mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link to="/" className="btn-ghost mb-4 inline-flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <div className="grid gap-6 lg:gap-8">
          <PatientForm />
        </div>
      </div>
    </div>
  );
}
