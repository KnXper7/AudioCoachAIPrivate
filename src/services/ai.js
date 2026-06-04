// ai.js — single source of truth for the app's AI service.
// Screens import { aiService } from './ai'. There is no mock/offline fallback:
// the app always uses the real Gemini-backed coach, and surfaces an error if it
// can't be reached.
export { aiService } from './realAiService.gemini';
