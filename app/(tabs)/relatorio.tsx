import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getAllAgendamentos, getAllClientes, getAllProdutos, getAllVendas, getCaixaByPeriodo } from '@/services/database';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RelatorioData {
  titulo: string;
  valor: string;
  icone: string;
  cor: string;
}

interface AgendamentoDetalhado {
  id: number;
  cliente_nome: string;
  barbeiro_nome: string;
  data: string;
  hora: string;
  servico: string;
  status: string;
}

interface VendaDetalhada {
  id: number;
  produto_nome: string;
  quantidade: number;
  valor_total: number;
  data: string;
}

interface CaixaMovimento {
  id: number;
  tipo: string;
  descricao: string;
  valor: number;
  data: string;
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  aniversario: string;
  created_at: string;
}

export default function RelatorioScreen() {
  const [periodo, setPeriodo] = useState('hoje');
  const [loading, setLoading] = useState(true);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalAgendamentos, setTotalAgendamentos] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [receitaTotal, setReceitaTotal] = useState(0);
  const [agendamentos, setAgendamentos] = useState<AgendamentoDetalhado[]>([]);
  const [vendas, setVendas] = useState<VendaDetalhada[]>([]);
  const [movimentacoesCaixa, setMovimentacoesCaixa] = useState<CaixaMovimento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mostrarDetalhes, setMostrarDetalhes] = useState('');
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getDataHoje = () => {
    const hoje = new Date();
    return hoje.toISOString().split('T')[0];
  };

  const getDataPeriodo = () => {
    const hoje = new Date();
    let dataInicio = '';
    
    switch(periodo) {
      case 'hoje':
        dataInicio = hoje.toISOString().split('T')[0];
        break;
      case 'semana':
        const primeiroDiaSemana = new Date(hoje);
        primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay());
        dataInicio = primeiroDiaSemana.toISOString().split('T')[0];
        break;
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
    }
    
    return { dataInicio, dataFim: hoje.toISOString().split('T')[0] };
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar clientes
      const clientesData: any = await getAllClientes();
      const { dataInicio, dataFim } = getDataPeriodo();
      
      // Filtrar clientes por período de criação
      const clientesFiltrados = clientesData.filter((c: any) => {
        const dataCriacao = c.created_at ? c.created_at.split(' ')[0] : c.created_at;
        return dataCriacao >= dataInicio && dataCriacao <= dataFim;
      });
      
      setClientes(clientesFiltrados);
      setTotalClientes(clientesData.length);

      // Carregar produtos
      const produtosData: any = await getAllProdutos();
      setTotalProdutos(produtosData.length);

      // Carregar agendamentos
      const agendamentosData: any = await getAllAgendamentos();
      
      const agendamentosFiltrados = agendamentosData.filter((ag: any) => {
        return ag.data >= dataInicio && ag.data <= dataFim;
      });
      
      setAgendamentos(agendamentosFiltrados);
      setTotalAgendamentos(agendamentosFiltrados.length);

      // Carregar vendas
      const vendasData: any = await getAllVendas();
      const vendasFiltradas = vendasData.filter((v: any) => {
        return v.data >= dataInicio && v.data <= dataFim;
      });
      
      setVendas(vendasFiltradas);
      
      // Calcular receita total
      const receita = vendasFiltradas.reduce((acc: number, v: any) => acc + v.valor_total, 0);
      setReceitaTotal(receita);

      // Carregar movimentações do caixa
      const caixaData: any = await getCaixaByPeriodo(dataInicio, dataFim);
      setMovimentacoesCaixa(caixaData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do relatório');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [periodo]);

  const relatorios: RelatorioData[] = [
    {
      titulo: 'Total de Clientes',
      valor: totalClientes.toString(),
      icone: 'users',
      cor: colors.primary,
    },
    {
      titulo: 'Receita do Período',
      valor: `R$ ${receitaTotal.toFixed(2)}`,
      icone: 'dollar',
      cor: colors.success,
    },
    {
      titulo: 'Agendamentos',
      valor: totalAgendamentos.toString(),
      icone: 'calendar',
      cor: colors.warning,
    },
    {
      titulo: 'Produtos Cadastrados',
      valor: totalProdutos.toString(),
      icone: 'shopping-cart',
      cor: colors.danger,
    },
  ];

  const gerarRelatorio = (tipo: string) => {
    if (tipo === 'clientes') {
      setMostrarDetalhes(mostrarDetalhes === 'clientes' ? '' : 'clientes');
    } else if (tipo === 'vendas') {
      setMostrarDetalhes(mostrarDetalhes === 'vendas' ? '' : 'vendas');
    } else if (tipo === 'agendamentos') {
      setMostrarDetalhes(mostrarDetalhes === 'agendamentos' ? '' : 'agendamentos');
    } else if (tipo === 'financeiro') {
      setMostrarDetalhes(mostrarDetalhes === 'caixa' ? '' : 'caixa');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <FontAwesome name="bar-chart" size={30} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Relatórios</Text>
      </View>

      <View style={[styles.periodoContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.periodoLabel, { color: colors.text }]}>Período:</Text>
        <View style={styles.periodoButtons}>
          {['hoje', 'semana', 'mes', 'ano'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodoButton,
                periodo === p && { backgroundColor: colors.primary }
              ]}
              onPress={() => setPeriodo(p)}
            >
              <Text style={[
                styles.periodoButtonText,
                { color: periodo === p ? 'white' : colors.text }
              ]}>
                {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mês' : 'Ano'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Carregando dados...</Text>
        </View>
      ) : (
        <>
          <View style={styles.cardsContainer}>
            {relatorios.map((relatorio, index) => (
              <View
                key={index}
                style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              >
                <FontAwesome name={relatorio.icone as any} size={30} color={relatorio.cor} />
                <Text style={[styles.cardTitulo, { color: colors.text }]}>{relatorio.titulo}</Text>
                <Text style={[styles.cardValor, { color: relatorio.cor }]}>{relatorio.valor}</Text>
              </View>
            ))}
          </View>

          {/* Seção de Detalhes - Agendamentos */}
          <View style={[styles.detalhesContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.detalhesHeader}
              onPress={() => setMostrarDetalhes(mostrarDetalhes === 'agendamentos' ? '' : 'agendamentos')}
            >
              <Text style={[styles.detalhesTitle, { color: colors.text }]}>
                📅 Agendamentos ({agendamentos.length})
              </Text>
              <FontAwesome 
                name={mostrarDetalhes === 'agendamentos' ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={colors.text} 
              />
            </TouchableOpacity>
            
            {mostrarDetalhes === 'agendamentos' && (
              <View style={styles.detalhesConteudo}>
                {agendamentos.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.secondary }]}>
                    Nenhum agendamento neste período
                  </Text>
                ) : (
                  agendamentos.map((ag) => (
                    <View key={ag.id} style={[styles.itemDetalhe, { borderColor: colors.border }]}>
                      <Text style={[styles.itemTexto, { color: colors.text }]}>
                        <Text style={{ fontWeight: 'bold' }}>{ag.cliente_nome}</Text>
                      </Text>
                      <Text style={[styles.itemTexto, { color: colors.secondary }]}>
                        Barbeiro: {ag.barbeiro_nome}
                      </Text>
                      <Text style={[styles.itemTexto, { color: colors.secondary }]}>
                        {ag.data} às {ag.hora} - {ag.servico}
                      </Text>
                      <Text style={[styles.statusBadge, { 
                        backgroundColor: ag.status === 'Confirmado' ? colors.success : 
                                       ag.status === 'Pendente' ? colors.warning : colors.danger,
                        color: 'white'
                      }]}>
                        {ag.status}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Seção de Detalhes - Vendas */}
          <View style={[styles.detalhesContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.detalhesHeader}
              onPress={() => setMostrarDetalhes(mostrarDetalhes === 'vendas' ? '' : 'vendas')}
            >
              <Text style={[styles.detalhesTitle, { color: colors.text }]}>
                🛒 Vendas ({vendas.length})
              </Text>
              <FontAwesome 
                name={mostrarDetalhes === 'vendas' ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={colors.text} 
              />
            </TouchableOpacity>
            
            {mostrarDetalhes === 'vendas' && (
              <View style={styles.detalhesConteudo}>
                {vendas.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.secondary }]}>
                    Nenhuma venda neste período
                  </Text>
                ) : (
                  vendas.map((venda) => (
                    <View key={venda.id} style={[styles.itemDetalhe, { borderColor: colors.border }]}>
                      <Text style={[styles.itemTexto, { color: colors.text, fontWeight: 'bold' }]}>
                        {venda.produto_nome}
                      </Text>
                      <Text style={[styles.itemTexto, { color: colors.secondary }]}>
                        Quantidade: {venda.quantidade}
                      </Text>
                      <Text style={[styles.itemTexto, { color: colors.success, fontWeight: 'bold' }]}>
                        R$ {venda.valor_total.toFixed(2)}
                      </Text>
                      <Text style={[styles.itemTexto, { color: colors.secondary, fontSize: 12 }]}>
                        {venda.data}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Seção de Detalhes - Caixa */}
          <View style={[styles.detalhesContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.detalhesHeader}
              onPress={() => setMostrarDetalhes(mostrarDetalhes === 'caixa' ? '' : 'caixa')}
            >
              <Text style={[styles.detalhesTitle, { color: colors.text }]}>
                💰 Movimentações Caixa ({movimentacoesCaixa.length})
              </Text>
              <FontAwesome 
                name={mostrarDetalhes === 'caixa' ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={colors.text} 
              />
            </TouchableOpacity>
            
            {mostrarDetalhes === 'caixa' && (
              <View style={styles.detalhesConteudo}>
                {movimentacoesCaixa.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.secondary }]}>
                    Nenhuma movimentação neste período
                  </Text>
                ) : (
                  movimentacoesCaixa.map((mov) => (
                    <View key={mov.id} style={[styles.itemDetalhe, { borderColor: colors.border }]}>
                      <Text style={[styles.itemTexto, { 
                        color: mov.tipo === 'Entrada' ? colors.success : colors.danger,
                        fontWeight: 'bold'
                      }]}>
                        {mov.tipo === 'Entrada' ? '↑' : '↓'} {mov.tipo}
                      </Text>
                      <Text style={[styles.itemTexto, { color: colors.text }]}>
                        {mov.descricao}
                      </Text>
                      <Text style={[styles.itemTexto, { 
                        color: mov.tipo === 'Entrada' ? colors.success : colors.danger,
                        fontWeight: 'bold',
                        fontSize: 16
                      }]}>
                        R$ {mov.valor.toFixed(2)}
                      </Text>
                      <Text style={[styles.itemTexto, { color: colors.secondary, fontSize: 12 }]}>
                        {mov.data}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        </>
      )}

      <View style={styles.metricasContainer}>
        {relatorios.map((relatorio, index) => (
          <View key={index} style={[styles.metricaCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={[styles.metricaIcon, { backgroundColor: relatorio.cor }]}>
              <FontAwesome name={relatorio.icone as any} size={24} color="white" />
            </View>
            <View style={styles.metricaInfo}>
              <Text style={[styles.metricaValor, { color: colors.text }]}>{relatorio.valor}</Text>
              <Text style={[styles.metricaTitulo, { color: colors.secondary }]}>{relatorio.titulo}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.relatoriosContainer}>
        <Text style={[styles.subtitle, { color: colors.text }]}>Relatórios Disponíveis</Text>

        <TouchableOpacity
          style={[styles.relatorioButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => gerarRelatorio('vendas')}
        >
          <FontAwesome name="dollar" size={24} color={colors.primary} />
          <View style={styles.relatorioInfo}>
            <Text style={[styles.relatorioTitle, { color: colors.text }]}>Relatório de Vendas</Text>
            <Text style={[styles.relatorioDesc, { color: colors.success, fontWeight: 'bold' }]}>
              {vendas.length} vendas - R$ {receitaTotal.toFixed(2)}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.tabIconDefault} />
        </TouchableOpacity>

        {mostrarDetalhes === 'vendas' && vendas.length > 0 && (
          <View style={[styles.detalhesContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 10 }]}>
            <View style={styles.detalhesConteudo}>
              {vendas.map((venda) => (
                <View key={venda.id} style={[styles.itemDetalhe, { borderColor: colors.border }]}>
                  <Text style={[styles.itemTexto, { color: colors.text, fontWeight: 'bold' }]}>
                    {venda.produto_nome}
                  </Text>
                  <Text style={[styles.itemTexto, { color: colors.secondary }]}>
                    Quantidade: {venda.quantidade}
                  </Text>
                  <Text style={[styles.itemTexto, { color: colors.success, fontWeight: 'bold' }]}>
                    R$ {venda.valor_total.toFixed(2)}
                  </Text>
                  <Text style={[styles.itemTexto, { color: colors.secondary, fontSize: 12 }]}>
                    {new Date(venda.data).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.relatorioButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => gerarRelatorio('clientes')}
        >
          <FontAwesome name="users" size={24} color={colors.primary} />
          <View style={styles.relatorioInfo}>
            <Text style={[styles.relatorioTitle, { color: colors.text }]}>Relatório de Clientes</Text>
            <Text style={[styles.relatorioDesc, { color: colors.secondary }]}>
              {clientes.length} clientes cadastrados no período
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.tabIconDefault} />
        </TouchableOpacity>

        {mostrarDetalhes === 'clientes' && (
          <View style={[styles.detalhesContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 10 }]}>
            <View style={styles.detalhesConteudo}>
              {clientes.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.secondary }]}>
                  Nenhum cliente cadastrado neste período
                </Text>
              ) : (
                clientes.map((cliente) => (
                  <View key={cliente.id} style={[styles.itemDetalhe, { borderColor: colors.border }]}>
                    <Text style={[styles.itemTexto, { color: colors.text, fontWeight: 'bold', fontSize: 16 }]}>
                      {cliente.nome}
                    </Text>
                    <Text style={[styles.itemTexto, { color: colors.secondary }]}>
                      📱 {cliente.telefone}
                    </Text>
                    {cliente.aniversario && (
                      <Text style={[styles.itemTexto, { color: colors.secondary }]}>
                        🎂 {cliente.aniversario}
                      </Text>
                    )}
                    <Text style={[styles.itemTexto, { color: colors.secondary, fontSize: 12 }]}>
                      Cadastrado em: {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.relatorioButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => gerarRelatorio('agendamentos')}
        >
          <FontAwesome name="calendar" size={24} color={colors.primary} />
          <View style={styles.relatorioInfo}>
            <Text style={[styles.relatorioTitle, { color: colors.text }]}>Relatório de Agendamentos</Text>
            <Text style={[styles.relatorioDesc, { color: colors.secondary }]}>
              {agendamentos.length} agendamentos no período
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.tabIconDefault} />
        </TouchableOpacity>

        {mostrarDetalhes === 'agendamentos' && agendamentos.length > 0 && (
          <View style={[styles.detalhesContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 10 }]}>
            <View style={styles.detalhesConteudo}>
              {agendamentos.map((ag) => (
                <View key={ag.id} style={[styles.itemDetalhe, { borderColor: colors.border }]}>
                  <Text style={[styles.itemTexto, { color: colors.text }]}>
                    <Text style={{ fontWeight: 'bold' }}>{ag.cliente_nome}</Text>
                  </Text>
                  <Text style={[styles.itemTexto, { color: colors.secondary }]}>
                    Barbeiro: {ag.barbeiro_nome}
                  </Text>
                  <Text style={[styles.itemTexto, { color: colors.secondary }]}>
                    {new Date(ag.data).toLocaleDateString('pt-BR')} às {ag.hora} - {ag.servico}
                  </Text>
                  <Text style={[styles.statusBadge, { 
                    backgroundColor: ag.status === 'Confirmado' ? colors.success : 
                                   ag.status === 'Pendente' ? colors.warning : colors.danger,
                    color: 'white'
                  }]}>
                    {ag.status}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.relatorioButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => gerarRelatorio('financeiro')}
        >
          <FontAwesome name="line-chart" size={24} color={colors.primary} />
          <View style={styles.relatorioInfo}>
            <Text style={[styles.relatorioTitle, { color: colors.text }]}>Relatório Financeiro</Text>
            <Text style={[styles.relatorioDesc, { color: colors.secondary }]}>
              {movimentacoesCaixa.length} movimentações no período
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.tabIconDefault} />
        </TouchableOpacity>

        {mostrarDetalhes === 'caixa' && movimentacoesCaixa.length > 0 && (
          <View style={[styles.detalhesContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginTop: 10 }]}>
            <View style={styles.detalhesConteudo}>
              {movimentacoesCaixa.map((mov) => (
                <View key={mov.id} style={[styles.itemDetalhe, { borderColor: colors.border }]}>
                  <Text style={[styles.itemTexto, { 
                    color: mov.tipo === 'Entrada' ? colors.success : colors.danger,
                    fontWeight: 'bold'
                  }]}>
                    {mov.tipo === 'Entrada' ? '↑' : '↓'} {mov.tipo}
                  </Text>
                  <Text style={[styles.itemTexto, { color: colors.text }]}>
                    {mov.descricao}
                  </Text>
                  <Text style={[styles.itemTexto, { 
                    color: mov.tipo === 'Entrada' ? colors.success : colors.danger,
                    fontWeight: 'bold',
                    fontSize: 16
                  }]}>
                    R$ {mov.valor.toFixed(2)}
                  </Text>
                  <Text style={[styles.itemTexto, { color: colors.secondary, fontSize: 12 }]}>
                    {new Date(mov.data).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 20,
    borderRadius: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  periodoContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  periodoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  periodoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodoButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  periodoButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  cardsContainer: {
    margin: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitulo: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  cardValor: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  detalhesContainer: {
    margin: 20,
    marginTop: 0,
    borderRadius: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detalhesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  detalhesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detalhesConteudo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemDetalhe: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemTexto: {
    fontSize: 14,
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
  metricasContainer: {
    margin: 20,
  },
  metricaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricaIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  metricaInfo: {
    flex: 1,
  },
  metricaValor: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metricaTitulo: {
    fontSize: 14,
  },
  relatoriosContainer: {
    margin: 20,
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  relatorioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 10,
    borderRadius: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  relatorioInfo: {
    flex: 1,
    marginLeft: 15,
  },
  relatorioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  relatorioDesc: {
    fontSize: 14,
  },
});