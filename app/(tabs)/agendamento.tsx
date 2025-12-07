import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
    deleteAgendamento,
    getAllAgendamentos,
    getAllBarbeiros,
    getAllClientes,
    insertAgendamento,
    insertBarbeiro,
    updateAgendamentoStatus
} from '@/services/database';
import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Cliente {
  id: number;
  nome: string;
  aniversario: string;
  telefone: string;
}

interface Barbeiro {
  id: number;
  nome: string;
  especialidade: string;
}

interface Agendamento {
  id: number;
  cliente_id: number;
  cliente_nome?: string;
  barbeiro_id: number;
  barbeiro_nome?: string;
  data: string; // formato YYYY-MM-DD
  hora: string; // formato HH:MM
  servico: string;
  status: string;
}

export default function AgendamentoScreen() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  // Estados do formulário
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState<Barbeiro | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horaSelecionada, setHoraSelecionada] = useState('');
  const [servico, setServico] = useState('');

  // Estados dos modais
  const [modalClienteVisible, setModalClienteVisible] = useState(false);
  const [modalBarbeiroVisible, setModalBarbeiroVisible] = useState(false);
  const [modalDataHoraVisible, setModalDataHoraVisible] = useState(false);
  const [barbeiroVisualizando, setBarbeiroVisualizando] = useState<Barbeiro | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Carregar dados do banco ao iniciar
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carregar clientes
      const clientesData: any = await getAllClientes();
      setClientes(clientesData);
      console.log('Clientes carregados:', clientesData.length);

      // Carregar barbeiros
      let barbeirosData: any = await getAllBarbeiros();
      
      // Se não houver barbeiros, criar alguns padrão
      if (barbeirosData.length === 0) {
        await insertBarbeiro('Carlos Eduardo', 'Cortes Masculinos');
        await insertBarbeiro('Roberto Silva', 'Barbas e Bigodes');
        await insertBarbeiro('Fernando Costa', 'Cortes Femininos');
        barbeirosData = await getAllBarbeiros();
      }
      
      setBarbeiros(barbeirosData);

      // Carregar agendamentos
      const agendamentosData: any = await getAllAgendamentos();
      setAgendamentos(agendamentosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    }
  };

  // Funções de filtro e busca
  const clientesFiltrados = clientes.filter(cliente => {
    const busca = buscaCliente.toLowerCase().trim();
    if (!busca) return true; // Se não há busca, mostra todos
    return cliente.nome.toLowerCase().includes(busca) ||
           cliente.telefone.includes(busca);
  });

  // Função para formatar data automaticamente (DD/MM/AAAA)
  const formatarData = (text: string) => {
    // Remove tudo que não for número
    const apenasNumeros = text.replace(/\D/g, '');
    
    // Aplica a máscara
    if (apenasNumeros.length <= 2) {
      return apenasNumeros;
    } else if (apenasNumeros.length <= 4) {
      return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
    } else {
      return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4, 8)}`;
    }
  };

  // Função para converter DD/MM/AAAA para YYYY-MM-DD
  const converterDataParaISO = (dataFormatada: string): string => {
    if (dataFormatada.length !== 10) return '';
    const [dia, mes, ano] = dataFormatada.split('/');
    return `${ano}-${mes}-${dia}`;
  };

  // Função para verificar disponibilidade
  const verificarDisponibilidade = (barbeiroId: number, data: string, hora: string) => {
    return !agendamentos.some(agendamento =>
      agendamento.barbeiro_id === barbeiroId &&
      agendamento.data === data &&
      agendamento.hora === hora &&
      agendamento.status !== 'Cancelado'
    );
  };

  // Função para agendar
  const agendar = async () => {
    if (!clienteSelecionado || !barbeiroSelecionado || !dataSelecionada || !horaSelecionada || !servico) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    // Converter data para formato ISO (YYYY-MM-DD)
    const dataISO = converterDataParaISO(dataSelecionada);
    if (!dataISO) {
      Alert.alert('Erro', 'Data inválida. Use o formato DD/MM/AAAA');
      return;
    }

    if (!verificarDisponibilidade(barbeiroSelecionado.id, dataISO, horaSelecionada)) {
      Alert.alert('Erro', 'Horário indisponível para este barbeiro');
      return;
    }

    try {
      await insertAgendamento(
        clienteSelecionado.id,
        barbeiroSelecionado.id,
        dataISO,
        horaSelecionada,
        servico,
        'Pendente'
      );

      // Limpar formulário
      setClienteSelecionado(null);
      setBarbeiroSelecionado(null);
      setDataSelecionada('');
      setHoraSelecionada('');
      setServico('');

      // Recarregar agendamentos
      carregarDados();

      Alert.alert('Sucesso', 'Agendamento realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao agendar:', error);
      Alert.alert('Erro', 'Não foi possível realizar o agendamento');
    }
  };

  // Função para confirmar agendamento
  const confirmarAgendamento = async (id: number) => {
    try {
      await updateAgendamentoStatus(id, 'Confirmado');
      carregarDados();
      Alert.alert('Sucesso', 'Agendamento confirmado!');
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      Alert.alert('Erro', 'Não foi possível confirmar o agendamento');
    }
  };

  // Função para cancelar agendamento
  const cancelarAgendamento = async (id: number) => {
    try {
      await deleteAgendamento(id);
      carregarDados();
      Alert.alert('Sucesso', 'Agendamento cancelado!');
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      Alert.alert('Erro', 'Não foi possível cancelar o agendamento');
    }
  };

  // Função para concluir agendamento
  const concluirAgendamento = async (id: number) => {
    try {
      await updateAgendamentoStatus(id, 'Concluído');
      carregarDados();
      Alert.alert('Sucesso', 'Agendamento concluído!');
    } catch (error) {
      console.error('Erro ao concluir agendamento:', error);
      Alert.alert('Erro', 'Não foi possível concluir o agendamento');
    }
  };

  // Função para obter agendamentos por barbeiro
  const getAgendamentosPorBarbeiro = (barbeiroId: number) => {
    return agendamentos.filter(agendamento => agendamento.barbeiro_id === barbeiroId);
  };

  // Todos os horários possíveis
  const todosHorarios = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  // Função para obter horários disponíveis para um barbeiro em uma data específica
  const getHorariosDisponiveis = () => {
    if (!barbeiroSelecionado || !dataSelecionada) {
      return todosHorarios;
    }

    // Converter data DD/MM/AAAA para YYYY-MM-DD para comparação
    const dataISO = converterDataParaISO(dataSelecionada);
    if (!dataISO) {
      return todosHorarios;
    }

    // Filtrar horários já agendados para este barbeiro nesta data
    const horariosOcupados = agendamentos
      .filter(agendamento => 
        agendamento.barbeiro_id === barbeiroSelecionado.id &&
        agendamento.data === dataISO &&
        agendamento.status !== 'Cancelado'
      )
      .map(agendamento => agendamento.hora);

    // Retornar apenas horários não ocupados
    return todosHorarios.filter(hora => !horariosOcupados.includes(hora));
  };

  // Horários disponíveis baseados no barbeiro e data selecionados
  const horariosDisponiveis = getHorariosDisponiveis();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <FontAwesome name="calendar" size={30} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Agendamentos</Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Novo Agendamento</Text>

          {/* Seletor de Cliente */}
          <View style={styles.inputContainer}>
            <FontAwesome name="search" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Buscar cliente por nome ou telefone"
              placeholderTextColor={colors.tabIconDefault}
              value={buscaCliente}
              onChangeText={setBuscaCliente}
              onFocus={() => setModalClienteVisible(true)}
            />
          </View>

          {/* Card do Cliente Selecionado */}
          {clienteSelecionado && (
            <View style={[styles.clienteCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
              <View style={styles.clienteCardHeader}>
                <FontAwesome name="user-circle" size={40} color={colors.primary} />
                <View style={styles.clienteCardInfo}>
                  <Text style={[styles.clienteCardNome, { color: colors.text }]}>
                    {clienteSelecionado.nome}
                  </Text>
                  <Text style={[styles.clienteCardTelefone, { color: colors.secondary }]}>
                    <FontAwesome name="phone" size={14} color={colors.secondary} /> {clienteSelecionado.telefone}
                  </Text>
                  {clienteSelecionado.aniversario && (
                    <Text style={[styles.clienteCardAniversario, { color: colors.secondary }]}>
                      <FontAwesome name="birthday-cake" size={14} color={colors.secondary} /> {clienteSelecionado.aniversario}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.clienteCardRemove, { backgroundColor: colors.danger }]}
                  onPress={() => setClienteSelecionado(null)}
                >
                  <FontAwesome name="times" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Seletor de Barbeiro */}
          <TouchableOpacity
            style={[styles.selectorBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => setModalBarbeiroVisible(true)}
          >
            <FontAwesome name="user" size={20} color={colors.primary} />
            <Text style={[styles.selectorText, { color: barbeiroSelecionado ? colors.text : colors.tabIconDefault }]}>
              {barbeiroSelecionado ? barbeiroSelecionado.nome : 'Selecionar barbeiro'}
            </Text>
            <FontAwesome name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>

          {/* Seletor de Data e Hora */}
          <TouchableOpacity
            style={[styles.selectorBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => setModalDataHoraVisible(true)}
          >
            <FontAwesome name="calendar" size={20} color={colors.primary} />
            <Text style={[styles.selectorText, { color: dataSelecionada && horaSelecionada ? colors.text : colors.tabIconDefault }]}>
              {dataSelecionada && horaSelecionada ? `${dataSelecionada} às ${horaSelecionada}` : 'Selecionar data e hora'}
            </Text>
            <FontAwesome name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>

          {/* Campo Serviço */}
          <View style={styles.inputContainer}>
            <FontAwesome name="scissors" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Serviço (ex: Corte de cabelo)"
              placeholderTextColor={colors.tabIconDefault}
              value={servico}
              onChangeText={setServico}
            />
          </View>

          {/* Botão Agendar */}
          <TouchableOpacity
            style={[styles.agendarBtn, { backgroundColor: colors.primary }]}
            onPress={agendar}
          >
            <FontAwesome name="calendar-plus-o" size={20} color="white" />
            <Text style={styles.agendarBtnText}>Agendar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.barbeirosContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <FontAwesome name="users" size={20} color={colors.primary} /> Agendas dos Barbeiros
        </Text>

        <FlatList
          data={barbeiros}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.barbeiroItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => setBarbeiroVisualizando(item)}
            >
              <View style={styles.barbeiroInfo}>
                <Text style={[styles.barbeiroNome, { color: colors.text }]}>{item.nome}</Text>
                <Text style={[styles.barbeiroEspecialidade, { color: colors.secondary }]}>{item.especialidade}</Text>
              </View>
              <TouchableOpacity
                style={[styles.verAgendaBtn, { backgroundColor: colors.primary }]}
                onPress={() => setBarbeiroVisualizando(item)}
              >
                <Text style={styles.verAgendaText}>Ver Agenda</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          style={styles.barbeirosList}
        />
      </View>

      {/* Modal de seleção de cliente */}
      <Modal
        visible={modalClienteVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalClienteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Cliente</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Buscar cliente..."
              placeholderTextColor={colors.tabIconDefault}
              value={buscaCliente}
              onChangeText={setBuscaCliente}
              autoFocus
            />
            <Text style={[styles.resultadosText, { color: colors.secondary, marginBottom: 10 }]}>
              {buscaCliente ? `${clientesFiltrados.length} resultado(s) encontrado(s)` : `${clientes.length} cliente(s) cadastrado(s)`}
            </Text>
            {clientesFiltrados.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <FontAwesome name="user-times" size={50} color={colors.tabIconDefault} />
                <Text style={[styles.emptyText, { color: colors.secondary }]}>
                  {buscaCliente ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={clientesFiltrados}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.clienteItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                    onPress={() => {
                      setClienteSelecionado(item);
                      setBuscaCliente('');
                      setModalClienteVisible(false);
                    }}
                  >
                    <View style={styles.clienteInfo}>
                      <Text style={[styles.clienteNome, { color: colors.text }]}>{item.nome}</Text>
                      <Text style={[styles.clienteTelefone, { color: colors.secondary }]}>{item.telefone}</Text>
                    </View>
                    <FontAwesome name="chevron-right" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
                style={styles.clientesList}
              />
            )}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
              onPress={() => setModalClienteVisible(false)}
            >
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de seleção de barbeiro */}
      <Modal
        visible={modalBarbeiroVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalBarbeiroVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Barbeiro</Text>
            <FlatList
              data={barbeiros}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.barbeiroItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                  onPress={() => {
                    setBarbeiroSelecionado(item);
                    setModalBarbeiroVisible(false);
                  }}
                >
                  <View style={styles.barbeiroInfo}>
                    <Text style={[styles.barbeiroNome, { color: colors.text }]}>{item.nome}</Text>
                    <Text style={[styles.barbeiroEspecialidade, { color: colors.secondary }]}>{item.especialidade}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.verAgendaBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setBarbeiroVisualizando(item)}
                  >
                    <Text style={styles.verAgendaText}>Ver Agenda</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              style={styles.barbeirosList}
            />
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
              onPress={() => setModalBarbeiroVisible(false)}
            >
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de agenda do barbeiro */}
      <Modal
        visible={!!barbeiroVisualizando}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBarbeiroVisualizando(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Agenda de {barbeiroVisualizando?.nome}
            </Text>
            {getAgendamentosPorBarbeiro(barbeiroVisualizando?.id || 0).length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <FontAwesome name="calendar-o" size={50} color={colors.tabIconDefault} />
                <Text style={[styles.emptyText, { color: colors.secondary }]}>
                  Nenhum agendamento para este barbeiro
                </Text>
              </View>
            ) : (
              <FlatList
                data={getAgendamentosPorBarbeiro(barbeiroVisualizando?.id || 0)}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={[styles.agendamentoItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <View style={styles.agendamentoHeader}>
                      <Text style={[styles.agendamentoHora, { color: colors.primary, fontWeight: 'bold' }]}>
                        {item.hora}
                      </Text>
                      <View style={[styles.statusBadge, {
                        backgroundColor: item.status === 'Pendente' ? colors.secondary :
                                       item.status === 'Confirmado' ? colors.primary :
                                       item.status === 'Concluído' ? colors.success : colors.danger
                      }]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={[styles.agendamentoCliente, { color: colors.text }]}>{item.cliente_nome}</Text>
                    <Text style={[styles.agendamentoServico, { color: colors.secondary }]}>{item.servico}</Text>
                    <View style={styles.agendamentoActions}>
                      {item.status === 'Pendente' && (
                        <>
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                            onPress={() => confirmarAgendamento(item.id)}
                          >
                            <Text style={styles.actionBtnText}>Confirmar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                            onPress={() => cancelarAgendamento(item.id)}
                          >
                            <Text style={styles.actionBtnText}>Cancelar</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {item.status === 'Confirmado' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: colors.success }]}
                          onPress={() => concluirAgendamento(item.id)}
                        >
                          <Text style={styles.actionBtnText}>Concluir</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
                style={styles.agendamentosList}
              />
            )}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
              onPress={() => setBarbeiroVisualizando(null)}
            >
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de seleção de data e hora */}
      <Modal
        visible={modalDataHoraVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalDataHoraVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecionar Data e Hora</Text>

            {!barbeiroSelecionado && (
              <View style={[styles.avisoContainer, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }]}>
                <FontAwesome name="info-circle" size={20} color={colors.secondary} />
                <Text style={[styles.avisoText, { color: colors.secondary }]}>
                  Selecione um barbeiro primeiro para ver os horários disponíveis
                </Text>
              </View>
            )}

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, marginBottom: 10 }]}
              placeholder="Data (DD/MM/AAAA)"
              placeholderTextColor={colors.tabIconDefault}
              value={dataSelecionada}
              onChangeText={(text) => setDataSelecionada(formatarData(text))}
              keyboardType="numeric"
              maxLength={10}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Horários Disponíveis {barbeiroSelecionado && dataSelecionada ? `(${horariosDisponiveis.length})` : ''}:
            </Text>
            
            {horariosDisponiveis.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <FontAwesome name="calendar-times-o" size={50} color={colors.tabIconDefault} />
                <Text style={[styles.emptyText, { color: colors.secondary }]}>
                  Nenhum horário disponível para esta data
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horariosContainer}>
                {horariosDisponiveis.map((hora) => (
                  <TouchableOpacity
                    key={hora}
                    style={[
                      styles.horaBtn,
                      { backgroundColor: horaSelecionada === hora ? colors.primary : colors.cardBackground,
                        borderColor: colors.border }
                    ]}
                    onPress={() => setHoraSelecionada(hora)}
                  >
                    <Text style={[
                      styles.horaText,
                      { color: horaSelecionada === hora ? 'white' : colors.text }
                    ]}>
                      {hora}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={() => setModalDataHoraVisible(false)}
            >
              <Text style={styles.confirmBtnText}>Confirmar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
              onPress={() => setModalDataHoraVisible(false)}
            >
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
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
  scrollContainer: {
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
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  input: {
    paddingLeft: 45,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  clienteCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  clienteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clienteCardInfo: {
    flex: 1,
    gap: 4,
  },
  clienteCardNome: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clienteCardTelefone: {
    fontSize: 14,
  },
  clienteCardAniversario: {
    fontSize: 14,
  },
  clienteCardRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clienteSelecionado: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clienteSelecionadoText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  agendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  agendarBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  barbeirosContainer: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  barbeirosList: {
    maxHeight: 300,
  },
  barbeiroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  barbeiroInfo: {
    flex: 1,
  },
  barbeiroNome: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  barbeiroEspecialidade: {
    fontSize: 14,
  },
  verAgendaBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  verAgendaText: {
    color: 'white',
    fontSize: 12,
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
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  avisoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
    gap: 10,
  },
  avisoText: {
    flex: 1,
    fontSize: 14,
  },
  searchInput: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  resultadosText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  clientesList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  clienteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginBottom: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  clienteInfo: {
    flex: 1,
  },
  clienteNome: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  clienteTelefone: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  agendamentosList: {
    maxHeight: 400,
    marginBottom: 15,
  },
  agendamentoItem: {
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
  agendamentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agendamentoHora: {
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  agendamentoCliente: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  agendamentoServico: {
    fontSize: 14,
    marginBottom: 10,
  },
  agendamentoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  horariosContainer: {
    marginBottom: 20,
  },
  horaBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  horaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  confirmBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeBtn: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  closeBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});