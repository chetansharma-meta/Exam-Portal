// components/teacher/TeacherDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { Exam, ExamSubmission } from "@/lib/types";

export default function TeacherDashboard() {
  const router = useRouter();
  const currentUser = useAppStore(state => state.currentUser);
  const getExams = useAppStore(state => state.getExams);
  const getSubmissions = useAppStore(state => state.getSubmissions);
  const logout = useAppStore(state => state.logout);

  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);

  useEffect(() => {
    // Ensure user is a teacher
    if (!currentUser || currentUser.role !== "teacher") {
      router.push("/");
      return;
    }

    // Get teacher's exams
    const teacherExams = getExams(currentUser.id);
    setExams(teacherExams);

    // Get all submissions
    const allSubmissions = getSubmissions();
    setSubmissions(allSubmissions);
  }, [currentUser, getExams, getSubmissions, router]);

  if (!currentUser || currentUser.role !== "teacher") {
    return null;
  }

  const handleCreateTest = () => {
    router.push("/teacher/create-test");
  };

  const handleViewResults = (examId: string) => {
    router.push(`/teacher/results?examId=${examId}`);
  };

  const handlePreviewTest = (examId: string) => {
    router.push(`/teacher/preview/${examId}`);
  };

  const handleToggleExamActive = (examId: string, isActive: boolean) => {
    // In a real app with a database, you would update the exam status here
    // For now, we're just updating the state
    setExams(prev =>
      prev.map(exam =>
        exam.id === examId ? { ...exam, isActive } : exam
      )
    );
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getSubmissionCountForExam = (examId: string) => {
    return submissions.filter(sub => sub.examId === examId).length;
  };

  const getPendingEvaluationCount = (examId: string) => {
    return submissions.filter(sub => sub.examId === examId && !sub.evaluated).length;
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-gray-600">Welcome, {currentUser.name}</p>
        </div>

        <div className="flex gap-4">
          <Button onClick={handleCreateTest}>Create New Test</Button>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't created any tests yet.</p>
              <Button onClick={handleCreateTest}>Create Your First Test</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {exams.map((exam) => {
                const submissionCount = getSubmissionCountForExam(exam.id);
                const pendingCount = getPendingEvaluationCount(exam.id);

                return (
                  <div key={exam.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold">{exam.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`active-${exam.id}`}
                          checked={exam.isActive}
                          onCheckedChange={(isActive) =>
                            handleToggleExamActive(exam.id, isActive)
                          }
                        />
                        <Label htmlFor={`active-${exam.id}`}>
                          {exam.isActive ? "Active" : "Inactive"}
                        </Label>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">
                        {exam.questions.length} questions
                      </Badge>
                      <Badge variant="outline">
                        {Math.floor(exam.duration / 60)} minutes
                      </Badge>
                      <Badge variant="outline">
                        {submissionCount} submissions
                      </Badge>
                      {pendingCount > 0 && (
                        <Badge className="bg-yellow-500">
                          {pendingCount} pending evaluation
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePreviewTest(exam.id)}
                      >
                        Preview
                      </Button>
                      <Button
                        onClick={() => handleViewResults(exam.id)}
                        disabled={submissionCount === 0}
                      >
                        View Results
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
