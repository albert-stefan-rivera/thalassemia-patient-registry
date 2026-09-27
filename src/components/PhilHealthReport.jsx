import { useState, useEffect } from 'react';
import { 
  collection, query, where, getDocs, 
  orderBy, limit, startAfter 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Download, FileText, Calendar, Users, 
  Activity, TrendingUp, PieChart, BarChart3,
  Filter, Printer
} from 'lucide-react';

const PhilHealthReport = () => {
  const { userProfile, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    thalassemiaType: '',
    ageMin: '',
    ageMax: '',
    sex: '',
    transfusionStatus: ''
  });

  const fetchPatientsForReport = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'patients'),
        where('status', '==', 'active'),
        orderBy('registrationDate', 'desc'),
        limit(500)
      );
      
      const snapshot = await getDocs(q);
      let patientList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Apply client-side filters
      if (filters.thalassemiaType) {
        patientList = patientList.filter(p => p.thalassemiaType === filters.thalassemiaType);
      }
      if (filters.ageMin) {
        patientList = patientList.filter(p => p.age >= parseInt(filters.ageMin));
      }
      if (filters.ageMax) {
        patientList = patientList.filter(p => p.age <= parseInt(filters.ageMax));
      }
      if (filters.sex) {
        patientList = patientList.filter(p => p.sex === filters.sex);
      }
      
      setPatients(patientList);
      generateReport(patientList);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatientsForReport();
  }, []);

  const generateReport = (patientList) => {
    const byType = patientList.reduce((acc, p) => {
      const type = p.thalassemiaType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const bySex = patientList.reduce((acc, p) => {
      const sex = p.sex || 'Unknown';
      acc[sex] = (acc[sex] || 0) + 1;
      return acc;
    }, {});

    const ageGroups = {
      '0-5': patientList.filter(p => p.age >= 0 && p.age <= 5).length,
      '6-12': patientList.filter(p => p.age >= 6 && p.age <= 12).length,
      '13-18': patientList.filter(p => p.age >= 13 && p.age <= 18).length,
      '19-30': patientList.filter(p => p.age >= 19 && p.age <= 30).length,
      '31+': patientList.filter(p => p.age >= 31).length
    };

    // Calculate treatment burden estimates
    const transfusionFrequencyMap = {
      'monthly': 12,
      'bi-monthly': 6,
      'quarterly': 4,
      'irregular': 2,
      'none': 0
    };

    let totalAnnualTransfusions = 0;
    let patientsOnChelation = 0;
    let totalFerritin = 0;

    patientList.forEach(p => {
      const freq = p.transfusionHistory?.transfusionFrequency || 'irregular';
      totalAnnualTransfusions += transfusionFrequencyMap[freq] || 2;
      if (p.chelationTherapy?.onChelation) patientsOnChelation++;
      if (p.baselineLabs?.ferritin) {
        totalFerritin += parseFloat(p.baselineLabs.ferritin) || 0;
      }
    });

    const avgFerritin = patientList.length > 0 ? totalFerritin / patientList.length : 0;

    // PhilHealth-specific estimates (in PHP)
    const costPerTransfusion = 15000; // Approximate cost
    const costPerChelationMonthly = 8000; // Approximate monthly cost
    
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalPatients: patientList.length,
        byType,
        bySex,
        ageGroups
      },
      clinicalStatistics: {
        averageFerritin: avgFerritin.toFixed(2),
        patientsOnChelation,
        totalAnnualTransfusions,
        averageTransfusionsPerPatient: (totalAnnualTransfusions / patientList.length || 0).toFixed(1)
      },
      treatmentBurden: {
        estimatedAnnualTransfusionCost: totalAnnualTransfusions * costPerTransfusion,
        estimatedAnnualChelationCost: patientsOnChelation * costPerChelationMonthly * 12,
        totalEstimatedAnnualCost: (totalAnnualTransfusions * costPerTransfusion) + 
                                  (patientsOnChelation * costPerChelationMonthly * 12),
        costPerPatient: patientList.length > 0 
          ? ((totalAnnualTransfusions * costPerTransfusion) + 
             (patientsOnChelation * costPerChelationMonthly * 12)) / patientList.length
          : 0
      },
      philHealthFunding: {
        recommendedFunding: Math.ceil(patientList.length * 150000), // Per patient estimate
        priorityCases: patientList.filter(p => 
          p.thalassemiaType === 'major' && p.age < 18
        ).length,
        infrastructureNeeds: Math.ceil(patientList.length / 50) // 1 transfusion chair per 50 patients
      }
    };

    setReportData(report);
  };

  const downloadReport = () => {
    if (!reportData) return;

    const reportText = `
THALASSEMIA PATIENT REGISTRY - PHILHEALTH FUNDING REPORT
Generated: ${new Date(reportData.generatedAt).toLocaleDateString()}

======================================
SUMMARY
======================================
Total Active Patients: ${reportData.summary.totalPatients}

BY THALASSEMIA TYPE:
${Object.entries(reportData.summary.byType).map(([type, count]) => 
  `  - ${type}: ${count} patients`
).join('\n')}

BY SEX:
${Object.entries(reportData.summary.bySex).map(([sex, count]) => 
  `  - ${sex}: ${count} patients`
).join('\n')}

AGE DISTRIBUTION:
${Object.entries(reportData.summary.ageGroups).map(([range, count]) => 
  `  - ${range} years: ${count} patients`
).join('\n')}

======================================
CLINICAL STATISTICS
======================================
Average Ferritin Level: ${reportData.clinicalStatistics.averageFerritin} ng/mL
Patients on Chelation Therapy: ${reportData.clinicalStatistics.patientsOnChelation}
Total Annual Transfusions: ${reportData.clinicalStatistics.totalAnnualTransfusions}

======================================
TREATMENT BURDEN ANALYSIS
======================================
Estimated Annual Transfusion Cost: ₱${reportData.treatmentBurden.estimatedAnnualTransfusionCost.toLocaleString()}
Estimated Annual Chelation Cost: ₱${reportData.treatmentBurden.estimatedAnnualChelationCost.toLocaleString()}
Total Estimated Annual Cost: ₱${reportData.treatmentBurden.totalEstimatedAnnualCost.toLocaleString()}
Average Cost per Patient: ₱${reportData.treatmentBurden.costPerPatient.toLocaleString()}

======================================
PHILHEALTH FUNDING RECOMMENDATIONS
======================================
Recommended Funding Request: ₱${reportData.philHealthFunding.recommendedFunding.toLocaleString()}
Priority Cases (Pediatric Major): ${reportData.philHealthFunding.priorityCases} patients
Estimated Infrastructure Needs: ${reportData.philHealthFunding.infrastructureNeeds} transfusion chairs

======================================
Notes
======================================
This report is generated for the purpose of PhilHealth funding applications
and represents data as of ${new Date().toLocaleDateString()}.
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PhilHealth-Report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PhilHealth Report Generator</h1>
          <p className="text-gray-600">Generate funding proposals and burden analysis reports</p>
        </div>
        <button
          onClick={downloadReport}
          disabled={!reportData}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Report Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.thalassemiaType}
            onChange={(e) => setFilters(prev => ({ ...prev, thalassemiaType: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Types</option>
            <option value="major">Thalassemia Major</option>
            <option value="intermedia">Thalassemia Intermedia</option>
            <option value="minor">Thalassemia Minor</option>
            <option value="hbe">HbE Disease</option>
            <option value="hbh">HbH Disease</option>
          </select>
          
          <input
            type="number"
            placeholder="Min Age"
            value={filters.ageMin}
            onChange={(e) => setFilters(prev => ({ ...prev, ageMin: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          
          <input
            type="number"
            placeholder="Max Age"
            value={filters.ageMax}
            onChange={(e) => setFilters(prev => ({ ...prev, ageMax: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          
          <select
            value={filters.sex}
            onChange={(e) => setFilters(prev => ({ ...prev, sex: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          
          <button
            onClick={fetchPatientsForReport}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : reportData ? (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center mb-2">
                <Users className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-blue-600 font-medium">Total Patients</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">{reportData.summary.totalPatients}</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center mb-2">
                <Activity className="w-6 h-6 text-green-600 mr-2" />
                <span className="text-green-600 font-medium">Annual Transfusions</span>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {reportData.clinicalStatistics.totalAnnualTransfusions}
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600 mr-2" />
                <span className="text-purple-600 font-medium">Avg Ferritin</span>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {reportData.clinicalStatistics.averageFerritin}
                <span className="text-lg">ng/mL</span>
              </p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-6">
              <div className="flex items-center mb-2">
                <FileText className="w-6 h-6 text-yellow-600 mr-2" />
                <span className="text-yellow-600 font-medium">Priority Cases</span>
              </div>
              <p className="text-3xl font-bold text-yellow-900">
                {reportData.philHealthFunding.priorityCases}
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Patients by Type
              </h3>
              <div className="space-y-3">
                {Object.entries(reportData.summary.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center">
                    <span className="w-32 text-sm text-gray-600 capitalize">{type}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 mx-3">
                      <div 
                        className="bg-blue-500 h-4 rounded-full" 
                        style={{ width: `${(count / reportData.summary.totalPatients) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Age Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(reportData.summary.ageGroups).map(([range, count]) => (
                  <div key={range} className="flex items-center">
                    <span className="w-20 text-sm text-gray-600">{range} yrs</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 mx-3">
                      <div 
                        className="bg-green-500 h-4 rounded-full" 
                        style={{ width: `${(count / reportData.summary.totalPatients) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Treatment Burden & Cost Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Annual Transfusion Cost</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₱{reportData.treatmentBurden.estimatedAnnualTransfusionCost.toLocaleString()}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Annual Chelation Cost</p>
                <p className="text-2xl font-bold text-green-600">
                  ₱{reportData.treatmentBurden.estimatedAnnualChelationCost.toLocaleString()}
                </p>
              </div>
              <div className="border rounded-lg p-4 bg-blue-50">
                <p className="text-sm text-gray-500 mb-1">Total Annual Cost</p>
                <p className="text-2xl font-bold text-blue-900">
                  ₱{reportData.treatmentBurden.totalEstimatedAnnualCost.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* PhilHealth Recommendations */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">
              PhilHealth Funding Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-green-700">Recommended Funding Request</p>
                <p className="text-3xl font-bold text-green-900">
                  ₱{reportData.philHealthFunding.recommendedFunding.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">Estimated Infrastructure Needs</p>
                <p className="text-3xl font-bold text-green-900">
                  {reportData.philHealthFunding.infrastructureNeeds} transfusion chairs
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No data available for report</p>
        </div>
      )}
    </div>
  );
};

export default PhilHealthReport;
