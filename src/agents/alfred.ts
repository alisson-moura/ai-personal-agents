import {
  type Content,
  type FunctionCall,
  type FunctionResponse,
  GoogleGenAI,
} from '@google/genai';
import { config } from './config';
import {
  create_transaction,
  createTransactionInput,
} from './tools/create-transaction';

interface AgentState {
  contents: Content[];
  maxIterations: number;
  currentIteration: number;
  isComplete: boolean;
}

const TOOL_REGISTRY = {
  create_transaction: {
    handler: create_transaction,
    inputParser: createTransactionInput,
  },
} as const;

export class AlfredAgent {
  private genAI: GoogleGenAI;
  private readonly MAX_ITERATIONS = 5;

  constructor() {
    this.genAI = new GoogleGenAI({});
  }

  /**
   * Executa o agente seguindo o padrão ReAct
   * @param request - Solicitação inicial do usuário
   * @returns Resposta final do agente
   */
  async execute(request: string): Promise<string> {
    const state: AgentState = {
      contents: [{ role: 'user', parts: [{ text: request }] }],
      maxIterations: this.MAX_ITERATIONS,
      currentIteration: 0,
      isComplete: false,
    };

    try {
      while (
        !state.isComplete &&
        state.currentIteration < state.maxIterations
      ) {
        state.currentIteration++;

        // biome-ignore lint/nursery/noAwaitInLoop: loop para executar API do gemini
        const interaction = await this.generateResponse(state.contents);

        if (interaction.functionCalls && interaction.functionCalls.length > 0) {
          const toolResults = await this.executeTools(
            interaction.functionCalls
          );

          if (interaction.candidates?.[0]?.content) {
            state.contents.push(interaction.candidates[0].content);
          }

          for (const toolResult of toolResults) {
            state.contents.push({
              role: 'user',
              parts: [{ functionResponse: toolResult }],
            });
          }
        } else {
          state.isComplete = true;
          return interaction.text ?? this.getDefaultResponse();
        }
      }

      if (state.currentIteration >= state.maxIterations) {
        return this.handleMaxIterationsReached(state);
      }

      return this.getDefaultResponse();
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async generateResponse(contents: Content[]) {
    return await this.genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      config,
      contents,
    });
  }

  /**
   * Executa ferramentas baseadas nas chamadas de função
   */
  private async executeTools(
    functionCalls: FunctionCall[]
  ): Promise<FunctionResponse[]> {
    const toolResults: FunctionResponse[] = [];

    for (const functionCall of functionCalls) {
      // biome-ignore lint/nursery/noAwaitInLoop: execução das ferramentas
      const toolResult = await this.executeSingleTool(functionCall);
      toolResults.push(toolResult);
    }

    return toolResults;
  }

  private async executeSingleTool(
    functionCall: FunctionCall
  ): Promise<FunctionResponse> {
    try {
      const toolName = functionCall.name;
      const tool = TOOL_REGISTRY[toolName as keyof typeof TOOL_REGISTRY];

      if (!tool) {
        return {
          name: functionCall.name,
          response: {
            success: false,
            error: `Ferramenta '${toolName}' não encontrada`,
          },
        };
      }

      const validatedArgs = tool.inputParser.parse(functionCall.args);
      const result = await tool.handler(validatedArgs);

      return {
        name: functionCall.name,
        response: { result },
      };
    } catch (error) {
      return {
        name: functionCall.name,
        response: {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      };
    }
  }

  private async handleMaxIterationsReached(state: AgentState): Promise<string> {
    state.contents.push({
      role: 'user',
      parts: [
        {
          text: 'Por favor, forneça uma resposta final baseada nas informações coletadas até agora.',
        },
      ],
    });

    const finalResponse = await this.generateResponse(state.contents);
    return (
      finalResponse.text ??
      'Não foi possível completar a tarefa no tempo esperado.'
    );
  }

  private handleError(error: unknown): string {
    if (error instanceof Error) {
      return `Desculpe, ocorreu um erro: ${error.message}`;
    }

    return 'Desculpe, ocorreu um erro inesperado. Tente novamente.';
  }

  private getDefaultResponse(): string {
    return 'Não encontrei nenhuma ferramenta específica para te ajudar com essa solicitação, mas posso tentar responder baseado no meu conhecimento.';
  }
}

export async function executeAlfredAgent(request: string): Promise<string> {
  const agent = new AlfredAgent();
  return await agent.execute(request);
}
