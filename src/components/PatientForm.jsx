import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { generatePatientId } from '../utils/patientId';
import { createAuditLog } from '../utils/auditLogger';
import { 
  User, Phone, MapPin, Calendar, 
  Activity, FileText, Heart, 
  AlertCircle, Save, Send, ArrowLeft 
} from 'lucide-react';

const PatientForm = ({ existingPatientId, isEditMode = false }) => {
  const { currentUser, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [activeTab, setActiveTab] = useState('baseline'); // 'baseline' | 'outpatient'
  const [formData, setFormData] = useState({
    // Patient ID (auto-generated, read-only in most cases)
    patientId: generatePatientId(),
    
    // === SECTION 1: DEMOGRAPHICS ===
    // Required fields marked with *
    lastName: '',
    firstName: '',
    middleName: '',
    dateOfBirth: '',
    age: 0,
    sex: '',
    ethnicity: '',
    nationality: 'Filipino',
    civilStatus: '',
    occupation: '',
    
    // Contact Information
    address: '',
    city: '',
    province: '',
    region: '',
    phoneNumber: '',
    alternatePhone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    
    // === SECTION 2: DIAGNOSIS INFORMATION ===
    thalassemiaType: '', // 'Major', 'Intermedia', 'Minor', 'HbE Disease', 'HbH Disease', 'Other'
    dateOfDiagnosis: '',
    ageAtDiagnosis: 0,
    diagnosingPhysician: '',
    diagnosingHospital: '',
    initialHemoglobin: '',
    initialHbF: '',
    initialHbA2: '',
    
    // Family History
    familyHistory: {
      hasThalassemiaCase: false,
      affectedSiblings: 0,
      affectedParents: 0,
      affectedRelatives: false,
      consanguineousParents: false,
      notes: ''
    },
    
    // === SECTION 3: BASELINE CLINICAL DATA ===
    // Transfusion History
    transfusionHistory: {
      firstTransfusionAge: '',
      transfusionFrequency: '', // 'monthly', 'bi-monthly', 'quarterly', 'irregular', 'none'
      unitsPerTransfusion: '',
      lastTransfusionDate: '',
      transfusionReactions: [],
      transfusionReactionNotes: ''
    },
    
    // Chelation Therapy
    chelationTherapy: {
      onChelation: false,
      chelationDrug: '', // 'Deferoxamine', 'Deferasirox', 'Deferiprone', 'Combination', 'None'
      startDate: '',
      dosage: '',
      compliance: '', // 'good', 'fair', 'poor'
      sideEffects: [],
      sideEffectNotes: ''
    },
    
    // Baseline Lab Results
    baselineLabs: {
      hemoglobin: '',
      hematocrit: '',
      mcv: '',
      mch: '',
      mchc: '',
      rbcCount: '',
      reticulocyteCount: '',
      bilirubinTotal: '',
      bilirubinDirect: '',
      ldh: '',
      ferritin: '',
      serumIron: '',
      tibc: '',
      transferrinSaturation: '',
      hbf: '',
      hba2: '',
      hbe: '',
      hba1c: '',
      liverFunctionTests: {
        alt: '',
        ast: '',
        ggt: '',
        albumin: ''
      },
      renalFunctionTests: {
        creatinine: '',
        bun: '',
        egfr: '',
        uricAcid: ''
      },
      thyroidFunctionTests: {
        tsh: '',
        freeT4: ''
      },
      cardiacAssessment: {
        lvef: '',
        ferritinCorrelation: '',
        notes: ''
      },
      boneDensity: {
        zScore: '',
        spine: '',
        hip: ''
      }
    },
    
    // === SECTION 4: OUTPATIENT VISIT DATA ===
    outpatientVisits: [{
      visitDate: '',
      visitType: '', // 'regular', 'emergency', 'transfusion', 'follow-up'
      chiefComplaint: '',
      weight: '',
      height: '',
      bmi: '',
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      temperature: '',
      currentHemoglobin: '',
      hematocrit: '',
      plateletCount: '',
      wbcCount: '',
      ferritin: '',
      transfusionGiven: false,
      transfusionUnits: '',
      chelationChanges: '',
      newMedications: [],
      discontinuedMedications: [],
      complications: [],
      referralGiven: false,
      referralReason: '',
      nextAppointment: '',
      notes: ''
    }],
    
    // === SECTION 5: CONSENT AND DOCUMENTATION ===
    consent: {
      informedConsentSigned: false,
      consentDate: '',
      consentSigner: '', // 'patient', 'guardian', 'caregiver'
      consentSignerName: '',
      consentSignerRelation: '',
      dataPrivacyConsent: false,
      researchParticipationConsent: false,
      photoConsent: false,
      notes: ''
    },
    
    // === SECTION 6: SYSTEM FIELDS ===
    mainDoctorId: '',
    mainDoctorName: '',
    authorizedViewers: [], // Array of doctor IDs
    status: 'active', // 'active', 'inactive', 'deceased', 'lost-to-follow-up'
    registrationDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    lastUpdatedBy: '',
    isComplete: false,
    completionDate: null
  });
  
  const [errors, setErrors] = useState({});
  const [isComplete, setIsComplete] = useState(false);

  // Load existing patient data if editing
  useEffect(() => {
    const loadPatientData = async () => {
      if (isEditMode && existingPatientId) {
        try {
          const patientDoc = await getDoc(doc(db, 'patients', existingPatientId));
          if (patientDoc.exists()) {
            setFormData(prev => ({
              ...prev,
              ...patientDoc.data(),
              patientId: existingPatientId
            }));
          }
        } catch (error) {
          console.error('Error loading patient:', error);
        }
      } else if (currentUser) {
        // Set main doctor info for new patients
        setFormData(prev => ({
          ...prev,
          mainDoctorId: currentUser.uid,
          mainDoctorName: currentUser.displayName || currentUser.email
        }));
      }
    };
    
    loadPatientData();
  }, [isEditMode, existingPatientId, currentUser]);

  // Calculate age from date of birth
  useEffect(() => {
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age }));
    }
  }, [formData.dateOfBirth]);

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: currentUser?.uid
    }));
    
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleNestedChange = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        },
        lastUpdated: new Date().toISOString()
      }
    }));
  };

  const validateForm = (checkCompleteness = false) => {
    const newErrors = {};
    
    // Required fields for baseline registration
    const requiredFields = [
      'lastName', 'firstName', 'dateOfBirth', 'sex',
      'address', 'phoneNumber',
      'thalassemiaType', 'dateOfDiagnosis'
    ];
    
    if (checkCompleteness) {
      requiredFields.push('emergencyContactName', 'emergencyContactPhone');
    }
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    // Validate consent
    if (checkCompleteness && !formData.consent.informedConsentSigned) {
      newErrors['consent.informedConsentSigned'] = 'Informed consent is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const patientRef = existingPatientId 
        ? doc(db, 'patients', existingPatientId)
        : doc(collection(db, 'patients'));
      
      const patientId = existingPatientId || patientRef.id;
      
      if (existingPatientId) {
        await updateDoc(patientRef, {
          ...formData,
          status: formData.status || 'draft'
        });
      } else {
        await setDoc(patientRef, {
          ...formData,
          patientId,
          status: 'draft',
          registrationDate: new Date().toISOString()
        });
      }
      
      await createAuditLog({
        action: existingPatientId ? 'update' : 'create',
        patientId,
        collectionName: 'patients',
        metadata: { description: 'Draft saved' }
      });
      
      navigate(`/patient/${patientId}`);
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Error saving draft. Please try again.');
    }
    setSavingDraft(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const isCompleteCheck = validateForm(true);
      
      const patientRef = existingPatientId 
        ? doc(db, 'patients', existingPatientId)
        : doc(collection(db, 'patients'));
      
      const patientId = existingPatientId || patientRef.id;
      
      const patientData = {
        ...formData,
        patientId,
        status: 'active',
        isComplete: isCompleteCheck,
        completionDate: isCompleteCheck ? new Date().toISOString() : null,
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: currentUser?.uid
      };
      
      if (existingPatientId) {
        await updateDoc(patientRef, patientData);
        await createAuditLog({
          action: 'update',
          patientId,
          collectionName: 'patients',
          newData: patientData,
          metadata: { description: 'Patient record finalized' }
        });
      } else {
        await setDoc(patientRef, patientData);
        await createAuditLog({
          action: 'create',
          patientId,
          collectionName: 'patients',
          newData: patientData,
          metadata: { description: 'New patient registered' }
        });
      }
      
      navigate(`/patient/${patientId}`);
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Error saving patient. Please try again.');
    }
    setLoading(false);
  };

  const renderField = (label, name, type = 'text', required = false, options = null) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select
          value={formData[name] || ''}
          onChange={(e) => handleChange(name, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select {label}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={formData[name] || ''}
          onChange={(e) => handleChange(name, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )}
      {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Patient Record' : 'New Patient Registration'}
        </h1>
        <p className="text-gray-600">Patient ID: {formData.patientId}</p>
      </div>

      {/* Progress Tabs */}
      <div className="flex border-b mb-6">
        {['baseline', 'outpatient', 'consent'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize ${
              activeTab === tab 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'baseline' ? 'Baseline CRF' : tab} Form
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* BASELINE FORM */}
        {activeTab === 'baseline' && (
          <div className="space-y-8">
            {/* Section 1: Demographics */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-500" />
                Demographics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Last Name *', 'lastName', 'text', true)}
                {renderField('First Name *', 'firstName', 'text', true)}
                {renderField('Middle Name', 'middleName')}
                {renderField('Date of Birth *', 'dateOfBirth', 'date', true)}
                {renderField('Sex *', 'sex', 'select', true, [
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' }
                ])}
                {renderField('Age', 'age', 'number', false, null, true)}
                {renderField('Ethnicity', 'ethnicity')}
                {renderField('Nationality', 'nationality')}
                {renderField('Civil Status', 'civilStatus', 'select', false, [
                  { value: 'single', label: 'Single' },
                  { value: 'married', label: 'Married' },
                  { value: 'widowed', label: 'Widowed' },
                  { value: 'divorced', label: 'Divorced' },
                  { value: 'separated', label: 'Separated' }
                ])}
              </div>
              
              <h3 className="text-lg font-medium mt-6 mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Address *', 'address', 'text', true)}
                {renderField('City/Municipality', 'city')}
                {renderField('Province', 'province')}
                {renderField('Region', 'region')}
                {renderField('Phone Number *', 'phoneNumber', 'tel', true)}
                {renderField('Alternate Phone', 'alternatePhone', 'tel')}
                {renderField('Email', 'email', 'email')}
              </div>
              
              <h3 className="text-lg font-medium mt-6 mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Emergency Contact Name', 'emergencyContactName')}
                {renderField('Relationship', 'emergencyContactRelation')}
                {renderField('Emergency Contact Phone', 'emergencyContactPhone', 'tel')}
              </div>
            </section>

            {/* Section 2: Diagnosis */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-red-500" />
                Diagnosis Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Thalassemia Type *', 'thalassemiaType', 'select', true, [
                  { value: 'major', label: 'Thalassemia Major' },
                  { value: 'intermedia', label: 'Thalassemia Intermedia' },
                  { value: 'minor', label: 'Thalassemia Minor/Carrier' },
                  { value: 'hbe', label: 'HbE Disease' },
                  { value: 'hbh', label: 'HbH Disease' },
                  { value: 'other', label: 'Other' }
                ])}
                {renderField('Date of Diagnosis *', 'dateOfDiagnosis', 'date', true)}
                {renderField('Diagnosing Physician', 'diagnosingPhysician')}
                {renderField('Diagnosing Hospital', 'diagnosingHospital')}
                {renderField('Initial Hemoglobin (g/dL)', 'initialHemoglobin')}
                {renderField('Initial HbF (%)', 'initialHbF')}
                {renderField('Initial HbA2 (%)', 'initialHbA2')}
              </div>
            </section>

            {/* Section 3: Clinical Data */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-pink-500" />
                Clinical Data
              </h2>
              
              <h3 className="text-lg font-medium mt-4 mb-3">Transfusion History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('First Transfusion Age', 'firstTransfusionAge')}
                {renderField('Transfusion Frequency', 'transfusionFrequency', 'select', false, [
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'bi-monthly', label: 'Bi-monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'irregular', label: 'Irregular' },
                  { value: 'none', label: 'No Transfusions' }
                ])}
                {renderField('Units per Transfusion', 'unitsPerTransfusion')}
                {renderField('Last Transfusion Date', 'lastTransfusionDate', 'date')}
              </div>
              
              <h3 className="text-lg font-medium mt-6 mb-3">Chelation Therapy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Currently on Chelation', 'onChelation', 'select', false, [
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' }
                ])}
                {renderField('Chelation Drug', 'chelationDrug', 'select', false, [
                  { value: 'deferoxamine', label: 'Deferoxamine (Desferal)' },
                  { value: 'deferasirox', label: 'Deferasirox (Exjade, Jadenu)' },
                  { value: 'deferiprone', label: 'Deferiprone' },
                  { value: 'combination', label: 'Combination' },
                  { value: 'none', label: 'None' }
                ])}
              </div>
              
              <h3 className="text-lg font-medium mt-6 mb-3">Baseline Lab Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {renderField('Hemoglobin (g/dL)', 'hemoglobin')}
                {renderField('Ferritin (ng/mL)', 'ferritin')}
                {renderField('HbF (%)', 'hbf')}
                {renderField('HbA2 (%)', 'hba2')}
              </div>
            </section>
          </div>
        )}

        {/* OUTPATIENT FORM */}
        {activeTab === 'outpatient' && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-500" />
              Outpatient Visit Record
            </h2>
            <p className="text-gray-600 mb-6">
              Complete this section for each outpatient visit. For baseline registration, 
              you can skip or enter initial values.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('Visit Date', 'visitDate', 'date')}
              {renderField('Visit Type', 'visitType', 'select', false, [
                { value: 'regular', label: 'Regular Visit' },
                { value: 'transfusion', label: 'Transfusion Visit' },
                { value: 'emergency', label: 'Emergency' },
                { value: 'follow-up', label: 'Follow-up' }
              ])}
              {renderField('Chief Complaint', 'chiefComplaint')}
              {renderField('Weight (kg)', 'weight')}
              {renderField('Height (cm)', 'height')}
              {renderField('Current Hemoglobin (g/dL)', 'currentHemoglobin')}
              {renderField('Current Ferritin (ng/mL)', 'ferritin')}
              {renderField('Next Appointment', 'nextAppointment', 'date')}
            </div>
          </section>
        )}

        {/* CONSENT FORM */}
        {activeTab === 'consent' && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
              Consent & Documentation
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start p-4 bg-yellow-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.consent.informedConsentSigned}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    consent: { ...prev.consent, informedConsentSigned: e.target.checked }
                  }))}
                  className="mt-1 mr-3"
                />
                <div>
                  <label className="font-medium">Informed Consent Signed *</label>
                  <p className="text-sm text-gray-600">
                    Patient/Guardian has signed the informed consent form for treatment and data collection.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start p-4 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.consent.dataPrivacyConsent}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    consent: { ...prev.consent, dataPrivacyConsent: e.target.checked }
                  }))}
                  className="mt-1 mr-3"
                />
                <div>
                  <label className="font-medium">Data Privacy Consent</label>
                  <p className="text-sm text-gray-600">
                    Patient/Guardian consents to data processing under Philippine Data Privacy Act.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {renderField('Consent Signer', 'consentSigner', 'select', false, [
                  { value: 'patient', label: 'Patient' },
                  { value: 'guardian', label: 'Legal Guardian' },
                  { value: 'caregiver', label: 'Caregiver' }
                ])}
                {renderField('Consent Signer Name', 'consentSignerName')}
              </div>
            </div>
          </section>
        )}

        {/* Form Actions */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingDraft ? 'Saving...' : 'Save Draft'}
          </button>
          
          <div className="space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab(
                activeTab === 'baseline' ? 'consent' : 
                activeTab === 'consent' ? 'baseline' : 'baseline'
              )}
              className="px-6 py-2 text-gray-600 hover:text-gray-900"
            >
              Previous
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab(
                activeTab === 'baseline' ? 'outpatient' : 
                activeTab === 'outpatient' ? 'consent' : 'baseline'
              )}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Next
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
