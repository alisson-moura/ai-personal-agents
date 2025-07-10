import { reset } from 'drizzle-seed';
import { db, pool } from '../index';
import { schema } from '../schema/index';

const defaultCategories = [
  // --- RECEITAS ---
  {
    name: 'Salário',
    type: 'income',
    description: 'Recebimento principal de salário ou pró-labore.',
    icon: 'Landmark',
    color: '#16a34a', // Verde
  },
  {
    name: 'Renda Extra',
    type: 'income',
    description: 'Valores de trabalhos freelancer, bicos, etc.',
    icon: 'TrendingUp',
    color: '#16a34a', // Verde
  },
  {
    name: 'Investimentos',
    type: 'income',
    description: 'Rendimentos de dividendos, juros ou venda de ativos.',
    icon: 'ChartLine',
    color: '#16a34a', // Verde
  },
  {
    name: 'Outras Receitas',
    type: 'income',
    description: 'Qualquer outra entrada de dinheiro (presentes, reembolsos).',
    icon: 'Gift',
    color: '#16a34a', // Verde
  },

  // --- DESPESAS ---
  {
    name: 'Moradia',
    type: 'expense',
    description: 'Despesas com aluguel ou financiamento da casa.',
    icon: 'House',
    color: '#ca8a04', // Amarelo Escuro
  },
  {
    name: 'Contas Essenciais',
    type: 'expense',
    description: 'Contas de água, luz, gás, internet e telefone.',
    icon: 'FileText',
    color: '#2563eb', // Azul
  },
  {
    name: 'Supermercado',
    type: 'expense',
    description: 'Compras de alimentos, bebidas e produtos de limpeza.',
    icon: 'ShoppingCart',
    color: '#db2777', // Rosa
  },
  {
    name: 'Restaurantes e Delivery',
    type: 'expense',
    description: 'Gastos com alimentação fora de casa e delivery.',
    icon: 'Utensils',
    color: '#ea580c', // Laranja
  },
  {
    name: 'Transporte',
    type: 'expense',
    description: 'Gastos com combustível, transporte público, apps, etc.',
    icon: 'Car',
    color: '#64748b', // Cinza
  },
  {
    name: 'Saúde',
    type: 'expense',
    description: 'Gastos com plano de saúde, farmácia, consultas.',
    icon: 'Stethoscope',
    color: '#0891b2', // Ciano
  },
  {
    name: 'Lazer',
    type: 'expense',
    description: 'Despesas com streaming, cinema, shows, hobbies, viagens.',
    icon: 'Film',
    color: '#7c3aed', // Roxo
  },
  {
    name: 'Compras Pessoais',
    type: 'expense',
    description: 'Gastos com roupas, eletrônicos, cosméticos, etc.',
    icon: 'Shirt',
    color: '#c026d3', // Fuchsia
  },
  {
    name: 'Educação',
    type: 'expense',
    description: 'Despesas com cursos, faculdade, livros, etc.',
    icon: 'BookOpen',
    color: '#1d4ed8', // Azul Escuro
  },
  {
    name: 'Outras Despesas',
    type: 'expense',
    description: 'Qualquer outra despesa não categorizada.',
    icon: 'Ellipsis',
    color: '#475569', // Cinza Escuro
  },
];

async function runSeed() {
  try {
    await reset(db, schema);
    await db.insert(schema.categories).values(defaultCategories);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Log de erro em desenvolvimento
    console.error(error);
  } finally {
    await pool.end();
  }
}

runSeed();
