export interface HealthAnalysisResponse {
  success: boolean;
  analysis?: HealthAnalysisResult;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  error?: string;
  details?: string;
  tokenReward?: {
    earned: number;
    total: number;
    isNewUser: boolean;
  };
}

export interface HealthAnalysisResult {
  title: string; // NEW: AI-generated title
  documentType: string;
  date?: string;
  patientInfo?: {
    name?: string;
    age?: string;
    gender?: string;
    id?: string;
  };
  findings: HealthFinding[];
  abnormalValues: AbnormalValue[];
  summary: string; // Enhanced (4-6 sentences)
  detailedAnalysis: string; // NEW: In-depth analysis (200+ words)
  medicalContext: string; // NEW: Educational info (150+ words)
  recommendations: RecommendationCategory[] | string[]; // Categorized (new) or simple array (legacy)
  riskAssessment: RiskAssessment; // NEW: Structured risk info
  confidence: number;
  disclaimer: string;
}

export interface HealthFinding {
  parameter: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  category?: string;
  clinicalSignificance?: string; // NEW: Detailed explanation
}

export interface AbnormalValue {
  parameter: string;
  value: string;
  expectedRange: string;
  severity: 'mild' | 'moderate' | 'severe';
  meaning?: string; // Enhanced detail
  possibleCauses?: string[]; // NEW
  recommendedActions?: string[]; // NEW
}

export interface RecommendationCategory {
  category: 'Immediate Actions' | 'Lifestyle Modifications' | 'Follow-up Care';
  items: string[];
}

export interface RiskAssessment {
  level: 'low' | 'moderate' | 'high';
  factors: string[];
  followUpRequired: boolean;
  followUpTiming?: string;
}

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const;

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export type AllowedFileType = typeof ALLOWED_FILE_TYPES[number];

// Dashboard API Types
export interface DashboardResponse {
  success: boolean;
  data?: {
    user: {
      walletAddress: string;
      tokens: number;
      totalAnalyses: number;
      lastAnalysisDate?: string;
      memberSince: string;
    };
    reports: DashboardReport[];
    stats: {
      totalReports: number;
      reportsThisMonth: number;
      reportsThisWeek: number;
    };
  };
  error?: string;
  details?: string;
}

export interface DashboardReport {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  format: 'json';
  createdAt: string;
  updatedAt: string;
  // Full analysis data for JSON format
  // Using Partial for backward compatibility with older records
  analysisData?: Partial<HealthAnalysisResult>;
}
