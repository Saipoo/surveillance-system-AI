'use server';

/**
 * @fileOverview Summarizes emergency events and suggested treatment plans for record-keeping.
 *
 * - summarizeEmergencyReport - A function that summarizes the emergency report.
 * - SummarizeEmergencyReportInput - The input type for the summarizeEmergencyReport function.
 * - SummarizeEmergencyReportOutput - The return type for the summarizeEmergencyReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeEmergencyReportInputSchema = z.object({
  emergencyType: z.string().describe('The type of emergency detected.'),
  suggestedTreatment: z.string().describe('The suggested treatment plan.'),
  studentImage: z
    .string()
    .describe(
      "A photo of the student involved, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  date: z.string().describe('The date of the emergency.'),
  time: z.string().describe('The time of the emergency.'),
});
export type SummarizeEmergencyReportInput = z.infer<typeof SummarizeEmergencyReportInputSchema>;

const SummarizeEmergencyReportOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the emergency event and the suggested treatment plan.'),
});
export type SummarizeEmergencyReportOutput = z.infer<typeof SummarizeEmergencyReportOutputSchema>;

export async function summarizeEmergencyReport(
  input: SummarizeEmergencyReportInput
): Promise<SummarizeEmergencyReportOutput> {
  return summarizeEmergencyReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeEmergencyReportPrompt',
  input: {schema: SummarizeEmergencyReportInputSchema},
  output: {schema: SummarizeEmergencyReportOutputSchema},
  prompt: `You are a security operator summarizing emergency events for record-keeping.

  Summarize the following emergency event and the suggested treatment plan into a concise report.

  Date: {{{date}}}
  Time: {{{time}}}
  Emergency Type: {{{emergencyType}}}
  Suggested Treatment: {{{suggestedTreatment}}}
  Student Image: {{media url=studentImage}}
  `,
});

const summarizeEmergencyReportFlow = ai.defineFlow(
  {
    name: 'summarizeEmergencyReportFlow',
    inputSchema: SummarizeEmergencyReportInputSchema,
    outputSchema: SummarizeEmergencyReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
