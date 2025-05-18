// 'use server';
/**
 * @fileOverview Generates a dramatic, Spanish-language recap of a basketball match.
 *
 * - generateDramaticRecap - A function that generates the recap.
 * - GenerateDramaticRecapInput - The input type for the generateDramaticRecap function.
 * - GenerateDramaticRecapOutput - The return type for the generateDramaticRecap function.
 */

'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDramaticRecapInputSchema = z.object({
  player1Name: z.string().describe('The name of the first player.'),
  player2Name: z.string().describe('The name of the second player.'),
  player1Score: z.number().describe('The score of the first player.'),
  player2Score: z.number().describe('The score of the second player.'),
});
export type GenerateDramaticRecapInput = z.infer<
  typeof GenerateDramaticRecapInputSchema
>;

const GenerateDramaticRecapOutputSchema = z.object({
  recap: z.string().describe('The dramatic, Spanish-language recap of the match.'),
});
export type GenerateDramaticRecapOutput = z.infer<
  typeof GenerateDramaticRecapOutputSchema
>;

export async function generateDramaticRecap(
  input: GenerateDramaticRecapInput
): Promise<GenerateDramaticRecapOutput> {
  return generateDramaticRecapFlow(input);
}

const generateDramaticRecapPrompt = ai.definePrompt({
  name: 'generateDramaticRecapPrompt',
  input: {schema: GenerateDramaticRecapInputSchema},
  output: {schema: GenerateDramaticRecapOutputSchema},
  prompt: `Eres un comentarista deportivo de la NBA muy dramático y estás relatando un partido de baloncesto 1 contra 1 entre amigos.  Genera un resumen dramático en español del siguiente partido:

Jugador 1: {{player1Name}}
Puntuación del jugador 1: {{player1Score}}
Jugador 2: {{player2Name}}
Puntuación del jugador 2: {{player2Score}}`,
});

const generateDramaticRecapFlow = ai.defineFlow(
  {
    name: 'generateDramaticRecapFlow',
    inputSchema: GenerateDramaticRecapInputSchema,
    outputSchema: GenerateDramaticRecapOutputSchema,
  },
  async input => {
    const {output} = await generateDramaticRecapPrompt(input);
    return output!;
  }
);
