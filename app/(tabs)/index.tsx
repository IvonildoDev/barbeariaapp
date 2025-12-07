import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { deleteCliente, getAllClientes, insertCliente, updateCliente } from '@/services/database';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Cliente {
  id: number;
  nome: string;
  aniversario: string;
  telefone: string;
}

export default function CadastroScreen() {
  const [nome, setNome] = useState('');
  const [aniversario, setAniversario] = useState('');
  const [telefone, setTelefone] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Carregar clientes do banco ao iniciar
  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      const clientesData: any = await getAllClientes();
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os clientes');
    }
  };

  const formatarAniversario = (text: string) => {
    // Remove caracteres não numéricos
    const cleaned = text.replace(/\D/g, '');
    
    // Limita a 8 dígitos (DDMMAAAA)
    const limited = cleaned.slice(0, 8);
    
    // Adiciona barras de separação
    let formatted = limited;
    if (limited.length >= 2) {
      formatted = limited.slice(0, 2) + '/' + limited.slice(2);
    }
    if (limited.length >= 4) {
      formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
    }
    
    return formatted;
  };

  const formatarTelefone = (text: string) => {
    // Remove caracteres não numéricos
    const cleaned = text.replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limited = cleaned.slice(0, 11);
    
    return limited;
  };

  const handleSubmit = async () => {
    if (!nome || !aniversario || !telefone) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      if (editingId) {
        // Atualizar cliente existente
        await updateCliente(editingId, nome, telefone, aniversario);
        Alert.alert('Sucesso', 'Cliente atualizado com sucesso!');
        setEditingId(null);
      } else {
        // Inserir novo cliente
        await insertCliente(nome, telefone, aniversario);
        Alert.alert('Sucesso', 'Cliente cadastrado com sucesso!');
      }
      
      // Limpar campos
      setNome('');
      setAniversario('');
      setTelefone('');
      
      // Recarregar lista
      carregarClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      Alert.alert('Erro', 'Não foi possível salvar o cliente');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Excluir Cliente',
      'Tem certeza que deseja excluir este cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await deleteCliente(id);
            carregarClientes();
            Alert.alert('Sucesso', 'Cliente excluído com sucesso!');
          } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            Alert.alert('Erro', 'Não foi possível excluir o cliente');
          }
        }},
      ]
    );
  };

  const handleEdit = (cliente: Cliente) => {
    setNome(cliente.nome);
    setAniversario(cliente.aniversario);
    setTelefone(cliente.telefone);
    setEditingId(cliente.id);
  };

  const handleCancelEdit = () => {
    setNome('');
    setAniversario('');
    setTelefone('');
    setEditingId(null);
  };

  const handleWhatsApp = (telefone: string) => {
    const phoneNumber = telefone.replace(/\D/g, '');
    const whatsappUrl = `whatsapp://send?phone=55${phoneNumber}`;
    
    Linking.canOpenURL(whatsappUrl).then(supported => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Erro', 'WhatsApp não está instalado neste dispositivo');
      }
    });
  };

  const renderCliente = ({ item }: { item: Cliente }) => (
    <View style={[styles.clienteCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.clienteHeader}>
        <View style={styles.clienteInfo}>
          <Text style={[styles.clienteNome, { color: colors.text }]}>{item.nome}</Text>
          <Text style={[styles.clienteDetalhes, { color: colors.secondary }]}>
            📅 {item.aniversario}
          </Text>
          <Text style={[styles.clienteDetalhes, { color: colors.secondary }]}>
            📞 {item.telefone}
          </Text>
        </View>
      </View>
      
      <View style={styles.clienteActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton, { backgroundColor: colors.primary }]}
          onPress={() => handleEdit(item)}
        >
          <MaterialIcons name="edit" size={18} color="white" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.whatsappButton, { backgroundColor: '#25D366' }]}
          onPress={() => handleWhatsApp(item.telefone)}
        >
          <FontAwesome name="whatsapp" size={18} color="white" />
          <Text style={styles.actionButtonText}>WhatsApp</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.danger }]}
          onPress={() => handleDelete(item.id)}
        >
          <MaterialIcons name="delete" size={18} color="white" />
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <FontAwesome name="user-plus" size={30} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Cadastro de Clientes</Text>
      </View>

      <View style={[styles.formContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Nome completo"
            placeholderTextColor={colors.tabIconDefault}
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome name="birthday-cake" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Aniversário (DD/MM/AAAA)"
            placeholderTextColor={colors.tabIconDefault}
            value={aniversario}
            onChangeText={(text) => setAniversario(formatarAniversario(text))}
            maxLength={10}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome name="phone" size={20} color={colors.primary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Telefone (DDXXXXXXXXX)"
            placeholderTextColor={colors.tabIconDefault}
            value={telefone}
            onChangeText={(text) => setTelefone(formatarTelefone(text))}
            maxLength={11}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <FontAwesome name={editingId ? "save" : "user-plus"} size={20} color="white" />
            <Text style={styles.submitButtonText}>
              {editingId ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
            </Text>
          </TouchableOpacity>
          
          {editingId && (
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.secondary }]}
              onPress={handleCancelEdit}
            >
              <MaterialIcons name="cancel" size={20} color="white" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          <FontAwesome name="users" size={20} color={colors.primary} /> Clientes Cadastrados ({clientes.length})
        </Text>

        {clientes.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <FontAwesome name="user-times" size={50} color={colors.tabIconDefault} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>Nenhum cliente cadastrado ainda</Text>
          </View>
        ) : (
          <FlatList
            data={clientes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCliente}
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  submitButtonText: {
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
  clienteRow: {
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
  clienteCard: {
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
  clienteHeader: {
    marginBottom: 15,
  },
  clienteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editButton: {
    // primary color
  },
  whatsappButton: {
    // WhatsApp green
  },
  buttonContainer: {
    gap: 10,
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
  clienteInfo: {
    flex: 1,
  },
  clienteNome: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  clienteDetalhes: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
});
