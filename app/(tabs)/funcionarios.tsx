import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { deleteBarbeiro, getAllBarbeiros, insertBarbeiro, updateBarbeiro } from '@/services/database';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Barbeiro {
  id: number;
  nome: string;
  especialidade: string;
  dias_trabalho: string;
  horario_inicio: string;
  horario_fim: string;
}

const diasSemana = [
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
  { id: 'dom', label: 'Dom' },
];

export default function FuncionariosScreen() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // Campos do formulário
  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFim, setHorarioFim] = useState('18:00');

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    carregarBarbeiros();
  }, []);

  const carregarBarbeiros = async () => {
    try {
      const data: any = await getAllBarbeiros();
      setBarbeiros(data);
    } catch (error) {
      console.error('Erro ao carregar barbeiros:', error);
      Alert.alert('Erro', 'Não foi possível carregar os funcionários');
    }
  };

  const toggleDia = (diaId: string) => {
    if (diasSelecionados.includes(diaId)) {
      setDiasSelecionados(diasSelecionados.filter(d => d !== diaId));
    } else {
      setDiasSelecionados([...diasSelecionados, diaId]);
    }
  };

  const formatarHorario = (text: string) => {
    const apenasNumeros = text.replace(/\D/g, '');
    if (apenasNumeros.length <= 2) {
      return apenasNumeros;
    }
    return `${apenasNumeros.slice(0, 2)}:${apenasNumeros.slice(2, 4)}`;
  };

  const abrirModal = (barbeiro?: Barbeiro) => {
    if (barbeiro) {
      setEditandoId(barbeiro.id);
      setNome(barbeiro.nome);
      setEspecialidade(barbeiro.especialidade);
      setDiasSelecionados(barbeiro.dias_trabalho ? barbeiro.dias_trabalho.split(',') : []);
      setHorarioInicio(barbeiro.horario_inicio || '08:00');
      setHorarioFim(barbeiro.horario_fim || '18:00');
    } else {
      setEditandoId(null);
      setNome('');
      setEspecialidade('');
      setDiasSelecionados([]);
      setHorarioInicio('08:00');
      setHorarioFim('18:00');
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome do funcionário');
      return;
    }

    if (!especialidade.trim()) {
      Alert.alert('Erro', 'Por favor, preencha a especialidade');
      return;
    }

    if (diasSelecionados.length === 0) {
      Alert.alert('Erro', 'Por favor, selecione pelo menos um dia de trabalho');
      return;
    }

    try {
      const diasTrabalho = diasSelecionados.join(',');

      if (editandoId) {
        await updateBarbeiro(editandoId, nome, especialidade, diasTrabalho, horarioInicio, horarioFim);
        Alert.alert('Sucesso', 'Funcionário atualizado com sucesso!');
      } else {
        await insertBarbeiro(nome, especialidade, diasTrabalho, horarioInicio, horarioFim);
        Alert.alert('Sucesso', 'Funcionário cadastrado com sucesso!');
      }

      await carregarBarbeiros();
      setModalVisible(false);
    } catch (error) {
      console.error('Erro ao salvar barbeiro:', error);
      Alert.alert('Erro', 'Não foi possível salvar o funcionário');
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    setDeleteModalVisible(true);
  };

  const confirmarDelete = async () => {
    if (deleteId === null) return;
    
    try {
      await deleteBarbeiro(deleteId);
      await carregarBarbeiros();
      setDeleteModalVisible(false);
      setDeleteId(null);
      Alert.alert('Sucesso', 'Funcionário excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir barbeiro:', error);
      Alert.alert('Erro', 'Não foi possível excluir o funcionário');
    }
  };

  const renderBarbeiro = ({ item }: { item: Barbeiro }) => (
    <View style={[styles.barbeiroCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.barbeiroHeader}>
        <FontAwesome name="user-circle" size={50} color={colors.primary} />
        <View style={styles.barbeiroInfo}>
          <Text style={[styles.barbeiroNome, { color: colors.text }]}>{item.nome}</Text>
          <Text style={[styles.barbeiroEspecialidade, { color: colors.secondary }]}>
            <FontAwesome name="scissors" size={14} /> {item.especialidade}
          </Text>
          {item.dias_trabalho && (
            <Text style={[styles.barbeiroDias, { color: colors.secondary }]}>
              <FontAwesome name="calendar" size={14} /> {item.dias_trabalho.split(',').map(d => {
                const dia = diasSemana.find(ds => ds.id === d);
                return dia?.label;
              }).join(', ')}
            </Text>
          )}
          <Text style={[styles.barbeiroHorario, { color: colors.secondary }]}>
            <FontAwesome name="clock-o" size={14} /> {item.horario_inicio} às {item.horario_fim}
          </Text>
        </View>
      </View>
      <View style={styles.barbeiroActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => abrirModal(item)}
        >
          <FontAwesome name="edit" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.danger }]}
          onPress={() => handleDelete(item.id)}
        >
          <FontAwesome name="trash" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <FontAwesome name="users" size={30} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Funcionários / Barbeiros</Text>
      </View>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => abrirModal()}
      >
        <FontAwesome name="plus" size={20} color="white" />
        <Text style={styles.addButtonText}>Novo Funcionário</Text>
      </TouchableOpacity>

      {barbeiros.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <FontAwesome name="user-times" size={50} color={colors.tabIconDefault} />
          <Text style={[styles.emptyText, { color: colors.secondary }]}>
            Nenhum funcionário cadastrado
          </Text>
        </View>
      ) : (
        <FlatList
          data={barbeiros}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBarbeiro}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.deleteIconContainer}>
              <MaterialIcons name="delete" size={60} color={colors.danger} />
            </View>
            
            <Text style={[styles.deleteTitle, { color: colors.text }]}>
              Excluir Funcionário?
            </Text>
            
            <Text style={[styles.deleteMessage, { color: colors.secondary }]}>
              Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.
            </Text>
            
            <View style={styles.deleteButtonsContainer}>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.secondary }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.deleteButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.danger }]}
                onPress={confirmarDelete}
              >
                <FontAwesome name="trash" size={18} color="white" />
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Cadastro/Edição */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editandoId ? 'Editar Funcionário' : 'Novo Funcionário'}
              </Text>

              {/* Nome */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Nome *</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Digite o nome completo"
                  placeholderTextColor={colors.tabIconDefault}
                  value={nome}
                  onChangeText={setNome}
                />
              </View>

              {/* Especialidade */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Especialidade *</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  placeholder="Ex: Cortes Masculinos, Barba, Cortes Femininos"
                  placeholderTextColor={colors.tabIconDefault}
                  value={especialidade}
                  onChangeText={setEspecialidade}
                />
              </View>

              {/* Dias de Trabalho */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Dias de Trabalho *</Text>
                <View style={styles.diasContainer}>
                  {diasSemana.map((dia) => (
                    <TouchableOpacity
                      key={dia.id}
                      style={[
                        styles.diaBtn,
                        {
                          backgroundColor: diasSelecionados.includes(dia.id)
                            ? colors.primary
                            : colors.cardBackground,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => toggleDia(dia.id)}
                    >
                      <Text
                        style={[
                          styles.diaBtnText,
                          { color: diasSelecionados.includes(dia.id) ? 'white' : colors.text },
                        ]}
                      >
                        {dia.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Horários */}
              <View style={styles.horariosRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Horário Início</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.tabIconDefault}
                    value={horarioInicio}
                    onChangeText={(text) => setHorarioInicio(formatarHorario(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Horário Fim</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.tabIconDefault}
                    value={horarioFim}
                    onChangeText={(text) => setHorarioFim(formatarHorario(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>

              {/* Botões */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.success }]}
                  onPress={handleSubmit}
                >
                  <FontAwesome name={editandoId ? 'save' : 'plus'} size={16} color="white" />
                  <Text style={styles.modalButtonText}>
                    {editandoId ? 'Salvar' : 'Cadastrar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    borderBottomWidth: 1,
    gap: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    gap: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  barbeiroCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  barbeiroHeader: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
  },
  barbeiroInfo: {
    flex: 1,
    gap: 5,
  },
  barbeiroNome: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  barbeiroEspecialidade: {
    fontSize: 14,
  },
  barbeiroDias: {
    fontSize: 14,
  },
  barbeiroHorario: {
    fontSize: 14,
  },
  barbeiroActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  diasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  diaBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  diaBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  horariosRow: {
    flexDirection: 'row',
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
    borderRadius: 8,
    gap: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    width: '80%',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  deleteIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 25,
    textAlign: 'center',
  },
  deleteButtonsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});
