import type { AIProvider } from './ai-service';
import type { Mission, MissionGenerationParams } from '../../types';
import { sanitizeMissionFromAI, validateMission } from '../../utils/mission-validator';

const SYSTEM_PROMPT = `You are WildSense, an AI nature companion that creates outdoor exploration missions.
Generate a structured JSON mission based on the user's preferences.
The mission should be practical, safe, specific, and achievable for someone at the given difficulty level.

IMPORTANT RULES:
- Tasks must be real-world physical activities done outdoors
- Never suggest eating, tasting, or touching unknown plants, fungi, or animals
- Never suggest entering private property or restricted areas
- Keep tasks achievable within the specified time
- Include safety reminders for any potentially risky activities
- Be specific — not "look at a bird" but "find a comfortable spot and listen for two distinct bird sounds"

Respond with ONLY valid JSON matching this exact structure (no markdown, no code fences):
{
  "title": "string (creative, engaging mission title)",
  "description": "string (1-2 sentence overview)",
  "category": "string (the category provided)",
  "duration": number (minutes),
  "difficulty": "string (the difficulty provided)",
  "environment": "string (the environment provided)",
  "equipment": ["string array of items needed, empty array if none"],
  "tasks": ["string array of 3-5 specific outdoor tasks"],
  "observationTips": ["string array of 2-3 helpful observation tips"],
  "natureFacts": ["string array of 2-3 interesting real nature facts related to the category"],
  "reflectionQuestion": "string (a thoughtful question about the experience)",
  "safetyReminder": "string (optional safety note, null if not needed)"
}`;

function buildPrompt(params: MissionGenerationParams): string {
  const parts = [
    `Create an outdoor ${params.category} mission for a ${params.difficulty} explorer.`,
    `Duration: ${params.duration} minutes.`,
    `Environment: ${params.environment}.`,
  ];
  if (params.mood) parts.push(`Mood: ${params.mood}.`);
  if (params.interests?.length) parts.push(`Interests: ${params.interests.join(', ')}.`);
  return parts.join(' ');
}

export class OllamaProvider implements AIProvider {
  readonly name = 'Ollama (Local)';
  readonly isLocal = true;
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = '/ollama', model = 'gemma2:2b') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const models = data?.models || [];
      return models.some((m: { name: string }) =>
        m.name.toLowerCase().includes('gemma')
      );
    } catch {
      return false;
    }
  }

  async generateMission(params: MissionGenerationParams): Promise<Mission> {
    const startTime = performance.now();
    const userPrompt = buildPrompt(params);

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        format: 'json',
        options: {
          temperature: 0.7,
          num_predict: 1024,
        },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const latencyMs = Math.round(performance.now() - startTime);
    const content = data?.message?.content || '';

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Add params that the model might have omitted
    parsed.category = parsed.category || params.category;
    parsed.difficulty = parsed.difficulty || params.difficulty;
    parsed.environment = parsed.environment || params.environment;
    parsed.duration = parsed.duration || params.duration;
    parsed.mood = parsed.mood || params.mood;

    const mission = sanitizeMissionFromAI(parsed, `ollama/${this.model}`, latencyMs);
    const result = validateMission(mission);

    if (!result.success) {
      console.warn('Mission validation warnings:', result.error.issues);
      // Return the sanitized version anyway — it's safe
    }

    return mission;
  }
}
