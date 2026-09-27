# Thalassemia Patient Registry Application

A secure, web-based system for doctors and administrators in the Philippines to document, monitor, and share data on patients diagnosed with Thalassemia.

## 🎯 Purpose

The Thalassemia Patient Registry is designed to:
- Streamline and standardize patient data collection using digital CRFs
- Respect doctor and patient privacy while supporting multi-site access
- Equip administrators with tools to filter, report, and advocate for resources
- Begin with no-cost infrastructure (Firebase free tier) and evolve into a sustainable platform

## 👥 Intended Users

### Doctors
- Medical professionals from various hospitals
- Manage their own patients
- View data shared by other clinicians (with permission)
- Input, edit, and track patient records

### Administrators
- Authorized personnel with oversight of the full patient registry
- Manage doctor access and permissions
- Verify data integrity
- Generate reports for research and funding proposals

## ✨ Core Features

### 1. Patient Data Management
- **Patient Registration**: Digitized Baseline and Outpatient Case Report Forms (CRFs)
- **Progressive Entry**: Save incomplete forms and update later
- **Data Editing**: Doctors and administrators can edit records
- **Audit Trail**: Log all changes with editor identity and timestamp
- **Main Doctor Tag**: Each patient displays assigned main doctor

### 2. Privacy & Permissions
- **Controlled Access**: Doctors view only their own patients unless permission granted
- **Administrator Override**: Admins assign/revoke access permissions
- **Shared Access Visibility**: See which doctors have access to each patient
- **Full Transparency**: Patient view shows main doctor and authorized viewers

### 3. Reporting & Filtering
- **Demographic Filtering**: Age, sex, ethnicity, socioeconomic class
- **Clinical Filtering**: Transfusion frequency, medication types, CBC values, ferritin
- **Report Generation**: Exportable data summaries for research and funding
- **PhilHealth Proposal Support**: Reports structured for funding criteria

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Free Tier)
  - Authentication (Google Workspace integration)
  - Firestore Database
  - Cloud Functions (future)
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase Account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/thalassemia-registry.git
cd thalassemia-registry
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Enable Firestore Database
   - Copy your Firebase config to `src/config/firebase.js`

4. Set up Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isDoctor() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'doctor';
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isMainDoctor(patientId) {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/patients/$(patientId)).data.mainDoctorId == request.auth.uid;
    }
    
    function hasAccess(patientId) {
      return isAuthenticated() && 
        (isMainDoctor(patientId) || 
         isAdmin() || 
         request.auth.uid in get(/databases/$(database)/documents/patients/$(patientId)).data.authorizedViewers);
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || request.auth.uid == userId;
    }
    
    // Patients collection
    match /patients/{patientId} {
      allow read: if isAuthenticated() && hasAccess(patientId);
      allow create: if isDoctor();
      allow update: if isAuthenticated() && 
        (isMainDoctor(patientId) || isAdmin());
    }
    
    // Audit logs collection
    match /auditLogs/{logId} {
      allow read: if isDoctor();
      allow create: if isAuthenticated();
    }
  }
}
```

5. Start development server:
```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── components/
│   ├── LandingPage.jsx          # Main landing page
│   ├── DoctorLogin.jsx          # Doctor authentication
│   ├── PatientForm.jsx         # Baseline CRF form
│   ├── OutpatientForm.jsx      # Outpatient CRF form
│   ├── PatientDetail.jsx       # Patient record view
│   ├── DoctorDashboard.jsx     # Doctor's patient list
│   ├── AdminDashboard.jsx      # Admin oversight dashboard
│   ├── PatientSearch.jsx       # Advanced search/filter
│   ├── PhilHealthReport.jsx    # Report generation
│   ├── AuditLog.jsx            # Change history view
│   └── ProtectedRoute.jsx      # Route protection HOC
├── config/
│   └── firebase.js              # Firebase configuration
├── contexts/
│   └── AuthContext.jsx         # Authentication context
├── hooks/
│   └── usePermissions.js       # Permission management hook
├── utils/
│   ├── patientId.js            # Unique ID generation
│   ├── auditLogger.js          # Audit trail utilities
│   ├── reportGenerator.js      # PhilHealth report builder
│   └── formValidators.js       # Form validation
├── App.jsx                      # Main app with routing
├── main.jsx                     # Entry point
└── index.css                   # Global styles
```

## 📋 CRF Forms

### Baseline Case Report Form
- Patient demographics
- Thalassemia type and diagnosis date
- Family history
- Initial lab results (CBC, ferritin)
- Transfusion history baseline
- Consent information

### Outpatient Case Report Form
- Visit date and chief complaint
- Transfusion frequency
- Current medications (chelation therapy)
- Recent lab values
- Complications/side effects
- Follow-up plan

## 🔐 Security & Compliance

- **Authentication**: Secure login with Firebase Auth
- **2FA**: Available for administrators
- **Encryption**: Data encrypted in transit and at rest
- **Access Control**: Role-based permissions (Doctor/Admin)
- **Philippine Data Privacy Act**: Compliant with DPA requirements
- **Audit Trail**: All changes logged with timestamp and editor

## 📊 Reporting Features

### Demographic Reports
- Age distribution
- Gender breakdown
- Ethnicity statistics
- Geographic distribution

### Clinical Reports
- Transfusion frequency analysis
- Medication effectiveness
- Ferritin level trends
- Complication rates

### PhilHealth Funding Reports
- Patient burden statistics
- Treatment cost projections
- Resource utilization data

## 🎨 Design Principles

- **Responsive**: Works on PC, tablet, and mobile
- **Accessible**: WCAG 2.1 compliant
- **Performant**: Optimized for low-bandwidth environments
- **Medical-Grade**: Professional, clean interface
- **Offline-Capable**: PWA-ready for field work

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Docker
```bash
docker build -t thalassemia-registry .
docker run -p 3000:3000 thalassemia-registry
```

## 📈 Phase 2 Roadmap

After initial rollout (1 year), consider:
- Transition to scalable cloud (AWS/GCP with NGO credits)
- Mobile apps for iOS/Android
- Advanced analytics dashboard
- API integrations with hospital systems
- Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For technical support or questions, please contact the development team or refer to the Firebase documentation.

---

Built for better Thalassemia care in the Philippines 🇵🇭
