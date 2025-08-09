import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-emergency-flow.ts';
import '@/ai/flows/provide-contextual-help.ts';