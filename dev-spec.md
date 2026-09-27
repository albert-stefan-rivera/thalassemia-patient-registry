Functional Specifications Document Thalassemia Patient Registry Application
Developed for a Doctor-led Organization in the Philippines

1. Purpose of the Application
The Thalassemia Patient Registry is a secure, web-based system designed for doctors and administrators in the Philippines to document, monitor, and share data on patients diagnosed with Thalassemia. The system ensures privacy, enhances continuity of care, supports coordinated management across institutions, and enables future health policy advocacy including funding applications to PhilHealth.

2. Intended Users
Doctors: Medical professionals from various hospitals who will use the platform to manage their own patients and, when granted permission, view data shared by other clinicians. Doctors can input, edit, and track patient records.
Administrators: Authorized personnel who have oversight of the full patient registry, manage doctor access, verify data, and generate reports for internal or external use.

3. Accessibility and Devices
The application will be accessible through any modern web browser.
Designed for data entry on PCs and tablets (e.g., during outpatient visits or hospital rounds).
Optimized for viewing on smartphones to support on-the-go access.

4. Core Functional Features
4.1 Patient Data Management
Feature
Description
Patient Registration
Doctors can register patients using digitized Baseline and Outpatient Case Report Forms (CRFs).
Progressive Entry
Incomplete forms can be saved and updated later. Mandatory and optional fields are marked.
Data Editing
Both doctors and administrators can edit records. All changes are logged.
Edit Log
An audit trail records what was changed, who made the change, and when.
Main Doctor Tag
Each patient record displays the assigned main doctor.

4.2 Privacy, Permissions & Transparency
Feature
Description
Controlled Access
Doctors can only view their own patients unless permission is explicitly granted.
Administrator Override
Admins may assign or revoke access permissions to any patient data.
Shared Access Visibility
Doctors can view a list of other doctors who also have access to a patient’s records.
Full Transparency
Patient view always shows the main doctor and other authorized viewers.

4.3 Reporting and Filtering
Feature
Description
Demographic Filtering
Admins can filter patient records based on age, sex, ethnicity, socioeconomic class, etc.
Clinical Filtering
Includes filters for transfusion frequency, medication types, CBC values, ferritin, etc.
Report Generation
Exportable data summaries for use in research or national funding proposals.
PhilHealth Proposal Support
Reports structured to align with funding criteria and demonstrate patient burden.


5. Practical Use Scenarios
A doctor enters baseline and initial lab results during a new outpatient consultation using a tablet.
A regional admin generates a report of patients under age 12 who have received 4+ transfusions in the last 6 months.
A doctor viewing a patient’s file can see which other doctors also have access to collaborate on case management.
A change in lab values is recorded, with timestamp and editor’s name logged in the audit history.

6. Infrastructure Plan and Cost Consideration
Phase 1: Initial Rollout (Free Tier)
Host using free or low-cost platforms like Firebase, Google Sheets as fallback, or open-source platforms.
Authentication managed using Google Workspace or similar tools.
Phase 2: Expansion (After One Year)
Transition to scalable cloud infrastructure (e.g., AWS, Google Cloud) using NGO/education credits.
Optional introduction of a shared minimal operational cost, once funding is secured.
General Focus:
Prioritize zero-cost services during pilot.
Enable sustainability with low-cost options as the registry scales.

7. Security and Compliance
Secure login authentication required for all users.
Two-Factor Authentication (2FA) available for administrators.
Data encrypted during transmission and storage.
All users subject to role-based access control.
Complies with the Philippine Data Privacy Act.
Informed consent tracked as per CRF fields (patient/guardian/caregiver signed).

8. Summary
The Thalassemia Registry is a clinical-grade, secure, and scalable tool designed to:
Streamline and standardize patient data collection using digital CRFs
Respect doctor and patient privacy while supporting multi-site access
Equip administrators with the tools to filter, report, and advocate for resources
Begin with no-cost infrastructure and evolve into a sustainable platform
By leveraging the registry, medical professionals can enhance collaborative care, support public health advocacy, and drive systemic improvement in Thalassemia management across the Philippines.
