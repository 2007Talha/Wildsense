import type { AIProvider, AIServiceStatus } from './ai-service';
import type { Mission, MissionGenerationParams } from '../../types';
import { OllamaProvider } from './ollama-provider';
import { GeminiProvider } from './gemini-provider';
import { FallbackProvider } from './fallback-provider';

export class AIRouter {
  private providers: AIProvider[];
  private activeProvider: AIProvider | null = null;
  private fallback: FallbackProvider;
  private gemini: GeminiProvider;
  private ollama: OllamaProvider;
  private _status: AIServiceStatus = {
    provider: 'initializing',
    available: false,
    loading: true,
    modelName: '',
    isLocal: true,
  };
  private listeners: Set<(status: AIServiceStatus) => void> = new Set();

  constructor() {
    this.fallback = new FallbackProvider();
    this.gemini = new GeminiProvider();
    this.ollama = new OllamaProvider();
    this.providers = [
      this.ollama,
      this.gemini,
      this.fallback,
    ];
  }

  get status(): AIServiceStatus {
    return { ...this._status };
  }

  subscribe(listener: (status: AIServiceStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this._status);
    return () => this.listeners.delete(listener);
  }

  private updateStatus(update: Partial<AIServiceStatus>) {
    this._status = { ...this._status, ...update };
    this.listeners.forEach((fn) => fn(this._status));
  }

  async initialize(): Promise<void> {
    this.updateStatus({ loading: true });

    for (const provider of this.providers) {
      try {
        const available = await provider.checkAvailability();
        if (available) {
          this.activeProvider = provider;
          this.updateStatus({
            provider: provider.name,
            available: true,
            loading: false,
            modelName: provider.name,
            isLocal: provider.isLocal,
            error: undefined,
          });
          console.log(`[WildSense AI] Active provider: ${provider.name}`);
          return;
        }
      } catch (err) {
        console.warn(`[WildSense AI] Provider ${provider.name} check failed:`, err);
      }
    }

    // Should never reach here because FallbackProvider always returns true
    this.activeProvider = this.fallback;
    this.updateStatus({
      provider: this.fallback.name,
      available: true,
      loading: false,
      modelName: 'Curated Library',
      isLocal: true,
    });
  }

  async generateMission(params: MissionGenerationParams): Promise<Mission> {
    if (!this.activeProvider) {
      await this.initialize();
    }

    const provider = this.activeProvider!;

    try {
      this.updateStatus({ loading: true });
      const mission = await provider.generateMission(params);
      this.updateStatus({ loading: false, error: undefined });
      return mission;
    } catch (err) {
      console.error(`[WildSense AI] ${provider.name} failed, falling back:`, err);

      // Fall back to curated missions
      if (provider !== this.fallback) {
        this.updateStatus({
          loading: false,
          error: `${provider.name} failed — using curated missions`,
        });
        return this.fallback.generateMission(params);
      }

      throw err;
    }
  }

  async askNaturalist(query: string, imageBase64?: string): Promise<import('../../types').NaturalistResponse> {
    const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || localStorage.getItem('wildsense_gemini_key') || '';
    let apiNotice: string | undefined;

    if (key.trim().length > 10) {
      try {
        const resp = await this.gemini.askNaturalist(query, imageBase64);
        return resp;
      } catch (err: any) {
        console.warn('[WildSense AI] Gemini Naturalist error, falling back to offline naturalist:', err);
        const msg = String(err?.message || err);
        if (msg.includes('prepayment') || msg.includes('credits') || msg.includes('402')) {
          apiNotice = 'Google Gemini cloud credits depleted. Evaluated using WildSense Local Naturalist Engine.';
        } else if (msg.includes('quota') || msg.includes('429')) {
          apiNotice = 'Google Gemini API quota reached. Evaluated using WildSense Local Naturalist Engine.';
        } else {
          apiNotice = `Google Gemini unavailable (${msg.slice(0, 60)}). Evaluated using WildSense Local Naturalist Engine.`;
        }
      }
    }

    const fallbackResp = await this.fallback.askNaturalist(query);
    if (apiNotice) {
      fallbackResp.apiNotice = apiNotice;
    }
    return fallbackResp;
  }

  async identifyImage(file: File | Blob, imageUrl: string, imageBase64: string): Promise<import('../../types').IdentificationResult> {
    const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || localStorage.getItem('wildsense_gemini_key') || '';
    let apiNotice: string | undefined;

    if (key.trim().length > 10) {
      try {
        const result = await this.gemini.identifyImage(file, imageUrl, imageBase64);
        return result;
      } catch (err: any) {
        console.warn('[WildSense AI] Gemini Vision error, falling back to offline classification:', err);
        const msg = String(err?.message || err);
        if (msg.includes('prepayment') || msg.includes('credits') || msg.includes('402')) {
          apiNotice = 'Google Gemini cloud credits depleted. Processed with WildSense Local Vision Engine.';
        } else if (msg.includes('quota') || msg.includes('429')) {
          apiNotice = 'Google Gemini API quota reached. Processed with WildSense Local Vision Engine.';
        } else {
          apiNotice = `Google Gemini unavailable (${msg.slice(0, 60)}). Processed with WildSense Local Vision Engine.`;
        }
      }
    }

    return { apiNotice } as any;
  }


  async recheckProviders(): Promise<void> {
    this.activeProvider = null;
    await this.initialize();
  }
}

// Singleton instance
export const aiRouter = new AIRouter();
