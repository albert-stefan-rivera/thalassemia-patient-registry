/**
 * Tests for PhilHealthReport component
 *
 * Dev-spec requirements tested:
 * - 4.3 Report Generation: Exportable data summaries for research or national funding proposals
 * - 4.3 PhilHealth Proposal Support: Reports structured to align with funding criteria
 * - 5. Scenario 2: Admin generates report of patients by age with transfusion data
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mockPatientList = [
  {
    id: 'p1',
    patientId: 'THAL-2025-000001',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    age: 10,
    sex: 'male',
    thalassemiaType: 'major',
    status: 'active',
    transfusionHistory: { transfusionFrequency: 'monthly' },
    chelationTherapy: { onChelation: true },
    baselineLabs: { ferritin: '2000' }
  },
  {
    id: 'p2',
    patientId: 'THAL-2025-000002',
    firstName: 'Maria',
    lastName: 'Santos',
    age: 25,
    sex: 'female',
    thalassemiaType: 'intermedia',
    status: 'active',
    transfusionHistory: { transfusionFrequency: 'quarterly' },
    chelationTherapy: { onChelation: false },
    baselineLabs: { ferritin: '800' }
  },
  {
    id: 'p3',
    patientId: 'THAL-2025-000003',
    firstName: 'Pedro',
    lastName: 'Garcia',
    age: 5,
    sex: 'male',
    thalassemiaType: 'major',
    status: 'active',
    transfusionHistory: { transfusionFrequency: 'monthly' },
    chelationTherapy: { onChelation: true },
    baselineLabs: { ferritin: '3000' }
  }
];

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({
    docs: mockPatientList.map(p => ({
      id: p.id,
      data: () => p
    }))
  })),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn()
}));

vi.mock('../../config/firebase', () => ({ db: {} }));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { role: 'admin', permissions: { canGenerateReports: true } },
    hasPermission: () => true
  })
}));

vi.mock('lucide-react', () => ({
  Download: () => <span>DownloadIcon</span>,
  FileText: () => <span>FileTextIcon</span>,
  Calendar: () => <span>CalendarIcon</span>,
  Users: () => <span>UsersIcon</span>,
  Activity: () => <span>ActivityIcon</span>,
  TrendingUp: () => <span>TrendingUpIcon</span>,
  PieChart: () => <span>PieChartIcon</span>,
  BarChart3: () => <span>BarChartIcon</span>,
  Filter: () => <span>FilterIcon</span>,
  Printer: () => <span>PrinterIcon</span>
}));

import PhilHealthReport from '../PhilHealthReport';

describe('PhilHealthReport (Req 4.3 - Reporting and PhilHealth Proposal Support)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('Report Generation', () => {
    it('should display the PhilHealth Report Generator page', async () => {
      render(<PhilHealthReport />);
      expect(screen.getByText('PhilHealth Report Generator')).toBeInTheDocument();
    });

    it('should load and display patient data', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Total Patients')).toBeInTheDocument();
      });
    });

    it('should show total patients count in summary', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should show annual transfusions statistic', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Annual Transfusions')).toBeInTheDocument();
      });
    });

    it('should show average ferritin statistic', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Avg Ferritin')).toBeInTheDocument();
      });
    });

    it('should show priority cases count', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Priority Cases')).toBeInTheDocument();
      });
    });
  });

  describe('Report Filters (Req 4.3 Demographic & Clinical Filtering)', () => {
    it('should have filter controls', async () => {
      render(<PhilHealthReport />);
      expect(screen.getByText('Report Filters')).toBeInTheDocument();
    });

    it('should have thalassemia type filter', async () => {
      render(<PhilHealthReport />);
      expect(screen.getByText('All Types')).toBeInTheDocument();
    });

    it('should have age range filters (min and max)', async () => {
      render(<PhilHealthReport />);
      expect(screen.getByPlaceholderText('Min Age')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Max Age')).toBeInTheDocument();
    });

    it('should have sex filter', async () => {
      render(<PhilHealthReport />);
      expect(screen.getByText('All Genders')).toBeInTheDocument();
    });

    it('should have Apply Filters button', async () => {
      render(<PhilHealthReport />);
      expect(screen.getByText('Apply Filters')).toBeInTheDocument();
    });
  });

  describe('Charts Display (Req 4.3)', () => {
    it('should display patients by type chart', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Patients by Type')).toBeInTheDocument();
      });
    });

    it('should display age distribution chart', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Age Distribution')).toBeInTheDocument();
      });
    });
  });

  describe('Cost Analysis (Req 4.3 PhilHealth Proposal Support)', () => {
    it('should display treatment burden and cost analysis section', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Treatment Burden & Cost Analysis')).toBeInTheDocument();
      });
    });

    it('should show annual transfusion cost', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Annual Transfusion Cost')).toBeInTheDocument();
      });
    });

    it('should show annual chelation cost', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Annual Chelation Cost')).toBeInTheDocument();
      });
    });

    it('should show total annual cost', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Total Annual Cost')).toBeInTheDocument();
      });
    });
  });

  describe('PhilHealth Funding Recommendations', () => {
    it('should display funding recommendations section', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('PhilHealth Funding Recommendations')).toBeInTheDocument();
      });
    });

    it('should show recommended funding request amount', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Recommended Funding Request')).toBeInTheDocument();
      });
    });

    it('should show estimated infrastructure needs', async () => {
      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Estimated Infrastructure Needs')).toBeInTheDocument();
      });
    });
  });

  describe('Report Download (Req 4.3 Report Generation)', () => {
    it('should have a Download Report button', async () => {
      render(<PhilHealthReport />);
      expect(screen.getByText('Download Report')).toBeInTheDocument();
    });

    it('should generate downloadable report when clicked', async () => {
      const mockCreateElement = vi.spyOn(document, 'createElement');

      render(<PhilHealthReport />);
      await waitFor(() => {
        expect(screen.getByText('Total Patients')).toBeInTheDocument();
      });

      const downloadBtn = screen.getByText('Download Report');
      await userEvent.click(downloadBtn);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      mockCreateElement.mockRestore();
    });
  });
});
