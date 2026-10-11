/**
 * MATA HATI - Gemini Client Gateway
 * PRD Rule 22: API key is NEVER in client bundle.
 * Client invokes /api/analyze serverless proxy, with seamless local fallback.
 */

import { DummyClaim, TriageResult } from '../types/matahati';
import { analyzeLocally } from '../services/localEngine';
import { validateAndSanitizeTriageResult } from '../services/validator';

export interface AnalyzeRequest {
  storyText: string;
  claim: DummyClaim;
  photoBase64?: string;
  sourceChannel?: string;
  inputBy?: string;
  forceDemoMode?: boolean;
}

export async function requestTriageAnalysis(req: AnalyzeRequest): Promise<TriageResult> {
  const { storyText, claim, photoBase64, sourceChannel, inputBy, forceDemoMode } = req;

  // If user requested explicit Demo Mode, use local engine directly
  if (forceDemoMode) {
    return analyzeLocally({ storyText, claim, sourceChannel, inputBy });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000); // 28 detik (Vercel: maxDuration 30)

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storyText,
        claim,
        photoBase64,
        sourceChannel,
        inputBy
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Server proxy /api/analyze returned non-200:', response.status, errText);
      // Fallback to local intelligence engine
      const fallback = analyzeLocally({ storyText, claim, sourceChannel, inputBy });
      fallback.processing_source = 'FALLBACK_DEMO';
      fallback.ai_interpretation = `[Mode Cadangan / Demo] ${fallback.ai_interpretation}`;
      return fallback;
    }

    const data = await response.json();
    if (data && data.triageResult) {
      const validation = validateAndSanitizeTriageResult(data.triageResult);
      validation.sanitizedResult.processing_source = validation.sanitizedResult.processing_source || 'GEMINI_SERVER_PROXY';
      return validation.sanitizedResult;
    }

    // If unexpected response shape, fallback safely
    const fallback = analyzeLocally({ storyText, claim, sourceChannel, inputBy });
    fallback.processing_source = 'FALLBACK_DEMO';
    return fallback;
  } catch (error) {
    console.warn('Network or proxy error calling /api/analyze. Falling back to local engine:', error);
    const fallback = analyzeLocally({ storyText, claim, sourceChannel, inputBy });
    fallback.processing_source = 'FALLBACK_DEMO';
    fallback.ai_interpretation = `[Mode Cadangan Offline] ${fallback.ai_interpretation}`;
    return fallback;
  }
}
