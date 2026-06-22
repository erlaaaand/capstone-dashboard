export type DatasetStatus = 'DRAFT' | 'PROCESSING' | 'READY' | 'FAILED';
export type DatasetExportFormat = 'CSV' | 'JSON';

export interface DatasetItem {
  id: string;
  datasetId: string;
  predictionId: string;
  varietyCode?: string | null;
  varietyName?: string | null;
  confidenceScore?: number | null;
  confidenceTier?: 'very_high' | 'high' | 'medium' | 'low' | null;
  imageUrl: string;
  isVerified?: boolean | null;
  addedAt: string;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string | null;
  status: DatasetStatus;
  exportFormat: DatasetExportFormat;
  totalItems: number;
  exportUrl?: string | null;
  exportedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  items?: DatasetItem[] | null;
}

export interface PaginatedDatasets {
  data: Dataset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}