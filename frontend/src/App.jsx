import { Routes, Route } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";

// Main Pages
import Home from "../pages/Home";
import Chat from "../pages/Chat";
import Explain from "../pages/Explain";
import Quiz from "../pages/Quiz";
import TestPaper from "../pages/TestPaper";
import StudyPlan from "../pages/StudyPlan";
import Documents from "../pages/Documents";
import FileTools from "../pages/FileTools";
import Profile from "../pages/profile";
import Settings from "../pages/Settings";

// Authentication Pages
import Login from "../pages/Login";
import SignIn from "../pages/Signin";

function App() {
  return (
    <Routes>
      {/* Main OFFSEDU Application */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/explain" element={<Explain />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/test-paper" element={<TestPaper />} />
        <Route path="/study-plan" element={<StudyPlan />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/file-tools" element={<FileTools />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Authentication Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<SignIn />} />
    </Routes>
  );
}

export default App;