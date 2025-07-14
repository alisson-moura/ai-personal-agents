import fs from 'node:fs';
import path from 'node:path';
import type { GenerateContentConfig } from '@google/genai';
import { createTransactionFunctionDeclaration } from './tools/create-transaction';
import { generateFinancialReportFunctionDeclaration } from './tools/generate-financial-report';

const prompt = fs.readFileSync(path.join(__dirname, 'prompt.txt'), 'utf-8');

export const config: GenerateContentConfig = {
  thinkingConfig: {
    thinkingBudget: 0,
  },
  systemInstruction: prompt,
  tools: [
    {
      functionDeclarations: [
        createTransactionFunctionDeclaration,
        generateFinancialReportFunctionDeclaration,
      ],
    },
  ],
};
