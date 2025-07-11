import { Type } from '@google/genai';
// biome-ignore lint/performance/noNamespaceImport: a lib precisa ser importada assim
import * as chrono from 'chrono-node';
import { eq } from 'drizzle-orm';
import z from 'zod/v4';
import { db } from '../../database';
import { schema } from '../../database/schema';
import { defaultCategories } from '../../database/seed';

export const createTransactionFunctionDeclaration = {
  name: 'create_transaction',
  description:
    'Processa e registra uma transação financeira automaticamente no sistema. Esta função deve ser executada imediatamente após processar os dados de entrada da transação.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: `Categoria que melhor classifica a transação baseada na descrição fornecida. Deve ser uma das opções válidas: ${JSON.stringify(defaultCategories)}. Use inferência semântica para mapear descrições às categorias apropriadas.`,
      },
      type: {
        type: Type.STRING,
        description:
          "Tipo da transação: 'income' para receitas/entradas (salário, vendas, recebimentos) ou 'expense' para despesas/saídas (compras, pagamentos, gastos). Infira automaticamente baseado no contexto.",
        enum: ['income', 'expense'],
      },
      amount: {
        type: Type.INTEGER,
        description:
          'Valor em centavos (número inteiro). Converta automaticamente valores em reais multiplicando por 100. Exemplos: R$ 45,50 → 4550, R$ 100,00 → 10000, R$ 7,99 → 799.',
      },
      description: {
        type: Type.STRING,
        description: `Descrição clara da transação extraída ou inferida dos dados fornecidos. Use as informações disponíveis para criar uma descrição útil e identificável.
          Exemplos:
          'Hoje',
          'Ontem',
          'Amanhã',
          'Sexta-feira passada',
          '5 dias atrás',
          'daqui a 2 semanas',
          'Nesta sexta às 14h30',
          '1 de janeiro de 2026'
          `,
      },
      paymentMethod: {
        type: Type.STRING,
        description:
          "Método de pagamento usado na transação. Opções: 'pix', 'credit_card', 'debit_card', 'cash', 'bank_transfer', 'other'. Se não especificado claramente, use 'other' como fallback.",
        enum: [
          'pix',
          'credit_card',
          'debit_card',
          'cash',
          'bank_transfer',
          'other',
        ],
      },
      transactionDate: {
        type: Type.STRING,
        description:
          "A data da transação em linguagem natural em pt-br, como 'hoje', 'ontem', '15 de julho', '2 dias atrás'. Se o usuário não mencionar uma data, não preencha este campo.",
      },
    },
    required: ['category', 'type', 'amount', 'description', 'paymentMethod'],
  },
};

export const createTransactionInput = z.object({
  amount: z.number().int().positive(),
  description: z.string().min(1),
  paymentMethod: z.enum(schema.paymentMethodEnum.enumValues),
  transactionDate: z.string().optional(),
  type: z.enum(schema.transactionTypeEnum.enumValues),
  category: z.string(),
});

export async function create_transaction(
  params: z.infer<typeof createTransactionInput>
) {
  try {
    const data = createTransactionInput.parse(params);
    let transactionDate: Date;

    if (data.transactionDate) {
      const date = chrono.pt.parseDate(data.transactionDate, new Date());
      if (date) {
        transactionDate = date;
      } else {
        transactionDate = new Date();
      }
    } else {
      transactionDate = new Date();
    }

    const category = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.name, params.category.trim()));

    const categoryId = category[0].id;

    if (!categoryId) {
      return {
        success: false,
        message: 'Erro ao salvar transação.',
        error: `Categoria informada é inválida: ${params.category}`,
      };
    }

    const result = await db
      .insert(schema.transactions)
      .values({
        amountInCents: data.amount,
        description: data.description,
        paymentMethod: data.paymentMethod,
        transactionDate: transactionDate.toISOString(),
        categoryId,
        type: data.type,
      })
      .returning();

    return {
      success: true,
      message: 'Transação salva com sucesso.',
      data: result[0],
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao salvar transação.',
      error,
    };
  }
}
