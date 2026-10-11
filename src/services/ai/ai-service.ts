import type { Mission, MissionGenerationParams } from '../../types';

export interface AIProvider {
  readonly name: string;
  readonly isLocal: boolean;
  checkAvailability(): Promise<boolean>;
  generateMission(params: MissionGenerationParams): Promise<Mission>;
}

export interface AIServiceStatus {
  provider: string;
  available: boolean;
  loading: boolean;
  modelName: string;
  isLocal: boolean;
  error?: string;
}
