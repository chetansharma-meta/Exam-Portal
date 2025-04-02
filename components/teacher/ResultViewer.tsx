"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import { Exam, ExamSubmission, Question, Answer } from "@/lib/types";
import { DownloadIcon } from 'lucide-react';

export default function ResultViewer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");

  const currentUser = useAppStore(state => state.currentUser);
  const getExam = useAppStore(state => state.getExam);
  const getSubmissions = useAppStore(state => state.getSubmissions);
  const evaluateSubmission = useAppStore(state => state.evaluateSubmission);

  const [exam, setExam] = useState<Exam | undefined>(undefined);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [overallFeedback, setOverallFeedback] = useState<string>("");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "teacher") {
      router.push("/");
      return;
    }

    if (!examId) {
      router.push("/teacher/dashboard");
      return;
    }

    const examData = getExam(examId);
    if (!examData) {
      router.push("/teacher/dashboard");
      return;
    }
    setExam(examData);

    const examSubmissions = getSubmissions(examId);
    setSubmissions(examSubmissions);
  }, [currentUser, examId, getExam, getSubmissions, router]);

  const handleSubmissionSelect = (submission: ExamSubmission) => {
    setSelectedSubmission(submission);
    setCurrentQuestionIndex(0);
    setOverallFeedback(submission.feedback || "");
  };

  const handleQuestionFeedbackChange = (questionId: string, feedback: string) => {
    if (!selectedSubmission) return;

    const updatedAnswers = selectedSubmission.answers.map(answer =>
      answer.questionId === questionId ? { ...answer, feedback } : answer
    );

    setSelectedSubmission({
      ...selectedSubmission,
      answers: updatedAnswers
    });
  };

  const handleQuestionCorrectness = (questionId: string, isCorrect: boolean) => {
    if (!selectedSubmission) return;

    const updatedAnswers = selectedSubmission.answers.map(answer =>
      answer.questionId === questionId ? { ...answer, isCorrect } : answer
    );

    setSelectedSubmission({
      ...selectedSubmission,
      answers: updatedAnswers
    });
  };

  const handleEvaluate = () => {
    if (!selectedSubmission) return;

    // Calculate total marks based on correct answers
    const totalMarks = selectedSubmission.answers.reduce(
      (sum, answer) => sum + (answer.isCorrect ? 1 : 0), 0
    );

    const percentage = (totalMarks / exam!.questions.length) * 100;

    const updatedSubmission = evaluateSubmission(
      selectedSubmission.id,
      totalMarks,
      overallFeedback,
    );

    if (updatedSubmission) {
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === updatedSubmission.id ? updatedSubmission : sub
        )
      );
      setSelectedSubmission(updatedSubmission);
    }
  };

  if (!exam) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{exam.title} - Results</h1>
          <p className="text-gray-600">{exam.questions.length} questions, {Math.floor(exam.duration / 60)} minutes</p>
        </div>
        <Button onClick={() => router.push("/teacher/dashboard")} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Submissions ({submissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-gray-500">No submissions yet.</p>
              ) : (
                <div className="space-y-2">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      onClick={() => handleSubmissionSelect(submission)}
                      className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedSubmission?.id === submission.id ? "bg-blue-50 border-blue-300" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{submission.studentName}</h3>
                          <p className="text-sm text-gray-600">Roll No: {submission.rollNo}</p>
                        </div>
                        {submission.evaluated ? (
                          <Badge className={submission.percentage && submission.percentage >= 60 ? "bg-green-600" : "bg-red-600"}>
                            {submission.marks} / {exam.questions.length}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not evaluated</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8">
          {selectedSubmission ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedSubmission.studentName} - {selectedSubmission.rollNo}
                  {selectedSubmission.evaluated && (
                    <Badge className={`ml-2 ${selectedSubmission.percentage && selectedSubmission.percentage >= 60 ? "bg-green-600" : "bg-red-600"}`}>
                      {selectedSubmission.marks} / {exam.questions.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="answers">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="answers">Answers</TabsTrigger>
                    <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="answers">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">
                          Question {currentQuestionIndex + 1} of {exam.questions.length}
                        </h3>
                        <p>{exam.questions[currentQuestionIndex]?.text}</p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">Student's Answer:</h3>
                        {selectedSubmission.answers[currentQuestionIndex]?.text ? (
                          <p className="bg-gray-50 p-3 rounded">
                            {selectedSubmission.answers[currentQuestionIndex].text}
                          </p>
                        ) : (
                          <p className="text-gray-500">No answer provided</p>
                        )}
                      </div>

                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correctness-${currentQuestionIndex}`}
                              checked={selectedSubmission.answers[currentQuestionIndex]?.isCorrect === true}
                              onChange={() => handleQuestionCorrectness(
                                exam.questions[currentQuestionIndex].id,
                                true
                              )}
                            />
                            <span>Correct</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correctness-${currentQuestionIndex}`}
                              checked={selectedSubmission.answers[currentQuestionIndex]?.isCorrect === false}
                              onChange={() => handleQuestionCorrectness(
                                exam.questions[currentQuestionIndex].id,
                                false
                              )}
                            />
                            <span>Incorrect</span>
                          </label>
                        </div>

                        <div>
                          <label className="block font-medium mb-1">Question Feedback</label>
                          <Textarea
                            rows={3}
                            value={selectedSubmission.answers[currentQuestionIndex]?.feedback || ""}
                            onChange={(e) => handleQuestionFeedbackChange(
                              exam.questions[currentQuestionIndex].id,
                              e.target.value
                            )}
                            placeholder="Add specific feedback for this question..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentQuestionIndex === 0}
                        >
                          Previous Question
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentQuestionIndex(prev => Math.min(exam.questions.length - 1, prev + 1))}
                          disabled={currentQuestionIndex === exam.questions.length - 1}
                        >
                          Next Question
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="evaluation">
                    <div className="space-y-4">
                      <div>
                        <label className="block font-medium mb-1">Overall Feedback</label>
                        <Textarea
                          rows={6}
                          value={overallFeedback}
                          onChange={(e) => setOverallFeedback(e.target.value)}
                          placeholder="Provide overall feedback for the student..."
                        />
                      </div>

                      <Button
                        onClick={handleEvaluate}
                        className="w-full"
                        disabled={!selectedSubmission.answers.every(answer => answer.isCorrect !== undefined)}
                      >
                        {selectedSubmission.evaluated ? "Update Evaluation" : "Submit Evaluation"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center border rounded-lg p-8">
              <p className="text-gray-500">Select a submission to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
