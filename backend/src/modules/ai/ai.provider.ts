// Re-export from the multi-provider factory.
// This file exists so that ai.service.ts and any other consumer
// keep their original import path unchanged.
export { generateCompletion, getActiveModel } from "./providers";

