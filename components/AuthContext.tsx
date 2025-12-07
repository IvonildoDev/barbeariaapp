import React, { createContext, ReactNode, useContext, useState } from 'react';

interface Funcionario {
  nome: string;
  matricula: string;
}

interface AuthContextType {
  funcionario: Funcionario | null;
  login: (nome: string, matricula: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);

  const login = (nome: string, matricula: string) => {
    setFuncionario({ nome, matricula });
  };

  const logout = () => {
    setFuncionario(null);
  };

  return (
    <AuthContext.Provider value={{ funcionario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};