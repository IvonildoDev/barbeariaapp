import * as SQLite from 'expo-sqlite';

// Abre/cria o banco de dados
const db = SQLite.openDatabaseSync('barbearia.db');

// Função para resetar o banco de dados (USAR APENAS EM DESENVOLVIMENTO)
export const resetDatabase = async () => {
  try {
    await db.execAsync(`DROP TABLE IF EXISTS clientes;`);
    await db.execAsync(`DROP TABLE IF EXISTS barbeiros;`);
    await db.execAsync(`DROP TABLE IF EXISTS agendamentos;`);
    await db.execAsync(`DROP TABLE IF EXISTS produtos;`);
    await db.execAsync(`DROP TABLE IF EXISTS vendas;`);
    await db.execAsync(`DROP TABLE IF EXISTS caixa;`);
    console.log('✅ Banco de dados resetado!');
    await initDatabase();
  } catch (error) {
    console.error('❌ Erro ao resetar banco de dados:', error);
    throw error;
  }
};

// Inicializa as tabelas
export const initDatabase = async () => {
  try {
    // Tabela de Clientes
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        telefone TEXT NOT NULL,
        aniversario TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Barbeiros
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS barbeiros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        especialidade TEXT,
        dias_trabalho TEXT,
        horario_inicio TEXT,
        horario_fim TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migração: Adicionar colunas novas na tabela barbeiros se não existirem
    try {
      await db.execAsync(`
        ALTER TABLE barbeiros ADD COLUMN dias_trabalho TEXT;
      `);
      console.log('✅ Coluna dias_trabalho adicionada');
    } catch (e) {
      // Coluna já existe, ignorar erro
    }

    try {
      await db.execAsync(`
        ALTER TABLE barbeiros ADD COLUMN horario_inicio TEXT;
      `);
      console.log('✅ Coluna horario_inicio adicionada');
    } catch (e) {
      // Coluna já existe, ignorar erro
    }

    try {
      await db.execAsync(`
        ALTER TABLE barbeiros ADD COLUMN horario_fim TEXT;
      `);
      console.log('✅ Coluna horario_fim adicionada');
    } catch (e) {
      // Coluna já existe, ignorar erro
    }

    // Tabela de Agendamentos
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        barbeiro_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        hora TEXT NOT NULL,
        servico TEXT NOT NULL,
        status TEXT DEFAULT 'Pendente',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id)
      );
    `);

    // Tabela de Produtos
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        preco REAL NOT NULL,
        estoque INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Vendas
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        produtos TEXT NOT NULL,
        total REAL NOT NULL,
        cliente TEXT,
        forma_pagamento TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migração: Adicionar colunas na tabela vendas se não existirem
    try {
      await db.execAsync(`ALTER TABLE vendas ADD COLUMN produtos TEXT;`);
      console.log('✅ Coluna produtos adicionada à tabela vendas');
    } catch (e) {
      // Coluna já existe
    }

    try {
      await db.execAsync(`ALTER TABLE vendas ADD COLUMN cliente TEXT;`);
      console.log('✅ Coluna cliente adicionada à tabela vendas');
    } catch (e) {
      // Coluna já existe
    }

    try {
      await db.execAsync(`ALTER TABLE vendas ADD COLUMN forma_pagamento TEXT;`);
      console.log('✅ Coluna forma_pagamento adicionada à tabela vendas');
    } catch (e) {
      // Coluna já existe
    }

    try {
      await db.execAsync(`ALTER TABLE vendas ADD COLUMN total REAL;`);
      console.log('✅ Coluna total adicionada à tabela vendas');
    } catch (e) {
      // Coluna já existe
    }

    // Migração: Recriar tabela vendas para remover produto_id e ajustar estrutura
    try {
      // Verificar se a coluna produto_id existe
      const tableInfo = await db.getAllAsync('PRAGMA table_info(vendas)');
      const hasProdutoId = tableInfo.some((col: any) => col.name === 'produto_id');
      
      if (hasProdutoId) {
        console.log('🔄 Recriando tabela vendas para remover produto_id...');
        
        // Criar tabela temporária com estrutura correta
        await db.execAsync(`
          CREATE TABLE vendas_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            produtos TEXT NOT NULL,
            total REAL NOT NULL,
            cliente TEXT,
            forma_pagamento TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Copiar dados da tabela antiga (se houver)
        await db.execAsync(`
          INSERT INTO vendas_new (id, data, produtos, total, cliente, forma_pagamento, created_at)
          SELECT id, data, produtos, total, cliente, forma_pagamento, created_at 
          FROM vendas 
          WHERE produtos IS NOT NULL;
        `);

        // Remover tabela antiga
        await db.execAsync('DROP TABLE vendas;');

        // Renomear nova tabela
        await db.execAsync('ALTER TABLE vendas_new RENAME TO vendas;');

        console.log('✅ Tabela vendas recriada com sucesso');
      }
    } catch (e) {
      console.log('Tabela vendas já está na estrutura correta ou erro na migração:', e);
    }

    // Migração: Adicionar coluna tipo na tabela produtos
    try {
      await db.execAsync(`ALTER TABLE produtos ADD COLUMN tipo TEXT DEFAULT 'produto';`);
      console.log('✅ Coluna tipo adicionada à tabela produtos');
    } catch (e) {
      // Coluna já existe
    }

    // Tabela de Caixa
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS caixa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        descricao TEXT,
        valor REAL NOT NULL,
        data TEXT NOT NULL,
        forma_pagamento TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migração: Adicionar coluna forma_pagamento na tabela caixa se não existir
    try {
      await db.execAsync(`ALTER TABLE caixa ADD COLUMN forma_pagamento TEXT;`);
      console.log('✅ Coluna forma_pagamento adicionada à tabela caixa');
    } catch (e) {
      // Coluna já existe
    }

    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
};

// ==================== CLIENTES ====================

export const insertCliente = async (nome: string, telefone: string, aniversario: string) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO clientes (nome, telefone, aniversario) VALUES (?, ?, ?)',
      [nome, telefone, aniversario]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Erro ao inserir cliente:', error);
    throw error;
  }
};

export const getAllClientes = async () => {
  try {
    const allRows = await db.getAllAsync('SELECT * FROM clientes ORDER BY nome');
    return allRows;
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    throw error;
  }
};

export const updateCliente = async (id: number, nome: string, telefone: string, aniversario: string) => {
  try {
    await db.runAsync(
      'UPDATE clientes SET nome = ?, telefone = ?, aniversario = ? WHERE id = ?',
      [nome, telefone, aniversario, id]
    );
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    throw error;
  }
};

export const deleteCliente = async (id: number) => {
  try {
    await db.runAsync('DELETE FROM clientes WHERE id = ?', [id]);
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    throw error;
  }
};

// ==================== BARBEIROS ====================

export const insertBarbeiro = async (
  nome: string, 
  especialidade: string, 
  dias_trabalho?: string, 
  horario_inicio?: string, 
  horario_fim?: string
) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO barbeiros (nome, especialidade, dias_trabalho, horario_inicio, horario_fim) VALUES (?, ?, ?, ?, ?)',
      [nome, especialidade, dias_trabalho || '', horario_inicio || '08:00', horario_fim || '18:00']
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Erro ao inserir barbeiro:', error);
    throw error;
  }
};

export const getAllBarbeiros = async () => {
  try {
    const allRows = await db.getAllAsync('SELECT * FROM barbeiros ORDER BY nome');
    return allRows;
  } catch (error) {
    console.error('Erro ao buscar barbeiros:', error);
    throw error;
  }
};

export const updateBarbeiro = async (
  id: number,
  nome: string,
  especialidade: string,
  dias_trabalho: string,
  horario_inicio: string,
  horario_fim: string
) => {
  try {
    await db.runAsync(
      'UPDATE barbeiros SET nome = ?, especialidade = ?, dias_trabalho = ?, horario_inicio = ?, horario_fim = ? WHERE id = ?',
      [nome, especialidade, dias_trabalho, horario_inicio, horario_fim, id]
    );
  } catch (error) {
    console.error('Erro ao atualizar barbeiro:', error);
    throw error;
  }
};

export const deleteBarbeiro = async (id: number) => {
  try {
    await db.runAsync('DELETE FROM barbeiros WHERE id = ?', [id]);
  } catch (error) {
    console.error('Erro ao deletar barbeiro:', error);
    throw error;
  }
};

// ==================== AGENDAMENTOS ====================

export const insertAgendamento = async (
  cliente_id: number,
  barbeiro_id: number,
  data: string,
  hora: string,
  servico: string,
  status: string
) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO agendamentos (cliente_id, barbeiro_id, data, hora, servico, status) VALUES (?, ?, ?, ?, ?, ?)',
      [cliente_id, barbeiro_id, data, hora, servico, status]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Erro ao inserir agendamento:', error);
    throw error;
  }
};

export const getAllAgendamentos = async () => {
  try {
    const allRows = await db.getAllAsync(`
      SELECT 
        a.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        b.nome as barbeiro_nome
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN barbeiros b ON a.barbeiro_id = b.id
      ORDER BY a.data DESC, a.hora DESC
    `);
    return allRows;
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw error;
  }
};

export const updateAgendamentoStatus = async (id: number, status: string) => {
  try {
    await db.runAsync('UPDATE agendamentos SET status = ? WHERE id = ?', [status, id]);
  } catch (error) {
    console.error('Erro ao atualizar status do agendamento:', error);
    throw error;
  }
};

export const deleteAgendamento = async (id: number) => {
  try {
    await db.runAsync('DELETE FROM agendamentos WHERE id = ?', [id]);
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    throw error;
  }
};

// ==================== PRODUTOS ====================

export const insertProduto = async (nome: string, descricao: string, preco: number, estoque: number, tipo: string = 'produto') => {
  try {
    const result = await db.runAsync(
      'INSERT INTO produtos (nome, descricao, preco, estoque, tipo) VALUES (?, ?, ?, ?, ?)',
      [nome, descricao, preco, estoque, tipo]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Erro ao inserir produto:', error);
    throw error;
  }
};

export const getAllProdutos = async () => {
  try {
    const allRows = await db.getAllAsync('SELECT * FROM produtos ORDER BY nome');
    return allRows;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};

export const updateProduto = async (id: number, nome: string, descricao: string, preco: number, estoque: number, tipo: string = 'produto') => {
  try {
    await db.runAsync(
      'UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ?, tipo = ? WHERE id = ?',
      [nome, descricao, preco, estoque, tipo, id]
    );
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    throw error;
  }
};

export const deleteProduto = async (id: number) => {
  try {
    await db.runAsync('DELETE FROM produtos WHERE id = ?', [id]);
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    throw error;
  }
};

// ==================== VENDAS ====================

export const insertVenda = async (data: string, produtos: string, total: number, cliente?: string, forma_pagamento?: string) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO vendas (data, produtos, total, cliente, forma_pagamento) VALUES (?, ?, ?, ?, ?)',
      [data, produtos, total, cliente || '', forma_pagamento || 'Dinheiro']
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Erro ao inserir venda:', error);
    throw error;
  }
};

export const getAllVendas = async () => {
  try {
    const allRows = await db.getAllAsync('SELECT * FROM vendas ORDER BY data DESC, created_at DESC');
    return allRows;
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    throw error;
  }
};

// ==================== CAIXA ====================

export const insertCaixa = async (data: string, tipo: string, descricao: string, valor: number, forma_pagamento: string) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO caixa (data, tipo, descricao, valor, forma_pagamento) VALUES (?, ?, ?, ?, ?)',
      [data, tipo, descricao, valor, forma_pagamento]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Erro ao inserir registro no caixa:', error);
    throw error;
  }
};

export const getAllCaixa = async () => {
  try {
    const allRows = await db.getAllAsync('SELECT * FROM caixa ORDER BY data DESC');
    return allRows;
  } catch (error) {
    console.error('Erro ao buscar registros do caixa:', error);
    throw error;
  }
};

export const getCaixaByPeriodo = async (dataInicio: string, dataFim: string) => {
  try {
    const allRows = await db.getAllAsync(
      'SELECT * FROM caixa WHERE data BETWEEN ? AND ? ORDER BY data DESC',
      [dataInicio, dataFim]
    );
    return allRows;
  } catch (error) {
    console.error('Erro ao buscar registros do caixa por período:', error);
    throw error;
  }
};

export default db;
