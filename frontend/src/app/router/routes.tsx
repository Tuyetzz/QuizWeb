// app/router/routes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import SubjectsPage from "../../pages/subjects/SubjectsPage";
import ChaptersPage from "../../pages/chapters/ChaptersPage";
import ExamConfigPage from "../../pages/exam-config/ExamConfigPage";
import LoginPage from "../../pages/auth/LoginPage";
import RegisterPage from "../../pages/auth/RegisterPage";
import ProtectedRoute from "./ProtectedRoute";
import AttemptDetailPage from "../../pages/attempts/AttemptDetailPage";

export default function AppRoutes() {
  return (
      <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Các route còn lại thì bảo vệ bằng ProtectedRoute */}
      <Route element={<ProtectedRoute />}>
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/subjects/:id/chapters" element={<ChaptersPage />} />
        <Route path="/subjects/:id/chapters/:chapterId/config" element={<ExamConfigPage />} />
        <Route path="/attempts/:id" element={<AttemptDetailPage />} />
      </Route>
    </Routes>
  );
}
