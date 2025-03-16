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
import { Exam, ExamSubmission } from "@/lib/types";
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

  // Evaluation form
  const [marks, setMarks] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    // Ensure user is a teacher
    if (!currentUser || currentUser.role !== "teacher") {
      router.push("/");
      return;
    }

    if (!examId) {
      router.push("/teacher/dashboard");
      return;
    }

    // Get exam details
    const examData = getExam(examId);
    if (!examData) {
      router.push("/teacher/dashboard");
      return;
    }
    setExam(examData);

    // Get submissions for this exam
    const examSubmissions = getSubmissions(examId);
    setSubmissions(examSubmissions);
  }, [currentUser, examId, getExam, getSubmissions, router]);

  const handleSubmissionSelect = (submission: ExamSubmission) => {
    setSelectedSubmission(submission);
    setCurrentQuestionIndex(0);

    // If already evaluated, pre-fill the form
    if (submission.evaluated && submission.marks !== undefined) {
      setMarks(submission.marks);
      setFeedback(submission.feedback || "");
    } else {
      // Reset form for new evaluation
      setMarks(0);
      setFeedback("");
    }
  };

  const handleEvaluate = () => {
    if (!selectedSubmission) return;

    // Submit evaluation
    const updatedSubmission = evaluateSubmission(
      selectedSubmission.id,
      marks,
      feedback
    );

    if (updatedSubmission) {
      // Update the submissions list
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === updatedSubmission.id ? updatedSubmission : sub
        )
      );

      // Update selected submission
      setSelectedSubmission(updatedSubmission);
    }
  };

  // Function to generate PDF for a specific student
  const generateStudentPDF = (submission: ExamSubmission) => {
    if (!exam) return;

    // This would typically use a library like jsPDF or pdfmake
    // For now, we'll simulate by preparing the data that would go into the PDF
    const pdfData = {
      examTitle: exam.title,
      studentName: submission.studentName,
      rollNo: submission.rollNo,
      marks: submission.marks || 0,
      totalMarks: exam.questions.length,
      percentage: submission.percentage || 0,
      feedback: submission.feedback || "",
      date: new Date().toLocaleDateString(),
      questions: exam.questions.map((q, idx) => ({
        question: q.text,
        answerProvided: submission.answers[idx]?.imageData ? "Yes (Image)" : "No"
      }))
    };

    // In a real implementation, we would generate and download the PDF here
    console.log("Generating PDF for student:", pdfData);

    // Mock download - in production, replace with actual PDF generation
    alert(`Downloading PDF for ${submission.studentName} - ${submission.rollNo}`);
  };

  // Function to generate PDF for all students
  const generateAllResultsPDF = () => {
    if (!exam || submissions.length === 0) return;

    // This would prepare data for all students
    const pdfData = {
      examTitle: exam.title,
      date: new Date().toLocaleDateString(),
      students: submissions.map(sub => ({
        name: sub.studentName,
        rollNo: sub.rollNo,
        marks: sub.marks || 0,
        totalMarks: exam.questions.length,
        percentage: sub.percentage || 0,
        status: (sub.percentage || 0) >= 60 ? "Pass" : "Fail",
        evaluated: sub.evaluated
      }))
    };

    // In a real implementation, we would generate and download the PDF here
    console.log("Generating PDF for all students:", pdfData);

    // Mock download - in production, replace with actual PDF generation
    alert(`Downloading results for all students for ${exam.title}`);
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

        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => selectedSubmission && generateStudentPDF(selectedSubmission)}
                disabled={!selectedSubmission}
                className={!selectedSubmission ? "text-gray-400 cursor-not-allowed" : ""}
              >
                Current Student
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generateAllResultsPDF}>
                All Results
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.push("/teacher/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>
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
                        <div className="flex items-center space-x-2">
                          {submission.evaluated ? (
                            <Badge className={submission.percentage && submission.percentage >= 60 ? "bg-green-600" : "bg-red-600"}>
                              {submission.marks} / {exam.questions.length}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not evaluated</Badge>
                          )}
                          <Button
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              generateStudentPDF(submission);
                            }}
                          >
                            <DownloadIcon className="h-4 w-4" />
                          </Button>
                        </div>
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
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {selectedSubmission.studentName} - {selectedSubmission.rollNo}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {selectedSubmission.evaluated && (
                      <Badge className={selectedSubmission.percentage && selectedSubmission.percentage >= 60 ? "bg-green-600" : "bg-red-600"}>
                        {selectedSubmission.marks} / {exam.questions.length}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                      onClick={() => generateStudentPDF(selectedSubmission)}
                    >
                      <DownloadIcon className="h-4 w-4 mr-1" /> PDF
                    </Button>
                  </div>
                </div>
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
                        {selectedSubmission.answers[currentQuestionIndex]?.imageData ? (
                          <div className="border bg-gray-50 rounded-lg overflow-hidden">
                            <img
                              src={selectedSubmission.answers[currentQuestionIndex].imageData}
                              alt="Student answer"
                              className="w-full h-auto"
                            />
                          </div>
                        ) : (
                          <p className="text-gray-500">No answer provided</p>
                        )}
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
                        <label className="block font-medium mb-1">
                          Marks (out of {exam.questions.length})
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={exam.questions.length}
                          value={marks}
                          onChange={(e) => setMarks(Number(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="block font-medium mb-1">Feedback</label>
                        <Textarea
                          rows={4}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Provide feedback for the student..."
                        />
                      </div>

                      <Button onClick={handleEvaluate} className="w-full">
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
