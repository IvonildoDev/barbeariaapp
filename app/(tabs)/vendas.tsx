import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getAllClientes, getAllProdutos, insertVenda, updateProduto } from '@/services/database';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ProdutoServico {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  estoque?: number;
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  aniversario: string;
}

interface ItemCarrinho {
  id: number;
  produto: ProdutoServico;
  quantidade: number;
  subtotal: number;
}

export default function VendasScreen() {
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoServico[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [mostrarBuscaCliente, setMostrarBuscaCliente] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<'Dinheiro' | 'PIX' | 'Crédito' | 'Débito'>('Dinheiro');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const produtosDB = await getAllProdutos();
      setProdutosDisponiveis(produtosDB as ProdutoServico[]);
      
      const clientesDB = await getAllClientes();
      setClientes(clientesDB as Cliente[]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) ||
    c.telefone.includes(buscaCliente)
  );

  const produtosFiltrados = produtosDisponiveis.filter(p =>
    p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
    p.descricao.toLowerCase().includes(buscaProduto.toLowerCase())
  );

  const adicionarAoCarrinho = (produto: ProdutoServico) => {
    // Verificar estoque apenas para produtos (serviços têm estoque 0 ou undefined)
    if (produto.tipo === 'produto' && produto.estoque !== undefined && produto.estoque <= 0) {
      Alert.alert('Estoque Insuficiente', 'Este produto não possui estoque disponível');
      return;
    }

    const itemExistente = carrinho.find(item => item.produto.id === produto.id);

    if (itemExistente) {
      // Verificar estoque apenas para produtos
      if (produto.tipo === 'produto' && produto.estoque !== undefined && itemExistente.quantidade + 1 > produto.estoque) {
        Alert.alert('Estoque Insuficiente', `Apenas ${produto.estoque} unidades disponíveis`);
        return;
      }
      setCarrinho(carrinho.map(item =>
        item.produto.id === produto.id
          ? {
              ...item,
              quantidade: item.quantidade + 1,
              subtotal: (item.quantidade + 1) * produto.preco
            }
          : item
      ));
    } else {
      const novoItem: ItemCarrinho = {
        id: Date.now(),
        produto,
        quantidade: 1,
        subtotal: produto.preco
      };
      setCarrinho([...carrinho, novoItem]);
    }
  };

  const removerDoCarrinho = (id: number) => {
    setCarrinho(carrinho.filter(item => item.id !== id));
  };

  const alterarQuantidade = (id: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(id);
      return;
    }

    setCarrinho(carrinho.map(item => {
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
    return carrinho.reduce((total, item) => total + item.subtotal, 0);
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos um item ao carrinho');
      return;
    }

    try {
      const produtosVendidos = carrinho.map(item => 
        `${item.produto.nome} (${item.quantidade}x)`
      ).join(', ');

      await insertVenda(
        new Date().toISOString().split('T')[0],
        produtosVendidos,
        calcularTotal(),
        clienteSelecionado?.nome || '',
        formaPagamento
      );

      // Atualizar estoque apenas dos produtos (não dos serviços)
      for (const item of carrinho) {
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

      await carregarDados();
      
      setCarrinho([]);
      setClienteSelecionado(null);
      setBuscaCliente('');
      setFormaPagamento('Dinheiro');

      Alert.alert('Sucesso', 'Venda finalizada com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      Alert.alert('Erro', 'Não foi possível finalizar a venda');
    }
  };

  const limparCarrinho = () => {
    Alert.alert(
      'Limpar Carrinho',
      'Tem certeza que deseja limpar todos os itens do carrinho?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: () => setCarrinho([]) },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <FontAwesome name="shopping-cart" size={30} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Nova Venda</Text>
      </View>

      {/* Busca de Cliente (Opcional) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <FontAwesome name="user" size={18} color={colors.primary} /> Cliente (Opcional)
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

      {/* Busca e Lista de Produtos */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <FontAwesome name="search" size={18} color={colors.primary} /> Adicionar Produtos
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
              onPress={() => adicionarAoCarrinho(produto)}
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

      {/* Carrinho */}
      {carrinho.length > 0 && (
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <FontAwesome name="shopping-cart" size={18} color={colors.primary} /> Carrinho ({carrinho.length})
            </Text>
            <TouchableOpacity onPress={limparCarrinho}>
              <Text style={[{ color: colors.danger, fontSize: 14 }]}>
                <FontAwesome name="trash" size={14} /> Limpar
              </Text>
            </TouchableOpacity>
          </View>

          {carrinho.map((item) => (
            <View key={item.id} style={[styles.carrinhoItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.carrinhoNome, { color: colors.text }]}>{item.produto.nome}</Text>
                <Text style={[styles.carrinhoValor, { color: colors.secondary }]}>
                  R$ {item.produto.preco.toFixed(2).replace('.', ',')} x {item.quantidade}
                </Text>
                <Text style={[styles.carrinhoSubtotal, { color: colors.primary, fontWeight: 'bold', marginTop: 5 }]}>
                  Subtotal: R$ {item.subtotal.toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View style={styles.carrinhoControles}>
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
                  onPress={() => removerDoCarrinho(item.id)}
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

          {/* Total e Finalizar */}
          <View style={[styles.totalContainer, { backgroundColor: colors.primary, marginTop: 20 }]}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValor}>R$ {calcularTotal().toFixed(2).replace('.', ',')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.finalizarButton, { backgroundColor: colors.success }]}
            onPress={finalizarVenda}
          >
            <FontAwesome name="check-circle" size={20} color="white" />
            <Text style={styles.finalizarText}>Finalizar Venda</Text>
          </TouchableOpacity>
        </View>
      )}
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
  carrinhoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  carrinhoNome: {
    fontSize: 16,
    fontWeight: '600',
  },
  carrinhoValor: {
    fontSize: 14,
    marginTop: 2,
  },
  carrinhoSubtotal: {
    fontSize: 14,
  },
  carrinhoControles: {
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
  finalizarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 10,
    marginTop: 15,
    gap: 10,
  },
  finalizarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
