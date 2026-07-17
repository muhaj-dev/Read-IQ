// Expo resolves @/lib/* to src/lib/*. This shim keeps the duplicate teaching
// source tree compiling while the app uses the OpenAI proxy implementation.
export * from '../src/lib/ai';
