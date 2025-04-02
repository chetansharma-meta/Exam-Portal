// app/student/result/[submissionId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { Exam, ExamSubmission, Question } from "@/lib/types";

export default function StudentResultPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.submissionId as string;

  const currentUser = useAppStore(state => state.currentUser);
  const getExam = useAppStore(state => state.getExam);
  const getSubmissions = useAppStore(state => state.getSubmissions);
  const getPdfSubmissions = useAppStore(state => state.getPdfSubmissions);

  const [exam, setExam] = useState<Exam | null>(null);
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [pdfSubmission, setPdfSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "student") {
      router.push("/");
      return;
    }

    const submissionData = getSubmissions().find(sub => sub.id === submissionId);
    if (!submissionData) {
      router.push("/student/dashboard");
      return;
    }

    setSubmission(submissionData);
    const examData = getExam(submissionData.examId);
    setExam(examData || null);

    // Check for PDF submission if needed
    const pdfSubs = getPdfSubmissions(submissionData.examId, currentUser.id);
    if (pdfSubs.length > 0) {
      setPdfSubmission(pdfSubs[0]);
    }

    setIsLoading(false);
  }, [currentUser, getExam, getSubmissions, getPdfSubmissions, submissionId, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!exam || !submission) {
    return (
      <div className="p-8 text-center">
        <p>Result not found</p>
        <Button onClick={() => router.push("/student/dashboard")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: Question['difficulty']) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const handleBack = () => {
    router.push("/student/dashboard");
  };

  const getAnswerFeedback = (questionId: string) => {
    const answer = submission.answers.find(a => a.questionId === questionId);
    return answer?.feedback || "No specific feedback provided";
  };

  const getAnswerText = (questionId: string) => {
    const answer = submission.answers.find(a => a.questionId === questionId);
    return answer?.text || "No answer provided";
  };

  const isAnswerCorrect = (questionId: string) => {
    const answer = submission.answers.find(a => a.questionId === questionId);
    return answer?.isCorrect || false;
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Exam Result: {exam.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <Badge className="text-sm">
              Score: {submission.marks || 0} / {exam.questions.length}
            </Badge>
            <Badge
              className={`text-sm ${
                submission.percentage && submission.percentage >= 60
                  ? "bg-green-600"
                  : "bg-red-600"
              }`}
            >
              {((submission.marks || 0) / exam.questions.length * 100).toFixed(1)}%
            </Badge>
          </div>
        </div>
        <Button variant="outline" onClick={handleBack}>
          Back to Dashboard
        </Button>
      </div>

      {pdfSubmission && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submitted Document</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">{pdfSubmission.fileName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Submitted on {new Date(pdfSubmission.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overall Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="whitespace-pre-wrap">
              {submission.feedback || "No overall feedback provided"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Question-wise evaluation
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {exam.questions.map((question, index) => (
            <div
              key={question.id}
              className="border rounded-lg p-4 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Question {index + 1}</h3>
                  <Badge className={getDifficultyColor(question.difficulty)}>
                    {question.difficulty}
                  </Badge>
                </div>
                <Badge
                  variant={isAnswerCorrect(question.id) ? "default" : "destructive"}
                >
                  {isAnswerCorrect(question.id) ? "Correct" : "Incorrect"}
                </Badge>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Question:</p>
                <p className="font-medium mt-1">{question.text}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Your Answer:</p>
                <p className="font-medium mt-1 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  {getAnswerText(question.id)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Feedback:</p>
                <p className="mt-1 bg-gray-50 dark:bg-gray-800 p-3 rounded whitespace-pre-wrap">
                  {getAnswerFeedback(question.id)}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
