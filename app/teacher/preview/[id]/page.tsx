"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { Exam, DifficultyLevel } from "@/lib/types";

export default function TestPreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const getExam = useAppStore(state => state.getExam);
  const currentUser = useAppStore(state => state.currentUser);

  const [exam, setExam] = useState<Exam | undefined>(undefined);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    // Ensure user is a teacher
    if (!currentUser || currentUser.role !== "teacher") {
      router.push("/");
      return;
    }

    // Get exam details
    const examData = getExam(params.id);
    if (!examData) {
      router.push("/teacher/dashboard");
      return;
    }
    setExam(examData);
  }, [currentUser, getExam, params.id, router]);

  if (!exam) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleBack = () => {
    router.push("/teacher/dashboard");
  };

  const handlePublish = () => {
    router.push(`/teacher/publish/${params.id}`);
  };

  const handleEdit = () => {
    router.push(`/teacher/exam/edit/${params.id}`);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exam Preview: {exam.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            Edit Exam
          </Button>
          <Button onClick={handlePublish}>
            Publish Exam
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Exam Information</CardTitle>
            <Badge variant="outline">{exam.subject}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p>{exam.description}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-gray-500">Time Limit</p>
                <p>{exam.timeLimit} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Questions</p>
                <p>{exam.questions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Points</p>
                <p>{exam.questions.reduce((sum, q) => sum + q.points, 0)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {exam.questions.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Question {currentQuestion + 1} of {exam.questions.length}
              </CardTitle>
              <Badge className={getDifficultyColor(exam.questions[currentQuestion].difficulty)}>
                {exam.questions[currentQuestion].difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm text-gray-500">Question</p>
                <p className="font-medium">{exam.questions[currentQuestion].text}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Options</p>
                <div className="flex flex-col gap-2 mt-2">
                  {exam.questions[currentQuestion].options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-md ${
                        option.isCorrect ? "border-green-500 bg-green-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{option.text}</span>
                        {option.isCorrect && (
                          <Badge className="ml-auto" variant="outline">
                            Correct Answer
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Points</p>
                <p>{exam.questions[currentQuestion].points}</p>
              </div>

              {exam.questions[currentQuestion].explanation && (
                <div>
                  <p className="text-sm text-gray-500">Explanation</p>
                  <p>{exam.questions[currentQuestion].explanation}</p>
                </div>
              )}

              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0}
                >
                  Previous Question
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestion === exam.questions.length - 1}
                >
                  Next Question
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No questions added to this exam yet.</p>
            <Button className="mt-4" onClick={handleEdit}>
              Add Questions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
