// Compatibility shim for the duplicate source tree. Expo resolves @/data/* to
// src/data/*, where the OpenAI-only model configuration lives.
export * from '../src/data/ai-models';
