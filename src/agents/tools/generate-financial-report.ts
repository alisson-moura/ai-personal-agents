import { Type } from '@google/genai';
// biome-ignore lint/performance/noNamespaceImport: a lib precisa ser importada assim
import * as chrono from 'chrono-node';
import { and, between, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../database';
import { schema } from '../../database/schema';

export const generateFinancialReportFunctionDeclaration = {
  name: 'generate_financial_report',
  description:
    'Gera um relatório financeiro detalhado para um período específico, resumindo receitas, despesas, saldo final e um detalhamento dos gastos por categoria. Use esta função quando o usuário pedir por um resumo, balanço ou relatório de suas finanças.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      period: {
        type: Type.STRING,
        description: `O período de tempo para o qual o relatório deve ser gerado, em linguagem natural (em pt-BR). O modelo deve extrair essa informação da conversa. Exemplos: "este mês", "mês passado", "últimos 7 dias", "este ano", "de 1 de janeiro até hoje". Se o usuário não especificar, não preencha este campo.`,
      },
    },
    required: [],
  },
};

export const generateFinancialReportInput = z.object({
  period: z.string().optional(),
});

export async function generate_financial_report(
  params: z.infer<typeof generateFinancialReportInput>
) {
  try {
    const data = generateFinancialReportInput.parse(params);

    let startDate: Date;
    let endDate: Date = new Date();

    if (data.period) {
      const parsedDate = chrono.pt.parse(data.period, new Date());
      if (parsedDate.length > 0) {
        startDate = parsedDate[0].start.date();
        if (parsedDate[0].end) {
          endDate = parsedDate[0].end.date();
        } else {
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
        }
      } else {
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      }
    } else {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    }

    const startDateISO = startDate.toISOString().slice(0, 10);
    const endDateISO = endDate.toISOString().slice(0, 10);

    const aggregations = db
      .select({
        totalIncome:
          sql<number>`SUM(CASE WHEN ${schema.transactions.type} = 'income' THEN ${schema.transactions.amountInCents} ELSE 0 END)`.mapWith(
            Number
          ),
        totalExpenses:
          sql<number>`SUM(CASE WHEN ${schema.transactions.type} = 'expense' THEN ${schema.transactions.amountInCents} ELSE 0 END)`.mapWith(
            Number
          ),
        transactionCount: sql<number>`COUNT(*)::int`,
      })
      .from(schema.transactions)
      .where(
        between(schema.transactions.transactionDate, startDateISO, endDateISO)
      );

    const expensesByCategoryQuery = db
      .select({
        category: schema.categories.name,
        icon: schema.categories.icon,
        color: schema.categories.color,
        total: sql<number>`SUM(${schema.transactions.amountInCents})`.mapWith(
          Number
        ),
      })
      .from(schema.transactions)
      .leftJoin(
        schema.categories,
        eq(schema.transactions.categoryId, schema.categories.id)
      )
      .where(
        and(
          between(
            schema.transactions.transactionDate,
            startDateISO,
            endDateISO
          ),
          eq(schema.transactions.type, 'expense')
        )
      )
      .groupBy(
        schema.categories.name,
        schema.categories.icon,
        schema.categories.color
      );

    const [aggregatedResult, expensesByCategory] = await Promise.all([
      aggregations,
      expensesByCategoryQuery,
    ]);

    const { totalIncome, totalExpenses, transactionCount } =
      aggregatedResult[0];
    const balance = totalIncome - totalExpenses;

    return {
      success: true,
      message: 'Relatório financeiro gerado com sucesso.',
      data: {
        period: {
          start: startDate.toLocaleDateString('pt-BR'),
          end: endDate.toLocaleDateString('pt-BR'),
        },
        summary: {
          totalIncome,
          totalExpenses,
          balance,
          transactionCount,
        },
        expensesByCategory: expensesByCategory.map((item) => ({
          ...item,
          percentage:
            totalExpenses > 0
              ? `${((item.total / totalExpenses) * 100).toFixed(2)}%`
              : '0.00%',
        })),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Ocorreu um erro ao gerar o relatório financeiro.',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
