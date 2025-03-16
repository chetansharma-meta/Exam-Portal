// components/student/StudentDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { Exam, ExamSubmission, Student } from "@/lib/types";

export default function StudentDashboard() {
  const router = useRouter();
  const currentUser = useAppStore(state => state.currentUser);
  const getExams = useAppStore(state => state.getExams);
  const getSubmissions = useAppStore(state => state.getSubmissions);
  const logout = useAppStore(state => state.logout);

  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);

  useEffect(() => {
    // Ensure user is a student
    if (!currentUser || currentUser.role !== "student") {
      router.push("/");
      return;
    }

    // Get all active exams
    const allExams = getExams().filter(exam => exam.isActive);
    setAvailableExams(allExams);

    // Get student's submissions
    const studentSubmissions = getSubmissions(undefined, currentUser.id);
    setSubmissions(studentSubmissions);
  }, [currentUser, getExams, getSubmissions, router]);

  if (!currentUser || currentUser.role !== "student") {
    return null;
  }

  const student = currentUser as Student;

  // Filter out exams that student has already taken
  const uncompletedExams = availableExams.filter(
    exam => !submissions.some(sub => sub.examId === exam.id)
  );

  const handleStartExam = (examId: string) => {
    router.push(`/student/exam/${examId}`);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-gray-600">Welcome, {student.name} ({student.rollNo})</p>
        </div>

        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {uncompletedExams.length === 0 ? (
              <p className="text-gray-500">No exams available at the moment.</p>
            ) : (
              <div className="space-y-4">
                {uncompletedExams.map((exam) => (
                  <div key={exam.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{exam.title}</h3>
                      <Badge>{exam.questions.length} questions</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Duration: {Math.floor(exam.duration / 60)} minutes
                    </p>
                    <Button onClick={() => handleStartExam(exam.id)}>
                      Start Exam
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Results</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-gray-500">No exam submissions yet.</p>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => {
                  const exam = availableExams.find(e => e.id === submission.examId);
                  return (
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">
                          {exam?.title || "Unknown Exam"}
                        </h3>
                        {submission.evaluated ? (
                          <Badge className={submission.percentage && submission.percentage >= 60 ? "bg-green-600" : "bg-red-600"}>
                            {submission.percentage?.toFixed(1)}%
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not evaluated</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                      {submission.evaluated && (
                        <>
                          <p className="text-sm font-medium mt-2">
                          // components/student/StudentDashboard.tsx (continued)
                            Marks: {submission.marks} / {exam?.questions.length}
                          </p>
                          {submission.feedback && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Feedback:</p>
                              <p className="text-sm text-gray-600 mt-1">{submission.feedback}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
