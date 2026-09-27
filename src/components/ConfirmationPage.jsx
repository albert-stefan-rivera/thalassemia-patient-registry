import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { CheckCircle, Download, Home, FileText } from 'lucide-react';

const ConfirmationPage = () => {
  const location = useLocation();
  const { id } = useParams();
  const { patientId: navPatientId } = location.state || {};
  const [record, setRecord] = useState(null);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('patients') || '[]');
    const found = all.find(p => p.patientId === (navPatientId || id));
    setRecord(found || null);
  }, [navPatientId, id]);

  const handleDownloadPDF = () => {
    if (!record) return;

    // Create formatted text content for PDF
    const content = `
PATIENT INFORMATION REVIEW
Patient ID: ${record.patientId}
Submitted: ${record.submittedAt || new Date().toISOString()}

═══════════════════════════════════════════════════════════════

PERSONAL INFORMATION
────────────────────────────────────────────────────────────────
Full Name: ${record.personalInfo?.name || 'N/A'}
Age: ${record.personalInfo?.age || 'N/A'}
Gender: ${record.personalInfo?.gender || 'N/A'}
Date of Birth: ${record.dob || 'N/A'}

CONTACT INFORMATION
────────────────────────────────────────────────────────────────
Email: ${record.contactInfo?.email || 'N/A'}
Phone Number: ${record.contactInfo?.phoneNumber || 'N/A'}
Member Address: ${record.memberAddress || 'N/A'}

INSURANCE INFORMATION
────────────────────────────────────────────────────────────────
Health Plan: ${record.healthPlan || 'N/A'}
Health Plan Fax: ${record.healthPlanFax || 'N/A'}
Health Insurance ID: ${record.healthInsuranceId || 'N/A'}
Other Insurance: ${record.otherInsurance || 'N/A'}
Patient Account Number: ${record.patientAccountNumber || 'N/A'}

SERVICE TYPES REQUESTED
────────────────────────────────────────────────────────────────
${record.serviceTypes && record.serviceTypes.length > 0 
  ? record.serviceTypes.join(', ') 
  : 'None selected'}
${record.otherServiceType ? `Other Service: ${record.otherServiceType}` : ''}

REQUESTING PROVIDER INFORMATION
────────────────────────────────────────────────────────────────
Name & NPI: ${record.requestingProviderNameNPI || 'N/A'}
Phone: ${record.requestingProviderPhone || 'N/A'}
Fax: ${record.requestingProviderFax || 'N/A'}

SERVICING PROVIDER INFORMATION
────────────────────────────────────────────────────────────────
Same as Requesting Provider: ${record.sameAsRequestingProvider ? 'Yes' : 'No'}
Name & NPI/Tax ID: ${record.servicingProviderNameNPITaxId || 'N/A'}
Phone: ${record.servicingProviderPhone || 'N/A'}
Fax: ${record.servicingProviderFax || 'N/A'}

SERVICING FACILITY INFORMATION
────────────────────────────────────────────────────────────────
Same as Requesting Facility: ${record.sameAsRequestingFacility ? 'Yes' : 'No'}
Name & NPI: ${record.servicingFacilityNameNPI || 'N/A'}
Phone: ${record.servicingFacilityPhone || 'N/A'}
Fax: ${record.servicingFacilityFax || 'N/A'}
Contact Person: ${record.contactPerson || 'N/A'}

DIAGNOSIS INFORMATION
────────────────────────────────────────────────────────────────
Principal Diagnosis:
  Description: ${record.principalDiagnosisDescription || 'N/A'}
  ICD-10 Code: ${record.principalDiagnosisICD10 || 'N/A'}

Secondary Diagnosis:
  Description: ${record.secondaryDiagnosisDescription || 'N/A'}
  ICD-10 Code: ${record.secondaryDiagnosisICD10 || 'N/A'}

PLANNED PROCEDURES
────────────────────────────────────────────────────────────────
Principal Procedure:
  Description & CPT: ${record.principalPlannedProcedureDescriptionCPT || 'N/A'}
  Units: ${record.principalUnitsNumber || 'N/A'} ${record.principalUnitsType || ''}

Secondary Procedure:
  Description & CPT: ${record.secondaryPlannedProcedureDescriptionCPT || 'N/A'}
  Units: ${record.secondaryUnitsNumber || 'N/A'} ${record.secondaryUnitsType || ''}

SERVICE INFORMATION
────────────────────────────────────────────────────────────────
Service Start Date: ${record.serviceStartDate || 'N/A'}

MEDICAL HISTORY
────────────────────────────────────────────────────────────────
${record.medicalHistory || 'N/A'}

EMERGENCY CONTACT
────────────────────────────────────────────────────────────────
Name: ${record.emergencyContact?.name || 'N/A'}
Relationship: ${record.emergencyContact?.relationship || 'N/A'}
Phone: ${record.emergencyContact?.phoneNumber || 'N/A'}

═══════════════════════════════════════════════════════════════
End of Patient Information Review
Generated: ${new Date().toLocaleString()}
`;

    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patient_${record.patientId}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-primary-50 flex items-center justify-center py-12 px-4">
        <div className="glass-card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Data Found</h2>
          <p className="text-gray-600 mb-6">Please submit the patient form first.</p>
          <Link to="/patient-form" className="btn-secondary">Go to Patient Form</Link>
        </div>
      </div>
    );
  }

  const renderField = (label, value) => (
    <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-200">
      <span className="text-gray-600 font-medium mb-1 sm:mb-0">{label}:</span>
      <span className="text-gray-900 sm:text-right break-words">{value || 'N/A'}</span>
    </div>
  );

  const renderSection = (title, children) => (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <FileText className="h-5 w-5 mr-2 text-primary-600" />
        {title}
      </h3>
      <div className="bg-gray-50 rounded-lg p-6">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-primary-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Success Header */}
        <div className="glass-card text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 mb-4">
            <CheckCircle className="h-10 w-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Patient Form Review</h1>
          <p className="text-gray-600 mt-2">Please review all submitted information</p>
          <p className="text-gray-500 text-sm mt-2">
            Patient ID: <span className="font-semibold text-primary-600">{record.patientId}</span>
          </p>
        </div>

        {/* Review Content */}
        <div className="glass-card">
          {/* Personal Information */}
          {renderSection('Personal Information', (
            <>
              {renderField('Full Name', record.personalInfo?.name)}
              {renderField('Age', record.personalInfo?.age)}
              {renderField('Gender', record.personalInfo?.gender)}
              {renderField('Date of Birth', record.dob)}
            </>
          ))}

          {/* Contact Information */}
          {renderSection('Contact Information', (
            <>
              {renderField('Email', record.contactInfo?.email)}
              {renderField('Phone Number', record.contactInfo?.phoneNumber)}
              {renderField('Member Address', record.memberAddress)}
            </>
          ))}

          {/* Insurance Information */}
          {renderSection('Insurance Information', (
            <>
              {renderField('Health Plan', record.healthPlan)}
              {renderField('Health Plan Fax', record.healthPlanFax)}
              {renderField('Health Insurance ID', record.healthInsuranceId)}
              {renderField('Other Insurance', record.otherInsurance)}
              {renderField('Patient Account Number', record.patientAccountNumber)}
            </>
          ))}

          {/* Service Types */}
          {renderSection('Service Types Requested', (
            <>
              {renderField('Selected Services', 
                record.serviceTypes && record.serviceTypes.length > 0 
                  ? record.serviceTypes.join(', ') 
                  : 'None'
              )}
              {record.otherServiceType && renderField('Other Service Type', record.otherServiceType)}
            </>
          ))}

          {/* Requesting Provider */}
          {renderSection('Requesting Provider', (
            <>
              {renderField('Name & NPI', record.requestingProviderNameNPI)}
              {renderField('Phone', record.requestingProviderPhone)}
              {renderField('Fax', record.requestingProviderFax)}
            </>
          ))}

          {/* Servicing Provider */}
          {renderSection('Servicing Provider', (
            <>
              {renderField('Same as Requesting Provider', record.sameAsRequestingProvider ? 'Yes' : 'No')}
              {renderField('Name & NPI/Tax ID', record.servicingProviderNameNPITaxId)}
              {renderField('Phone', record.servicingProviderPhone)}
              {renderField('Fax', record.servicingProviderFax)}
            </>
          ))}

          {/* Servicing Facility */}
          {renderSection('Servicing Facility', (
            <>
              {renderField('Same as Requesting Facility', record.sameAsRequestingFacility ? 'Yes' : 'No')}
              {renderField('Name & NPI', record.servicingFacilityNameNPI)}
              {renderField('Phone', record.servicingFacilityPhone)}
              {renderField('Fax', record.servicingFacilityFax)}
              {renderField('Contact Person', record.contactPerson)}
            </>
          ))}

          {/* Diagnosis Information */}
          {renderSection('Diagnosis Information', (
            <>
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Principal Diagnosis</h4>
                {renderField('Description', record.principalDiagnosisDescription)}
                {renderField('ICD-10 Code', record.principalDiagnosisICD10)}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Secondary Diagnosis</h4>
                {renderField('Description', record.secondaryDiagnosisDescription)}
                {renderField('ICD-10 Code', record.secondaryDiagnosisICD10)}
              </div>
            </>
          ))}

          {/* Planned Procedures */}
          {renderSection('Planned Procedures', (
            <>
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Principal Procedure</h4>
                {renderField('Description & CPT', record.principalPlannedProcedureDescriptionCPT)}
                {renderField('Number of Units', record.principalUnitsNumber)}
                {renderField('Unit Type', record.principalUnitsType)}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Secondary Procedure</h4>
                {renderField('Description & CPT', record.secondaryPlannedProcedureDescriptionCPT)}
                {renderField('Number of Units', record.secondaryUnitsNumber)}
                {renderField('Unit Type', record.secondaryUnitsType)}
              </div>
            </>
          ))}

          {/* Service Information */}
          {renderSection('Service Information', (
            <>
              {renderField('Service Start Date', record.serviceStartDate)}
            </>
          ))}

          {/* Medical History */}
          {renderSection('Medical History', (
            <div className="py-3">
              <p className="text-gray-900 whitespace-pre-wrap">{record.medicalHistory || 'N/A'}</p>
            </div>
          ))}

          {/* Emergency Contact */}
          {renderSection('Emergency Contact', (
            <>
              {renderField('Name', record.emergencyContact?.name)}
              {renderField('Relationship', record.emergencyContact?.relationship)}
              {renderField('Phone', record.emergencyContact?.phoneNumber)}
            </>
          ))}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={handleDownloadPDF}
              className="glass-button flex items-center justify-center gap-2 px-8 py-3 text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold transition-colors"
            >
              <Download className="h-5 w-5" />
              Download PDF
            </button>
            <Link
              to="/"
              className="glass-button flex items-center justify-center gap-2 px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
            >
              <Home className="h-5 w-5" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;