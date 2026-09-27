import { useState, useEffect } from 'react';
import { 
  collection, query, where, getDocs, orderBy, limit, 
  onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, Filter, Download, Users, 
  Activity, FileText, AlertCircle, RefreshCw,
  Calendar, BarChart3, PieChart, TrendingUp
} from 'lucide-react';

const AdminDashboard = () => {
  const { currentUser, userProfile, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    newThisMonth: 0,
    criticalCases: 0
  });
  const [filters, setFilters] = useState({
    searchTerm: '',
    thalassemiaType: '',
    ageRange: { min: '', max: '' },
    sex: '',
    status: '',
    dateRange: { start: '', end: '' }
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch patient data
  const fetchPatients = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'patients'),
        orderBy('registrationDate', 'desc'),
        limit(100)
      );
      
      // Apply filters
      if (filters.thalassemiaType) {
        q = query(
          collection(db, 'patients'),
          where('thalassemiaType', '==', filters.thalassemiaType),
          orderBy('registrationDate', 'desc'),
          limit(100)
        );
      }
      
      if (filters.sex) {
        q = query(
          collection(db, 'patients'),
          where('sex', '==', filters.sex),
          orderBy('registrationDate', 'desc'),
          limit(100)
        );
      }
      
      const snapshot = await getDocs(q);
      const patientList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Apply client-side filtering for complex queries
      let filtered = patientList;
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
          p.patientId?.toLowerCase().includes(term) ||
          p.lastName?.toLowerCase().includes(term) ||
          p.firstName?.toLowerCase().includes(term) ||
          p.phoneNumber?.includes(term)
        );
      }
      
      // Calculate stats
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const newThisMonth = patientList.filter(p => {
        const regDate = p.registrationDate ? new Date(p.registrationDate) : null;
        return regDate && regDate.getMonth() === thisMonth && regDate.getFullYear() === thisYear;
      }).length;
      
      setPatients(filtered);
      setStats({
        totalPatients: patientList.length,
        activePatients: patientList.filter(p => p.status === 'active').length,
        newThisMonth,
        criticalCases: patientList.filter(p => p.status === 'critical').length
      });
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, [filters.thalassemiaType, filters.sex]);

  // Calculate demographic stats
  const demographicStats = {
    byType: patients.reduce((acc, p) => {
      const type = p.thalassemiaType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}),
    bySex: patients.reduce((acc, p) => {
      const sex = p.sex || 'Unknown';
      acc[sex] = (acc[sex] || 0) + 1;
      return acc;
    }, {}),
    ageGroups: {
      '0-5': patients.filter(p => p.age >= 0 && p.age <= 5).length,
      '6-12': patients.filter(p => p.age >= 6 && p.age <= 12).length,
      '13-18': patients.filter(p => p.age >= 13 && p.age <= 18).length,
      '19-30': patients.filter(p => p.age >= 19 && p.age <= 30).length,
      '31+': patients.filter(p => p.age >= 31).length
    }
  };

  const exportToCSV = () => {
    const headers = ['Patient ID', 'Name', 'Age', 'Sex', 'Type', 'Status', 'Registration Date'];
    const rows = patients.map(p => [
      p.patientId,
      `${p.lastName}, ${p.firstName}`,
      p.age,
      p.sex,
      p.thalassemiaType,
      p.status,
      p.registrationDate
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thalassemia-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const generatePhilHealthReport = () => {
    // Generate structured report for PhilHealth funding proposals
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalPatients: patients.length,
        byType: demographicStats.byType,
        bySex: demographicStats.bySex,
        ageDistribution: demographicStats.ageGroups
      },
      treatmentBurden: {
        averageTransfusionFrequency: 'Monthly',
        estimatedAnnualTransfusions: patients.length * 12,
        estimatedAnnualChelationCost: patients.length * 50000 // PHP estimate
      },
      recommendations: {
        fundingNeeded: patients.length * 100000, // PHP per patient estimate
        priorityCases: patients.filter(p => p.status === 'critical').length
      }
    };
    
    return report;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Thalassemia Patient Registry Overview</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={fetchPatients}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold">{stats.totalPatients}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Patients</p>
              <p className="text-2xl font-bold">{stats.activePatients}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">New This Month</p>
              <p className="text-2xl font-bold">{stats.newThisMonth}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Critical Cases</p>
              <p className="text-2xl font-bold">{stats.criticalCases}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search by Patient ID, Name, Phone..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="ml-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
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
            
            <select
              value={filters.sex}
              onChange={(e) => setFilters(prev => ({ ...prev, sex: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="critical">Critical</option>
              <option value="deceased">Deceased</option>
            </select>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Patients by Thalassemia Type
          </h3>
          <div className="space-y-3">
            {Object.entries(demographicStats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center">
                <span className="w-32 text-sm text-gray-600 capitalize">{type}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 mx-3">
                  <div 
                    className="bg-blue-500 h-4 rounded-full" 
                    style={{ width: `${(count / patients.length) * 100}%` }}
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
            {Object.entries(demographicStats.ageGroups).map(([range, count]) => (
              <div key={range} className="flex items-center">
                <span className="w-20 text-sm text-gray-600">{range} yrs</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 mx-3">
                  <div 
                    className="bg-green-500 h-4 rounded-full" 
                    style={{ width: `${patients.length ? (count / patients.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-12 text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PhilHealth Report Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              PhilHealth Funding Report
            </h3>
            <p className="text-blue-700 mt-1">
              Generate reports structured for PhilHealth funding applications
            </p>
          </div>
          <button
            onClick={() => {
              const report = generatePhilHealthReport();
              console.log('PhilHealth Report:', report);
              alert('Report generated! Check console for detailed data.');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age/Sex
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Main Doctor
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  Loading patients...
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  No patients found
                </td>
              </tr>
            ) : (
              patients.slice(0, 20).map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {patient.patientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {patient.lastName}, {patient.firstName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.age} / {patient.sex}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {patient.thalassemiaType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${patient.status === 'active' ? 'bg-green-100 text-green-800' : 
                        patient.status === 'critical' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.mainDoctorName || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {patients.length > 20 && (
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            <p className="text-gray-500">
              Showing 20 of {patients.length} patients
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
