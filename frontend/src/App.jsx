import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell";
import { useApp } from "./context/AppContext";

const LandingPage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import("./pages/PublicPages").then((module) => ({ default: module.SignupPage })));
const DashboardPage = lazy(() => import("./pages/WorkspacePages").then((module) => ({ default: module.DashboardPage })));
const HistoryPage = lazy(() => import("./pages/WorkspacePages").then((module) => ({ default: module.HistoryPage })));
const ReportPage = lazy(() => import("./pages/WorkspacePages").then((module) => ({ default: module.ReportPage })));
const ResumePage = lazy(() => import("./pages/PracticePages").then((module) => ({ default: module.ResumePage })));
const SetupPage = lazy(() => import("./pages/PracticePages").then((module) => ({ default: module.SetupPage })));
const InterviewRoomPage = lazy(() => import("./pages/PracticePages").then((module) => ({ default: module.InterviewRoomPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function LoadingScreen() {
  return <div className="loading-screen"><div className="loading-mark">✳</div><span>Getting your space ready...</span></div>;
}

function ProtectedRoute({ children }) {
  const { user, authLoading } = useApp();
  const location = useLocation();
  if (authLoading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

export default function App() {
  return <Suspense fallback={<LoadingScreen />}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/room" element={<ProtectedRoute><InterviewRoomPage /></ProtectedRoute>} />
    <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/resume" element={<ResumePage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}
