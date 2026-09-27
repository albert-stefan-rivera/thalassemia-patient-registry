import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { createAuditLog, getPatientAuditLogs } from '../utils/auditLogger';
import { 
  ArrowLeft, Edit, User, Phone, MapPin, 
  Activity, Heart, Calendar, FileText, 
  Shield, History, Share2, AlertTriangle,
  Check, X
} from 'lucide-react';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, hasPermission } = useAuth();
  const [patient, setPatient] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDoctorId, setShareDoctorId] = useState('');

  // Check if user has access to this patient
  const hasAccess = () => {
    if (!patient || !currentUser) return false;
    
    // Main doctor always has access
    if (patient.mainDoctorId === currentUser.uid) return true;
    
    // Admin always has access
    if (userProfile?.role === 'admin') return true;
    
    // Check authorized viewers
    if (patient.authorizedViewers?.includes(currentUser.uid)) return true;
    
    return false;
  };

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const patientDoc = await getDoc(doc(db, 'patients', id));
        
        if (!patientDoc.exists()) {
          alert('Patient not found');
          navigate('/dashboard');
          return;
        }
        
        const patientData = { id: patientDoc.id, ...patientDoc.data() };
        setPatient(patientData);
        
        // Fetch audit logs for this patient
        const logs = await getPatientAuditLogs(id);
        setAuditLogs(logs);
        
        // Log the view action
        await createAuditLog({
          action: 'view',
          patientId: id,
          collectionName: 'patients',
          metadata: { description: 'Patient record viewed' }
        });
      } catch (error) {
        console.error('Error fetching patient:', error);
      }
      setLoading(false);
    };
    
    fetchPatient();
  }, [id, navigate]);

  const handleShareAccess = async () => {
    if (!shareDoctorId.trim()) return;
    
    try {
      const patientRef = doc(db, 'patients', id);
      await updateDoc(patientRef, {
        authorizedViewers: arrayUnion(shareDoctorId)
      });
      
      await createAuditLog({
        action: 'update',
        patientId: id,
        collectionName: 'patients',
        metadata: { 
          description: 'Access shared',
          sharedWith: shareDoctorId
        }
      });
      
      setPatient(prev => ({
        ...prev,
        authorizedViewers: [...(prev.authorizedViewers || []), shareDoctorId]
      }));
      
      setShareDoctorId('');
      setShowShareModal(false);
      alert('Access shared successfully');
    } catch (error) {
      console.error('Error sharing access:', error);
      alert('Error sharing access');
    }
  };

  const handleRevokeAccess = async (doctorId) => {
    if (!confirm('Revoke access for this doctor?')) return;
    
    try {
      const patientRef = doc(db, 'patients', id);
      await updateDoc(patientRef, {
        authorizedViewers: arrayRemove(doctorId)
      });
      
      setPatient(prev => ({
        ...prev,
        authorizedViewers: prev.authorizedViewers.filter(id => id !== doctorId)
      }));
      
      alert('Access revoked');
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Patient not found</p>
      </div>
    );
  }

  // Check access (you might want to show limited view instead of blocking)
  const canEdit = hasAccess() || userProfile?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        
        <div className="flex space-x-4">
          {canEdit && (
            <Link
              to={`/patients/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          )}
          {patient.mainDoctorId === currentUser?.uid && (
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Access
            </button>
          )}
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.lastName}, {patient.firstName} {patient.middleName}
              </h1>
              <p className="text-gray-500">Patient ID: {patient.patientId}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium
              ${patient.status === 'active' ? 'bg-green-100 text-green-800' : 
                patient.status === 'critical' ? 'bg-red-100 text-red-800' : 
                'bg-gray-100 text-gray-800'}`}>
              {patient.status}
            </span>
          </div>
        </div>
        
        {/* Access Info */}
        <div className="px-6 py-3 bg-gray-50 border-b flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2" />
          <span>Main Doctor: {patient.mainDoctorName || 'Not assigned'}</span>
          {patient.authorizedViewers?.length > 0 && (
            <span className="ml-4">
              Shared with {patient.authorizedViewers.length} other doctor(s)
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        {['overview', 'diagnosis', 'visits', 'audit'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize ${
              activeTab === tab 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'audit' ? 'History' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-500" />
              Demographics
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Age/Sex</dt>
                <dd className="font-medium">{patient.age} / {patient.sex}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Date of Birth</dt>
                <dd className="font-medium">{patient.dateOfBirth}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Phone</dt>
                <dd className="font-medium">{patient.phoneNumber}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Address</dt>
                <dd className="font-medium">{patient.address}, {patient.city}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-red-500" />
              Diagnosis
            </h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Thalassemia Type</dt>
                <dd className="font-medium capitalize">{patient.thalassemiaType}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Diagnosis Date</dt>
                <dd className="font-medium">{patient.dateOfDiagnosis}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Initial Hb</dt>
                <dd className="font-medium">{patient.initialHemoglobin || 'N/A'} g/dL</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Ferritin</dt>
                <dd className="font-medium">{patient.baselineLabs?.ferritin || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'diagnosis' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Detailed Clinical Data</h3>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">Transfusion History</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">Frequency:</span> {patient.transfusionHistory?.transfusionFrequency || 'N/A'}</div>
              <div><span className="text-gray-500">Units/Transfusion:</span> {patient.transfusionHistory?.unitsPerTransfusion || 'N/A'}</div>
              <div><span className="text-gray-500">Last Transfusion:</span> {patient.transfusionHistory?.lastTransfusionDate || 'N/A'}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Chelation Therapy</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">On Chelation:</span> {patient.chelationTherapy?.onChelation ? 'Yes' : 'No'}</div>
              <div><span className="text-gray-500">Drug:</span> {patient.chelationTherapy?.chelationDrug || 'N/A'}</div>
              <div><span className="text-gray-500">Dosage:</span> {patient.chelationTherapy?.dosage || 'N/A'}</div>
              <div><span className="text-gray-500">Compliance:</span> {patient.chelationTherapy?.compliance || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Outpatient Visits</h3>
          {patient.outpatientVisits?.length > 0 ? (
            <div className="space-y-4">
              {patient.outpatientVisits.map((visit, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{visit.visitDate}</span>
                    <span className="text-sm text-gray-500">{visit.visitType}</span>
                  </div>
                  <p className="text-sm text-gray-600">{visit.chiefComplaint || 'No complaints recorded'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No visits recorded</p>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <History className="w-5 h-5 mr-2" />
            Audit History
          </h3>
          {auditLogs.length > 0 ? (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between">
                    <span className="font-medium capitalize">{log.action}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{log.userName}</p>
                  {log.metadata?.description && (
                    <p className="text-sm text-gray-500">{log.metadata.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No audit history available</p>
          )}
        </div>
      )}

      {/* Share Access Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Share Patient Access</h3>
            <p className="text-gray-600 mb-4">
              Enter the doctor ID or email to grant access to this patient's record.
            </p>
            <input
              type="text"
              value={shareDoctorId}
              onChange={(e) => setShareDoctorId(e.target.value)}
              placeholder="Doctor ID or Email"
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleShareAccess}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Share Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;
