import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getAllClientes, getAllProdutos, insertCaixa, insertVenda, updateProduto } from '@/services/database';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  aniversario: string;
}

interface ProdutoServico {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  estoque?: number;
  tipo?: 'produto' | 'servico';
}

interface ItemConsumo {
  id: number;
  produto: ProdutoServico;
  quantidade: number;
  subtotal: number;
}

export default function CaixaScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtosServicos, setProdutosServicos] = useState<ProdutoServico[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [mostrarBuscaCliente, setMostrarBuscaCliente] = useState(false);
  const [itensConsumo, setItensConsumo] = useState<ItemConsumo[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<'Dinheiro' | 'PIX' | 'Crédito' | 'Débito'>('Dinheiro');
  const [cupomModalVisible, setCupomModalVisible] = useState(false);
  const [ultimaVenda, setUltimaVenda] = useState<any>(null);
  const cupomRef = useRef(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const clientesDB = await getAllClientes();
      setClientes(clientesDB as Cliente[]);
      
      const produtosDB = await getAllProdutos();
      setProdutosServicos(produtosDB as ProdutoServico[]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) ||
    c.telefone.includes(buscaCliente)
  );

  const produtosFiltrados = produtosServicos.filter(p =>
    p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
    p.descricao.toLowerCase().includes(buscaProduto.toLowerCase())
  );

  const adicionarItem = (produto: ProdutoServico) => {
    // Verificar estoque apenas para produtos (serviços têm estoque 0 ou undefined)
    if (produto.tipo === 'produto' && produto.estoque !== undefined && produto.estoque <= 0) {
      Alert.alert('Estoque Insuficiente', 'Este produto não possui estoque disponível');
      return;
    }

    const itemExistente = itensConsumo.find(item => item.produto.id === produto.id);

    if (itemExistente) {
      // Verificar estoque apenas para produtos
      if (produto.tipo === 'produto' && produto.estoque !== undefined && itemExistente.quantidade + 1 > produto.estoque) {
        Alert.alert('Estoque Insuficiente', `Apenas ${produto.estoque} unidades disponíveis`);
        return;
      }
      setItensConsumo(itensConsumo.map(item =>
        item.produto.id === produto.id
          ? {
              ...item,
              quantidade: item.quantidade + 1,
              subtotal: (item.quantidade + 1) * produto.preco
            }
          : item
      ));
    } else {
      const novoItem: ItemConsumo = {
        id: Date.now(),
        produto,
        quantidade: 1,
        subtotal: produto.preco
      };
      setItensConsumo([...itensConsumo, novoItem]);
    }
  };

  const removerItem = (id: number) => {
    setItensConsumo(itensConsumo.filter(item => item.id !== id));
  };

  const alterarQuantidade = (id: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItem(id);
      return;
    }

    setItensConsumo(itensConsumo.map(item => {
      if (item.id === id) {
        // Verificar estoque apenas para produtos
        if (item.produto.tipo === 'produto' && item.produto.estoque !== undefined && novaQuantidade > item.produto.estoque) {
          Alert.alert('Estoque Insuficiente', `Apenas ${item.produto.estoque} unidades disponíveis`);
          return item;
        }
        
        return {
          ...item,
          quantidade: novaQuantidade,
          subtotal: novaQuantidade * item.produto.preco
        };
      }
      return item;
    }));
  };

  const calcularTotal = () => {
    return itensConsumo.reduce((total, item) => total + item.subtotal, 0);
  };

  const gerarNumeroCupom = () => {
    return `${Date.now()}`.slice(-8);
  };

  const fecharVenda = async () => {
    if (itensConsumo.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos um item');
      return;
    }

    if (!clienteSelecionado) {
      Alert.alert('Erro', 'Selecione um cliente');
      return;
    }

    try {
      const produtosVendidos = itensConsumo.map(item => 
        `${item.produto.nome} (${item.quantidade}x)`
      ).join(', ');

      const total = calcularTotal();

      // Registrar venda
      await insertVenda(
        new Date().toISOString().split('T')[0],
        produtosVendidos,
        total,
        clienteSelecionado.nome,
        formaPagamento
      );

      // Registrar no caixa como entrada
      await insertCaixa(
        new Date().toISOString().split('T')[0],
        'Entrada',
        `Venda para ${clienteSelecionado.nome}`,
        total,
        formaPagamento
      );

      // Atualizar estoque apenas dos produtos (não dos serviços)
      for (const item of itensConsumo) {
        if (item.produto.tipo === 'produto' && item.produto.estoque !== undefined) {
          const novoEstoque = item.produto.estoque - item.quantidade;
          await updateProduto(
            item.produto.id,
            item.produto.nome,
            item.produto.descricao || '',
            item.produto.preco,
            novoEstoque,
            item.produto.tipo || 'produto'
          );
        }
      }

      // Preparar dados para cupom
      setUltimaVenda({
        numeroCupom: gerarNumeroCupom(),
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR'),
        cliente: clienteSelecionado.nome,
        itens: itensConsumo,
        total: total,
        formaPagamento: formaPagamento
      });

      await carregarDados();
      
      // Limpar formulário
      setItensConsumo([]);
      setClienteSelecionado(null);
      setBuscaCliente('');
      setFormaPagamento('Dinheiro');

      // Mostrar cupom
      setCupomModalVisible(true);
    } catch (error) {
      console.error('Erro ao fechar venda:', error);
      Alert.alert('Erro', 'Não foi possível finalizar a venda');
    }
  };

  const compartilharCupom = async () => {
    try {
      const uri = await captureRef(cupomRef, {
        format: 'png',
        quality: 1,
      });

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Erro ao compartilhar cupom:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar o cupom');
    }
  };

  const imprimirCupom = async () => {
    if (!ultimaVenda) return;
    
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
              .title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 5px; }
              .empresa { text-align: center; font-size: 14px; margin-bottom: 10px; }
              .divisor { border-top: 1px dashed #000; margin: 10px 0; }
              .info { font-size: 12px; margin: 3px 0; }
              .section-title { font-size: 12px; font-weight: bold; margin: 10px 0 5px; }
              .item { font-size: 11px; margin: 5px 0; }
              .item-nome { font-weight: bold; }
              .item-detalhe { color: #666; }
              .total { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 10px 0; }
              .pagamento { font-size: 12px; text-align: center; }
              .rodape { text-align: center; font-size: 11px; margin-top: 15px; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="title">CUPOM FISCAL</div>
            <div class="empresa">Barbearia App</div>
            <div class="divisor"></div>
            <div class="info">Cupom Nº: ${ultimaVenda.numeroCupom}</div>
            <div class="info">Data: ${ultimaVenda.data} - ${ultimaVenda.hora}</div>
            <div class="info">Cliente: ${ultimaVenda.cliente}</div>
            <div class="divisor"></div>
            <div class="section-title">ITENS</div>
            ${ultimaVenda.itens.map((item: ItemConsumo) => `
              <div class="item">
                <div class="item-nome">${item.produto.nome}</div>
                <div class="item-detalhe">${item.quantidade} x R$ ${item.produto.preco.toFixed(2).replace('.', ',')}</div>
                <div>R$ ${item.subtotal.toFixed(2).replace('.', ',')}</div>
              </div>
            `).join('')}
            <div class="divisor"></div>
            <div class="total">
              <span>TOTAL:</span>
              <span>R$ ${ultimaVenda.total.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="pagamento">Forma de Pagamento: ${ultimaVenda.formaPagamento}</div>
            <div class="divisor"></div>
            <div class="rodape">Obrigado pela preferência!</div>
          </body>
        </html>
      `;
      
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      console.error('Erro ao imprimir cupom:', error);
      Alert.alert('Erro', 'Não foi possível imprimir o cupom');
    }
  };

  const limparItens = () => {
    Alert.alert(
      'Limpar Itens',
      'Tem certeza que deseja limpar todos os itens?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: () => setItensConsumo([]) },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <FontAwesome name="money" size={30} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Caixa - PDV</Text>
      </View>

      {/* Busca de Cliente */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <FontAwesome name="user" size={18} color={colors.primary} /> Cliente
        </Text>
        
        {!clienteSelecionado ? (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
              placeholder="Buscar cliente por nome ou telefone..."
              placeholderTextColor={colors.secondary}
              value={buscaCliente}
              onChangeText={(text) => {
                setBuscaCliente(text);
                setMostrarBuscaCliente(text.length > 0);
              }}
            />
            {mostrarBuscaCliente && buscaCliente.length > 0 && (
              <View style={[styles.buscaResultados, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map((cliente) => (
                    <TouchableOpacity
                      key={cliente.id}
                      style={[styles.clienteItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setClienteSelecionado(cliente);
                        setBuscaCliente('');
                        setMostrarBuscaCliente(false);
                      }}
                    >
                      <FontAwesome name="user-circle" size={24} color={colors.primary} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.clienteNome, { color: colors.text }]}>{cliente.nome}</Text>
                        <Text style={[styles.clienteTelefone, { color: colors.secondary }]}>{cliente.telefone}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={[styles.semResultados, { color: colors.secondary }]}>Nenhum cliente encontrado</Text>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={[styles.clienteCard, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}>
            <FontAwesome name="user-circle" size={40} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.clienteNomeSelecionado, { color: colors.text }]}>{clienteSelecionado.nome}</Text>
              <Text style={[styles.clienteTelefone, { color: colors.secondary }]}>{clienteSelecionado.telefone}</Text>
            </View>
            <TouchableOpacity onPress={() => setClienteSelecionado(null)}>
              <FontAwesome name="times-circle" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Adicionar Produtos/Serviços */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <FontAwesome name="search" size={18} color={colors.primary} /> Adicionar Produtos/Serviços
        </Text>
        
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
          placeholder="Buscar produto ou serviço..."
          placeholderTextColor={colors.secondary}
          value={buscaProduto}
          onChangeText={setBuscaProduto}
        />

        <View style={styles.produtosList}>
          {produtosFiltrados.map((produto) => (
            <TouchableOpacity
              key={produto.id}
              style={[styles.produtoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => adicionarItem(produto)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.produtoNome, { color: colors.text }]}>{produto.nome}</Text>
                <Text style={[styles.produtoDescricao, { color: colors.secondary }]}>{produto.descricao}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                  <Text style={[styles.produtoValor, { color: colors.primary }]}>
                    R$ {produto.preco.toFixed(2).replace('.', ',')}
                  </Text>
                  {produto.estoque !== undefined && (
                    <Text style={[styles.estoqueText, { 
                      color: produto.estoque > 0 ? colors.success : colors.danger,
                      marginLeft: 10
                    }]}>
                      {produto.estoque > 0 ? `Estoque: ${produto.estoque}` : 'Sem estoque'}
                    </Text>
                  )}
                </View>
              </View>
              <FontAwesome name="plus-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Lista de Consumo */}
      {itensConsumo.length > 0 && (
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <FontAwesome name="list" size={18} color={colors.primary} /> Itens ({itensConsumo.length})
            </Text>
            <TouchableOpacity onPress={limparItens}>
              <Text style={[{ color: colors.danger, fontSize: 14 }]}>
                <FontAwesome name="trash" size={14} /> Limpar
              </Text>
            </TouchableOpacity>
          </View>

          {itensConsumo.map((item) => (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemNome, { color: colors.text }]}>{item.produto.nome}</Text>
                <Text style={[styles.itemValor, { color: colors.secondary }]}>
                  R$ {item.produto.preco.toFixed(2).replace('.', ',')} x {item.quantidade}
                </Text>
                <Text style={[styles.itemSubtotal, { color: colors.primary, fontWeight: 'bold', marginTop: 5 }]}>
                  Subtotal: R$ {item.subtotal.toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View style={styles.itemControles}>
                <TouchableOpacity
                  style={[styles.quantidadeButton, { backgroundColor: colors.secondary }]}
                  onPress={() => alterarQuantidade(item.id, item.quantidade - 1)}
                >
                  <MaterialIcons name="remove" size={18} color="white" />
                </TouchableOpacity>
                <Text style={[styles.quantidadeText, { color: colors.text }]}>{item.quantidade}</Text>
                <TouchableOpacity
                  style={[styles.quantidadeButton, { backgroundColor: colors.primary }]}
                  onPress={() => alterarQuantidade(item.id, item.quantidade + 1)}
                >
                  <MaterialIcons name="add" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: colors.danger, marginLeft: 10 }]}
                  onPress={() => removerItem(item.id)}
                >
                  <MaterialIcons name="delete" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Forma de Pagamento */}
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 10 }]}>
              <FontAwesome name="credit-card" size={18} color={colors.primary} /> Forma de Pagamento
            </Text>
            <View style={styles.formasPagamento}>
              {(['Dinheiro', 'PIX', 'Crédito', 'Débito'] as const).map((forma) => (
                <TouchableOpacity
                  key={forma}
                  style={[
                    styles.formaPagamentoButton,
                    {
                      backgroundColor: formaPagamento === forma ? colors.primary : colors.cardBackground,
                      borderColor: formaPagamento === forma ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setFormaPagamento(forma)}
                >
                  <Text style={[
                    styles.formaPagamentoText,
                    { color: formaPagamento === forma ? 'white' : colors.text }
                  ]}>
                    {forma}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Total */}
          <View style={[styles.totalContainer, { backgroundColor: colors.primary, marginTop: 20 }]}>
            <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
            <Text style={styles.totalValor}>R$ {calcularTotal().toFixed(2).replace('.', ',')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.fecharVendaButton, { backgroundColor: colors.success }]}
            onPress={fecharVenda}
          >
            <FontAwesome name="check-circle" size={20} color="white" />
            <Text style={styles.fecharVendaText}>Fechar Venda e Gerar Cupom</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Cupom Fiscal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cupomModalVisible}
        onRequestClose={() => setCupomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: 'white' }]}>
            <View ref={cupomRef} style={styles.cupomContainer}>
              <Text style={styles.cupomTitle}>CUPOM FISCAL</Text>
              <Text style={styles.cupomEmpresa}>Barbearia App</Text>
              <View style={styles.cupomDivisor} />
              
              {ultimaVenda && (
                <>
                  <Text style={styles.cupomInfo}>Cupom Nº: {ultimaVenda.numeroCupom}</Text>
                  <Text style={styles.cupomInfo}>Data: {ultimaVenda.data} - {ultimaVenda.hora}</Text>
                  <Text style={styles.cupomInfo}>Cliente: {ultimaVenda.cliente}</Text>
                  <View style={styles.cupomDivisor} />
                  
                  <Text style={styles.cupomSectionTitle}>ITENS</Text>
                  {ultimaVenda.itens.map((item: ItemConsumo, index: number) => (
                    <View key={index} style={styles.cupomItem}>
                      <Text style={styles.cupomItemNome}>{item.produto.nome}</Text>
                      <Text style={styles.cupomItemDetalhe}>
                        {item.quantidade} x R$ {item.produto.preco.toFixed(2).replace('.', ',')}
                      </Text>
                      <Text style={styles.cupomItemSubtotal}>
                        R$ {item.subtotal.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                  ))}
                  
                  <View style={styles.cupomDivisor} />
                  <View style={styles.cupomTotal}>
                    <Text style={styles.cupomTotalLabel}>TOTAL:</Text>
                    <Text style={styles.cupomTotalValor}>
                      R$ {ultimaVenda.total.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                  <Text style={styles.cupomPagamento}>
                    Forma de Pagamento: {ultimaVenda.formaPagamento}
                  </Text>
                  <View style={styles.cupomDivisor} />
                  <Text style={styles.cupomRodape}>Obrigado pela preferência!</Text>
                </>
              )}
            </View>

            <View style={styles.cupomButtons}>
              <TouchableOpacity
                style={[styles.cupomIconButton, { backgroundColor: '#4CAF50' }]}
                onPress={imprimirCupom}
              >
                <FontAwesome name="print" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cupomIconButton, { backgroundColor: colors.primary }]}
                onPress={compartilharCupom}
              >
                <FontAwesome name="share-alt" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cupomIconButton, { backgroundColor: colors.secondary }]}
                onPress={() => setCupomModalVisible(false)}
              >
                <FontAwesome name="times" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  buscaResultados: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 10,
    maxHeight: 200,
  },
  clienteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  clienteNome: {
    fontSize: 16,
    fontWeight: '600',
  },
  clienteTelefone: {
    fontSize: 14,
    marginTop: 2,
  },
  semResultados: {
    padding: 20,
    textAlign: 'center',
  },
  clienteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
  },
  clienteNomeSelecionado: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  produtosList: {
    marginTop: 15,
  },
  produtoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  produtoNome: {
    fontSize: 16,
    fontWeight: '600',
  },
  produtoDescricao: {
    fontSize: 14,
    marginTop: 2,
  },
  produtoValor: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  estoqueText: {
    fontSize: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemValor: {
    fontSize: 14,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 14,
  },
  itemControles: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantidadeButton: {
    padding: 8,
    borderRadius: 5,
  },
  quantidadeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
    borderRadius: 5,
  },
  formasPagamento: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  formaPagamentoButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  formaPagamentoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalContainer: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  totalLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  totalValor: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  fecharVendaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 10,
    marginTop: 15,
    gap: 10,
  },
  fecharVendaText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 15,
    padding: 20,
  },
  cupomContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  cupomTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  cupomEmpresa: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  cupomDivisor: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  cupomInfo: {
    fontSize: 14,
    marginBottom: 5,
  },
  cupomSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  cupomItem: {
    marginBottom: 10,
  },
  cupomItemNome: {
    fontSize: 14,
    fontWeight: '600',
  },
  cupomItemDetalhe: {
    fontSize: 12,
    color: '#666',
  },
  cupomItemSubtotal: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  cupomTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cupomTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cupomTotalValor: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cupomPagamento: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  cupomRodape: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cupomButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  cupomIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});
