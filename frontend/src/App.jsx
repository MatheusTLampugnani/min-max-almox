import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/auth/useAuth.jsx';
import { LoginPage } from './modules/auth/LoginPage.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { Header } from './components/layout/Header.jsx';
import { ConsultaPage } from './modules/itens/ConsultaPage.jsx';
import { SolicitacoesPage } from './modules/solicitacoes/SolicitacoesPage.jsx';
import { HistoricoPage } from './modules/historico/HistoricoPage.jsx';
import { DashboardPage } from './modules/dashboard/DashboardPage.jsx';
import { AnaliseDistorcaoPage } from './modules/itens/AnaliseDistorcaoPage.jsx';

function RotasAutenticadas() {
  const { autenticado } = useAuth();

  if (!autenticado) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-videplast-bg flex flex-col text-videplast-dark">
      <Header />
      <main className="flex-1 pb-12">
        <Routes>
          <Route path="/" element={<ConsultaPage />} />
          <Route path="/solicitacoes" element={<SolicitacoesPage />} />
          <Route path="/historico" element={<HistoricoPage />} />
          <Route path="/analise" element={<AnaliseDistorcaoPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
<<<<<<< HEAD
        <BrowserRouter>
          <RotasAutenticadas />
=======
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <div className="min-h-screen bg-videplast-bg flex flex-col text-videplast-dark">
            <Header />
            <main className="flex-1 pb-12">
              <Routes>
                <Route path="/" element={<ConsultaPage />} />
                <Route path="/solicitacoes" element={<SolicitacoesPage />} />
                <Route path="/historico" element={<HistoricoPage />} />
                <Route path="/analise" element={<AnaliseDistorcaoPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

            </main>
          </div>
>>>>>>> 77f560be5b094337d6efa65e6e543be2b1969a0a
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
