// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { UserRole } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LoginForm() {
  const router = useRouter();
  const login = useAppStore(state => state.login);
  const registerStudent = useAppStore(state => state.registerStudent);
  const registerTeacher = useAppStore(state => state.registerTeacher);
  const fetchSubjects = useAppStore(state => state.fetchSubjects);
  const subjects = useAppStore(state => state.subjects);
  const isLoading = useAppStore(state => state.isLoading);
  const error = useAppStore(state => state.error);

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [role, setRole] = useState<UserRole>("student");

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerRollNo, setRegisterRollNo] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");

  // Fetch subjects when component mounts
  useState(() => {
    fetchSubjects();
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const user = await login(loginUsername, loginPassword, role);

      if (user) {
        router.push(user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
      } else {
        setLoginError("Invalid credentials. Please try again.");
      }
    } catch (error) {
      setLoginError("Login failed. Please try again.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }

    try {
      if (role === "student") {
        await registerStudent({
          name: registerName,
          rollNo: registerRollNo,
          password: registerPassword,
          department,
          semester,
        });
      } else {
        await registerTeacher({
          name: registerName,
          username: registerUsername,
          password: registerPassword,
          department,
        });
      }

      setActiveTab("login");

      // Clear form
      setRegisterName("");
      setRegisterRollNo("");
      setRegisterUsername("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      setDepartment("");
      setSemester("");
    } catch (error) {
      setRegisterError("Registration failed. Please try again.");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Exam System</h1>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="login-username">
                {role === "student" ? "Roll Number" : "Username"}
              </Label>
              <Input
                id="login-username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>I am a:</Label>
              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant={role === "student" ? "default" : "outline"}
                  onClick={() => setRole("student")}
                >
                  Student
                </Button>
                <Button
                  type="button"
                  variant={role === "teacher" ? "default" : "outline"}
                  onClick={() => setRole("teacher")}
                >
                  Teacher
                </Button>
              </div>
            </div>

            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="register">
          <form onSubmit={handleRegister} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="register-name">Full Name</Label>
              <Input
                id="register-name"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
              />
            </div>

            {role === "student" ? (
              <div>
                <Label htmlFor="register-roll-no">Roll Number</Label>
                <Input
                  id="register-roll-no"
                  value={registerRollNo}
                  onChange={(e) => setRegisterRollNo(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="register-username">Username</Label>
                <Input
                  id="register-username"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="register-department">Department</Label>
              <Select onValueChange={setDepartment} value={department}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {role === "student" && (
              <div>
                <Label htmlFor="register-semester">Semester</Label>
                <Select onValueChange={setSemester} value={semester}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="register-confirm-password">Confirm Password</Label>
              <Input
                id="register-confirm-password"
                type="password"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>I am a:</Label>
              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant={role === "student" ? "default" : "outline"}
                  onClick={() => setRole("student")}
                >
                  Student
                </Button>
                <Button
                  type="button"
                  variant={role === "teacher" ? "default" : "outline"}
                  onClick={() => setRole("teacher")}
                >
                  Teacher
                </Button>
              </div>
            </div>

            {registerError && <p className="text-red-500 text-sm">{registerError}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
