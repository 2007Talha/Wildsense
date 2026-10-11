import type { AIProvider } from './ai-service';
import type { Mission, MissionGenerationParams } from '../../types';
import { sanitizeMissionFromAI, validateMission } from '../../utils/mission-validator';

const SYSTEM_PROMPT = `You are WildSense, an AI nature companion that crafts mindful outdoor exploration missions.
Generate a structured JSON mission based on the user's preferences.
The mission should encourage putting the screen away and observing the physical world.

CRITICAL RULES:
- Tasks must be real-world physical activities done outdoors
- Never suggest eating, touching, or harvesting unknown plants, fungi, or animals
- Never suggest entering private property or hazardous terrain
- Include sensory cues (listening, smelling, tactile textures)
- Return ONLY valid JSON matching this schema (no markdown, no code fences):
{
  "title": "string (engaging title)",
  "description": "string (1-2 sentences)",
  "category": "string",
  "duration": number,
  "difficulty": "string",
  "environment": "string",
  "equipment": ["string array"],
  "tasks": ["string array of 3-5 specific outdoor tasks"],
  "observationTips": ["string array of 2-3 sensory tips"],
  "natureFacts": ["string array of 2-3 real ecological facts"],
  "reflectionQuestion": "string",
  "safetyReminder": "string"
}`;

export class GeminiProvider implements AIProvider {
  readonly name = 'Google Gemini (Cloud)';
  readonly isLocal = false;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  get hasKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  async checkAvailability(): Promise<boolean> {
    const key = this.apiKey || localStorage.getItem('wildsense_gemini_key') || '';
    return key.trim().length > 10;
  }

  async generateMission(params: MissionGenerationParams): Promise<Mission> {
    const key = this.apiKey || localStorage.getItem('wildsense_gemini_key') || '';
    if (!key) {
      throw new Error('No Gemini API key configured.');
    }

    const startTime = performance.now();
    const prompt = `Create an outdoor ${params.category} mission. Duration: ${params.duration} min. Environment: ${params.environment}. Difficulty: ${params.difficulty}. Mood: ${params.mood || 'curious'}.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Request: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const latencyMs = Math.round(performance.now() - startTime);
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    const parsed = JSON.parse(content);
    parsed.category = parsed.category || params.category;
    parsed.difficulty = parsed.difficulty || params.difficulty;
    parsed.environment = parsed.environment || params.environment;
    parsed.duration = parsed.duration || params.duration;
    parsed.mood = parsed.mood || params.mood;

    const mission = sanitizeMissionFromAI(parsed, 'gemini-2.0-flash', latencyMs);
    validateMission(mission);
    return mission;
  }

  async askNaturalist(query: string, imageBase64?: string): Promise<import('../../types').NaturalistResponse> {
    const key = this.apiKey || localStorage.getItem('wildsense_gemini_key') || '';
    if (!key) throw new Error('No Gemini API key available.');

    const prompt = `You are WildSense Field Naturalist AI, a world-class on-trail botanist, ornithologist, and ecologist.
The user submitted an outdoor observation query or image:
"${query}"

CRITICAL VALIDATION RULES:
1. UNKNOWN TEXT / NON-NATURE / GIBBERISH:
If the input or image is NOT a natural outdoor specimen (e.g. random letters like "asdfgh", numbers, modern human machines, cars, phones, computers, non-nature questions like coding or math, indoor furniture, or if no living organism or natural feature can be recognized):
You MUST return JSON with:
{
  "notFound": true,
  "error": "Unrecognized specimen or not an outdoor nature observation.",
  "answer": "This does not match any recognized wild flora, fauna, fungi, or natural outdoor phenomenon. WildSense is dedicated to identifying real outdoor nature. Please describe a natural observation (leaves, bark, plumage, behavior, habitat) or attach a clear nature photo.",
  "suggestedName": "Specimen Not Found",
  "category": "other",
  "confidenceText": "Not Found",
  "confidence": 0,
  "characteristics": [],
  "natureFacts": [],
  "ecologicalContext": "No wild ecological niche identified.",
  "safetyCaution": "Please provide a query or photo depicting a wild outdoor organism or landscape feature.",
  "suggestedFollowUp": "Try observing a nearby tree, flower, insect, or bird on your trail."
}

2. VALID NATURE SPECIMEN:
If it IS a recognized plant, bird, insect, tree, fungus, mammal, track, feather, flower, or outdoor phenomenon:
{
  "notFound": false,
  "error": null,
  "answer": "Clear, friendly, conversational scientific breakdown of what this likely is, how to identify it, and where it lives.",
  "suggestedName": "Common Name (Scientific name)",
  "category": "bird", "plant", "insect", "fungus", "mammal", "landscape", or "other",
  "confidenceText": "High Confidence" or "Probable Match" or "Plausible Hypothesis",
  "confidence": 0.85,
  "characteristics": ["trait 1 to verify outdoors", "trait 2 to verify outdoors"],
  "natureFacts": ["interesting ecological fact 1", "interesting ecological fact 2"],
  "ecologicalContext": "Why this organism matters to local biodiversity and food web",
  "safetyCaution": "Safety advice if applicable (e.g. Do not ingest, observe without disturbing)",
  "suggestedFollowUp": "A question to ponder or a subtle sensory detail to check next"
}

Return ONLY valid JSON matching this schema (no markdown formatting, no code blocks).`;

    const parts: any[] = [{ text: prompt }];
    if (imageBase64) {
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: cleanBase64,
        },
      });
    }

    const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError = '';

    for (const model of modelsToTry) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts }],
              generationConfig: {
                temperature: 0.4,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          lastError = errData?.error?.message || `Status ${res.status}: ${res.statusText}`;
          if (res.status === 404) {
            continue; // try next model if 404 not found
          }
          throw new Error(lastError);
        }

        const data = await res.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const parsed = JSON.parse(content);

        return {
          notFound: Boolean(parsed.notFound),
          error: parsed.error || undefined,
          answer: parsed.answer || 'Observation evaluated by Gemini AI.',
          suggestedName: parsed.suggestedName || (parsed.notFound ? 'Specimen Not Found' : 'Field Observation'),
          category: parsed.category || 'other',
          confidenceText: parsed.confidenceText || (parsed.notFound ? 'Not Found' : 'Field Observation'),
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : (parsed.notFound ? 0 : 0.85),
          characteristics: Array.isArray(parsed.characteristics) ? parsed.characteristics : [],
          natureFacts: Array.isArray(parsed.natureFacts) ? parsed.natureFacts : [],
          ecologicalContext: parsed.ecologicalContext || 'Integral component of local biodiversity.',
          safetyCaution: parsed.safetyCaution || undefined,
          suggestedFollowUp: parsed.suggestedFollowUp || undefined,
          source: 'gemini',
        };
      } catch (err: any) {
        lastError = err?.message || String(err);
        if (lastError.includes('404') && model !== modelsToTry[modelsToTry.length - 1]) {
          continue;
        }
        throw new Error(lastError);
      }
    }

    throw new Error(lastError || 'Gemini request failed.');
  }

  async identifyImage(file: File | Blob, imageUrl: string, imageBase64: string): Promise<import('../../types').IdentificationResult> {
    const fileName = (file as File).name || 'nature-photo.jpg';
    const response = await this.askNaturalist(`Identify this outdoor specimen photo: ${fileName}`, imageBase64);

    if (response.notFound) {
      return {
        id: crypto.randomUUID(),
        imageUrl,
        imageBlob: file,
        predictedLabel: 'Specimen Not Found / Unrecognized Image',
        confidence: 0,
        category: 'other',
        characteristics: [],
        natureFacts: [],
        source: 'gemini',
        modelName: 'Google Gemini Vision AI',
        warning: 'AI could not detect or confirm a wild outdoor specimen in this image.',
        createdAt: new Date(),
        notFound: true,
        error: response.error || 'The uploaded image does not contain a recognized outdoor plant, animal, bird, insect, or fungus.',
        ecologicalContext: response.ecologicalContext,
        suggestedFollowUp: response.suggestedFollowUp,
      };
    }

    return {
      id: crypto.randomUUID(),
      imageUrl,
      imageBlob: file,
      predictedLabel: response.suggestedName || 'Identified Nature Specimen',
      confidence: response.confidence ?? 0.88,
      category: response.category || 'plant',
      characteristics: response.characteristics,
      natureFacts: response.natureFacts && response.natureFacts.length > 0 ? response.natureFacts : [response.ecologicalContext],
      source: 'gemini',
      modelName: 'Google Gemini Vision AI',
      warning: response.safetyCaution || 'AI identification suggestion — always observe wildlife and plants with care.',
      createdAt: new Date(),
      notFound: false,
      ecologicalContext: response.ecologicalContext,
      suggestedFollowUp: response.suggestedFollowUp,
    };
  }
}

