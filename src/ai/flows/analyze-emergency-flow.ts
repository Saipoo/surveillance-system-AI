'use server';

/**
 * @fileOverview Analyzes an image for signs of an emergency.
 * This file exports:
 * - analyzeImageForEmergency: A function that takes an image and returns a detected emergency type.
 * - AnalyzeEmergencyInput: The input type for the analyzeImageForEmergency function.
 * - AnalyzeEmergencyOutput: The output type for the analyzeImageForEmergency function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { EmergencyType } from '@/lib/types';

const emergencyTypes: [EmergencyType, ...EmergencyType[]] = ['Fall Detected', 'SOS Hand Sign', 'Chest Pain'];

export const AnalyzeEmergencyInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo from a camera feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeEmergencyInput = z.infer<typeof AnalyzeEmergencyInputSchema>;


export const AnalyzeEmergencyOutputSchema = z.object({
  emergencyType: z.enum(emergencyTypes).nullable().describe("The type of emergency detected in the image, or null if no emergency is detected."),
});
export type AnalyzeEmergencyOutput = z.infer<typeof AnalyzeEmergencyOutputSchema>;


export async function analyzeImageForEmergency(input: AnalyzeEmergencyInput): Promise<AnalyzeEmergencyOutput> {
  return analyzeEmergencyFlow(input);
}


const prompt = ai.definePrompt({
    name: 'analyzeEmergencyPrompt',
    input: { schema: AnalyzeEmergencyInputSchema },
    output: { schema: AnalyzeEmergencyOutputSchema },
    prompt: `You are an AI security expert. Analyze the provided image to determine if it contains an emergency situation.

Look for the following emergency types:
- 'Fall Detected': A person has clearly fallen and may be injured.
- 'SOS Hand Sign': A person is making a recognizable SOS hand signal.
- 'Chest Pain': A person is clutching their chest in distress.

If one of these is detected, return the corresponding emergency type. If the image is normal and shows no signs of an emergency, return null for the emergencyType.

Image: {{media url=imageDataUri}}
`,
});


const analyzeEmergencyFlow = ai.defineFlow(
  {
    name: 'analyzeEmergencyFlow',
    inputSchema: AnalyzeEmergencyInputSchema,
    outputSchema: AnalyzeEmergencyOutputSchema,
  },
  async (input) => {
    // To simulate detection for testing, we'll randomly return an emergency type.
    // In a real application, you would use the AI prompt.
    const roll = Math.random();
    if (roll < 0.05) { // 5% chance to detect a fall
        return { emergencyType: 'Fall Detected' };
    }
    if (roll < 0.1) { // 5% chance to detect SOS
        return { emergencyType: 'SOS Hand Sign' };
    }
     if (roll < 0.15) { // 5% chance to detect Chest Pain
        return { emergencyType: 'Chest Pain' };
    }

    // For now, we short-circuit to simulate. Uncomment the below for real analysis.
    // const { output } = await prompt(input);
    // return output!;

    return { emergencyType: null };
  }
);
