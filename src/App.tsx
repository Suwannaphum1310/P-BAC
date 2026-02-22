import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBasedRedirect from "@/components/RoleBasedRedirect";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index";
import Grades from "./pages/Grades";
import Login from "./pages/Login";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import Signup from "./pages/auth/Signup";
import Register from "./pages/Register";
import NewsPage from "./pages/NewsPage";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNews from "./pages/admin/AdminNews";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminGrades from "./pages/admin/AdminGrades";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminRooms from "./pages/admin/AdminRooms";
import AdminUserRoles from "./pages/admin/AdminUserRoles";
import AdminApplications from "./pages/admin/AdminApplications";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherSchedule from "./pages/teacher/TeacherSchedule";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentSchedule from "./pages/student/StudentSchedule";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentGrades from "./pages/student/StudentGrades";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/" element={<PageTransition><Index /></PageTransition>} />
                <Route path="/grades" element={<PageTransition><Grades /></PageTransition>} />
                <Route path="/news" element={<PageTransition><NewsPage /></PageTransition>} />
                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                <Route path="/student-login" element={<PageTransition><StudentLogin /></PageTransition>} />
                <Route path="/student-register" element={<PageTransition><StudentRegister /></PageTransition>} />
                <Route path="/auth/signup" element={<PageTransition><Signup /></PageTransition>} />
                <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* Role-based redirect after login */}
                <Route path="/redirect" element={
                  <ProtectedRoute>
                    <RoleBasedRedirect />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/news" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminNews />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/students" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminStudents />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/attendance" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminAttendance />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/grades" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminGrades />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/schedule" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminSchedule />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/subjects" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminSubjects />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/teachers" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminTeachers />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/rooms" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminRooms />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/user-roles" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminUserRoles />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/applications" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminApplications />
                  </ProtectedRoute>
                } />

                {/* Teacher Routes */}
                <Route path="/teacher" element={
                  <ProtectedRoute requiredRole="teacher">
                    <TeacherDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/schedule" element={
                  <ProtectedRoute requiredRole="teacher">
                    <TeacherSchedule />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/attendance" element={
                  <ProtectedRoute requiredRole="teacher">
                    <TeacherAttendance />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/students" element={
                  <ProtectedRoute requiredRole="teacher">
                    <TeacherStudents />
                  </ProtectedRoute>
                } />

                {/* Student Routes */}
                <Route path="/student" element={
                  <ProtectedRoute requiredRole="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/student/schedule" element={
                  <ProtectedRoute requiredRole="student">
                    <StudentSchedule />
                  </ProtectedRoute>
                } />
                <Route path="/student/attendance" element={
                  <ProtectedRoute requiredRole="student">
                    <StudentAttendance />
                  </ProtectedRoute>
                } />
                <Route path="/student/grades" element={
                  <ProtectedRoute requiredRole="student">
                    <StudentGrades />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
