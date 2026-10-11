export interface IdentificationResult {
  id: string;
  imageUrl?: string;
  imageBlob?: Blob;
  predictedLabel: string;
  confidence: number | null;
  category: string;
  characteristics: string[];
  natureFacts: string[];
  source: 'model' | 'manual' | 'gemini' | 'ollama';
  modelName?: string;
  warning: string;
  createdAt: Date;
  notFound?: boolean;
  error?: string;
  ecologicalContext?: string;
  suggestedFollowUp?: string;
  apiNotice?: string;
}

export interface VisionServiceStatus {
  available: boolean;
  loading: boolean;
  modelName: string;
  error?: string;
}

