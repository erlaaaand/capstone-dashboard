export type PredictionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface Prediction {
  id: string;
  userId: string;
  varietyCode: string | null;
  varietyName: string | null;
  confidenceScore: number | null;
  imageUrl: string;
  status: PredictionStatus;
  isVerified: string;
  adminNote: string | null;
  actualVarietyCode: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface PaginatedPredictions {
  data: Prediction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}