// This is a server-side file.
'use server';

/**
 * @fileOverview Provides contextual help based on the current feature being used.
 * This file exports:
 * - `getContextualHelp`: A function that retrieves contextual help for a given feature.
 * - `ContextualHelpInput`: The input type for the `getContextualHelp` function.
 * - `ContextualHelpOutput`: The output type for the `getContextualHelp` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextualHelpInputSchema = z.object({
  featureName: z
    .string() // e.g., 'Uniform Detection System'
    .describe('The name of the feature for which help is requested.'),
});
export type ContextualHelpInput = z.infer<typeof ContextualHelpInputSchema>;

const ContextualHelpOutputSchema = z.object({
  helpText: z
    .string()
    .describe('The contextual help text for the specified feature.'),
});
export type ContextualHelpOutput = z.infer<typeof ContextualHelpOutputSchema>;

export async function getContextualHelp(input: ContextualHelpInput): Promise<ContextualHelpOutput> {
  return contextualHelpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contextualHelpPrompt',
  input: {schema: ContextualHelpInputSchema},
  output: {schema: ContextualHelpOutputSchema},
  prompt: `You are a chatbot assistant providing contextual help for the GuardianEye application.

  A user is currently using the '{{featureName}}' feature and has requested help.

  Provide a concise and informative explanation of how to use the feature, including its purpose and key functionalities.
  Keep the explanation brief and easy to understand for a new user.
  Return only the help text. Do not include any introductory or concluding remarks.

  Here's the contextual help for the '{{featureName}}' feature:
  `,
});

const contextualHelpFlow = ai.defineFlow(
  {
    name: 'contextualHelpFlow',
    inputSchema: ContextualHelpInputSchema,
    outputSchema: ContextualHelpOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
