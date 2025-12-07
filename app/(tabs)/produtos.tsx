import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { deleteProduto, getAllProdutos, insertProduto, updateProduto } from '@/services/database';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ProdutoServico {
  id: number;
  nome: string;
  descricao: string;
  preco?: number;
  valor?: string;
  estoque?: number;
  tipo: 'produto' | 'servico';
}

export default function ProdutosServicosScreen() {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [estoque, setEstoque] = useState('0');
  const [tipo, setTipo] = useState<'produto' | 'servico'>('produto');
  const [itens, setItens] = useState<ProdutoServico[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Carregar produtos do banco ao iniciar
  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const produtosData: any = await getAllProdutos();
      const produtosFormatados = produtosData.map((p: any) => ({
        ...p,
        tipo: p.tipo || 'produto', // Usar o tipo do banco ou 'produto' como padrão
        valor: p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }));
      setItens(produtosFormatados);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos');
    }
  };

  const formatarValor = (text: string) => {
    // Remove caracteres não numéricos
    const cleaned = text.replace(/\D/g, '');

    // Converte para número e formata como moeda
    const number = parseFloat(cleaned) / 100;
    if (isNaN(number)) return '';

    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleSubmit = async () => {
    if (!nome || !descricao || !valor) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      // Converter valor de string formatada para número
      const valorNumerico = parseFloat(valor.replace(/[R$\s.]/g, '').replace(',', '.'));
      // Para serviços, estoque sempre será 0
      const estoqueNumerico = tipo === 'servico' ? 0 : (parseInt(estoque) || 0);

      if (editandoId) {
        // Atualizar produto existente
        await updateProduto(editandoId, nome, descricao, valorNumerico, estoqueNumerico, tipo);
        Alert.alert('Sucesso', `${tipo === 'produto' ? 'Produto' : 'Serviço'} atualizado com sucesso!`);
        setEditandoId(null);
      } else {
        // Inserir novo produto
        await insertProduto(nome, descricao, valorNumerico, estoqueNumerico, tipo);
        Alert.alert('Sucesso', `${tipo === 'produto' ? 'Produto' : 'Serviço'} cadastrado com sucesso!`);
      }

      // Limpar campos
      setNome('');
      setDescricao('');
      setValor('');
      setEstoque('0');
      setTipo('produto');
      
      // Recarregar lista
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      Alert.alert('Erro', 'Não foi possível salvar o produto');
    }
  };

  const handleEdit = (item: ProdutoServico) => {
    setNome(item.nome);
    setDescricao(item.descricao);
    setValor(item.valor || '');
    setEstoque(item.estoque?.toString() || '0');
    setTipo(item.tipo);
    setEditandoId(item.id);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Excluir Produto',
      'Tem certeza que deseja excluir este produto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await deleteProduto(id);
            carregarProdutos();
            Alert.alert('Sucesso', 'Produto excluído com sucesso!');
          } catch (error) {
            console.error('Erro ao excluir produto:', error);
            Alert.alert('Erro', 'Não foi possível excluir o produto');
          }
        }},
      ]
    );
  };

  const handleCancel = () => {
    setNome('');
    setDescricao('');
    setValor('');
    setEstoque('0');
    setTipo('produto');
    setEditandoId(null);
  };

  const renderItem = ({ item }: { item: ProdutoServico }) => (
    <View style={[styles.itemRow, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemNome, { color: colors.text }]}>{item.nome}</Text>
          <View style={[styles.tipoBadge, {
            backgroundColor: item.tipo === 'produto' ? colors.primary : colors.secondary
          }]}>
            <Text style={styles.tipoText}>
              {item.tipo === 'produto' ? 'Produto' : 'Serviço'}
            </Text>
          </View>
        </View>
        <Text style={[styles.itemDescricao, { color: colors.secondary }]}>{item.descricao}</Text>
        <Text style={[styles.itemValor, { color: colors.primary, fontWeight: 'bold' }]}>
          {item.valor}
        </Text>
        {/* Mostrar estoque apenas para produtos */}
        {item.tipo === 'produto' && item.estoque !== undefined && (
          <Text style={[styles.itemEstoque, { color: colors.secondary, fontSize: 12 }]}>
            Estoque: {item.estoque} unidades
          </Text>
        )}
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.secondary }]}
          onPress={() => handleEdit(item)}
        >
          <MaterialIcons name="edit" size={18} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.danger }]}
          onPress={() => handleDelete(item.id)}
        >
          <MaterialIcons name="delete" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <FontAwesome name="shopping-cart" size={30} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Produtos e Serviços</Text>
      </View>

      <View style={[styles.formContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.formTitle, { color: colors.text }]}>
          {editandoId ? 'Editar Item' : 'Cadastrar Novo Item'}
        </Text>

        {/* Seletor de tipo */}
        <View style={styles.tipoSelector}>
          <TouchableOpacity
            style={[
              styles.tipoButton,
              tipo === 'produto' && [styles.tipoButtonActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setTipo('produto')}
          >
            <FontAwesome name="cube" size={20} color={tipo === 'produto' ? 'white' : colors.primary} />
            <Text style={[
              styles.tipoButtonText,
              { color: tipo === 'produto' ? 'white' : colors.text }
            ]}>
              Produto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tipoButton,
              tipo === 'servico' && [styles.tipoButtonActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => {
              setTipo('servico');
              setEstoque('0'); // Reseta estoque ao mudar para serviço
            }}
          >
            <FontAwesome name="scissors" size={20} color={tipo === 'servico' ? 'white' : colors.primary} />
            <Text style={[
              styles.tipoButtonText,
              { color: tipo === 'servico' ? 'white' : colors.text }
            ]}>
              Serviço
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome name="tag" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Nome do produto/serviço"
            placeholderTextColor={colors.tabIconDefault}
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome name="file-text" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Descrição"
            placeholderTextColor={colors.tabIconDefault}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome name="dollar" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Valor (R$ 0,00)"
            placeholderTextColor={colors.tabIconDefault}
            value={valor}
            onChangeText={(text) => setValor(formatarValor(text))}
            keyboardType="numeric"
          />
        </View>

        {/* Campo de estoque só aparece para produtos */}
        {tipo === 'produto' && (
          <View style={styles.inputContainer}>
            <FontAwesome name="cubes" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Estoque"
              placeholderTextColor={colors.tabIconDefault}
              value={estoque}
              onChangeText={setEstoque}
              keyboardType="numeric"
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <FontAwesome name={editandoId ? "save" : "plus"} size={20} color="white" />
            <Text style={styles.submitButtonText}>
              {editandoId ? 'Atualizar' : 'Cadastrar'}
            </Text>
          </TouchableOpacity>

          {editandoId && (
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.secondary }]}
              onPress={handleCancel}
            >
              <FontAwesome name="times" size={20} color="white" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          <FontAwesome name="list" size={20} color={colors.primary} /> Itens Cadastrados ({itens.length})
        </Text>

        {itens.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <FontAwesome name="shopping-cart" size={50} color={colors.tabIconDefault} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>
              Nenhum produto ou serviço cadastrado ainda
            </Text>
          </View>
        ) : (
          <FlatList
            data={itens}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            scrollEnabled={false}
            style={styles.flatList}
          />
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
  formContainer: {
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
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  tipoSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  tipoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tipoButtonActive: {
    borderColor: 'transparent',
  },
  tipoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  input: {
    flex: 1,
    padding: 15,
    paddingLeft: 50,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    gap: 10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  listContainer: {
    margin: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  flatList: {
    marginTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  tipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  tipoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemDescricao: {
    fontSize: 14,
    marginBottom: 5,
  },
  itemValor: {
    fontSize: 16,
  },
  itemEstoque: {
    fontSize: 12,
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
  },
});