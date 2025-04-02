"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { Exam, Question } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

export default function TestPreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const getExam = useAppStore(state => state.getExam);
  const updateExam = useAppStore(state => state.updateExam);
  const currentUser = useAppStore(state => state.currentUser);

  const [exam, setExam] = useState<Exam | undefined>(undefined);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedExam, setEditedExam] = useState<Exam | null>(null);

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
    setEditedExam({ ...examData });
  }, [currentUser, getExam, params.id, router]);

  if (!exam || !editedExam) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const getDifficultyColor = (difficulty: Question['difficulty']) => {
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

  const handlePublishToggle = () => {
    const updatedExam = { ...editedExam, isActive: !editedExam.isActive };
    updateExam(updatedExam);
    setExam(updatedExam);
    setEditedExam(updatedExam);
    toast({
      title: "Success",
      description: `Exam ${updatedExam.isActive ? "published" : "unpublished"} successfully`,
    });
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Save changes when exiting edit mode
      updateExam(editedExam);
      setExam(editedExam);
      toast({
        title: "Success",
        description: "Exam updated successfully",
      });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedExam({ ...editedExam, title: e.target.value });
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedExam({ ...editedExam, subject: e.target.value });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedExam({ ...editedExam, duration: Number(e.target.value) * 60 });
  };

  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const updatedQuestions = [...editedExam.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], text: e.target.value };
    setEditedExam({ ...editedExam, questions: updatedQuestions });
  };

  const handleQuestionDifficultyChange = (value: string, index: number) => {
    const updatedQuestions = [...editedExam.questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      difficulty: value as Question['difficulty']
    };
    setEditedExam({ ...editedExam, questions: updatedQuestions });
  };

  const calculateTotalPoints = () => {
    return exam.questions.length;
  };

  interface ExtendedQuestion extends Question {
    options?: Array<{
      text: string;
      isCorrect: boolean;
    }>;
    explanation?: string;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        {isEditing ? (
          <input
            type="text"
            value={editedExam.title}
            onChange={handleTitleChange}
            className="text-2xl font-bold border rounded px-2 py-1 w-full max-w-md"
          />
        ) : (
          <h1 className="text-2xl font-bold">Exam Preview: {exam.title}</h1>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={handleEditToggle}>
            {isEditing ? "Save Changes" : "Edit Exam"}
          </Button>
          <Button
            onClick={handlePublishToggle}
            variant={exam.isActive ? "destructive" : "default"}
          >
            {exam.isActive ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Exam Information</CardTitle>
            {isEditing ? (
              <input
                type="text"
                value={editedExam.subject || ""}
                onChange={handleSubjectChange}
                placeholder="Subject"
                className="border rounded px-2 py-1 text-sm"
              />
            ) : (
              <Badge variant="outline">{exam.subject || "No Subject"}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-500">Description</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editedExam.title}
                  onChange={handleTitleChange}
                  className="border rounded px-2 py-1 w-full"
                />
              ) : (
                <p>{exam.title}</p>
              )}
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-gray-500">Time Limit (minutes)</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={Math.floor(editedExam.duration / 60)}
                    onChange={handleDurationChange}
                    className="border rounded px-2 py-1 w-20"
                  />
                ) : (
                  <p>{Math.floor(exam.duration / 60)}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Questions</p>
                <p>{exam.questions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Points</p>
                <p>{calculateTotalPoints()}</p>
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
              {isEditing ? (
                <select
                  value={editedExam.questions[currentQuestion].difficulty}
                  onChange={(e) => handleQuestionDifficultyChange(e.target.value, currentQuestion)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              ) : (
                <Badge className={getDifficultyColor(exam.questions[currentQuestion].difficulty)}>
                  {exam.questions[currentQuestion].difficulty}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm text-gray-500">Question</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedExam.questions[currentQuestion].text}
                    onChange={(e) => handleQuestionTextChange(e, currentQuestion)}
                    className="font-medium border rounded px-2 py-1 w-full"
                  />
                ) : (
                  <p className="font-medium">{exam.questions[currentQuestion].text}</p>
                )}
              </div>

              {(exam.questions[currentQuestion] as ExtendedQuestion).options && (
                <div>
                  <p className="text-sm text-gray-500">Options</p>
                  <div className="flex flex-col gap-2 mt-2">
                    {(exam.questions[currentQuestion] as ExtendedQuestion).options?.map((option, index) => (
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
              )}

              <div>
                <p className="text-sm text-gray-500">Points</p>
                <p>1</p>
              </div>

              {(exam.questions[currentQuestion] as ExtendedQuestion).explanation && (
                <div>
                  <p className="text-sm text-gray-500">Explanation</p>
                  <p>{(exam.questions[currentQuestion] as ExtendedQuestion).explanation}</p>
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
            <Button className="mt-4" onClick={handleEditToggle}>
              Add Questions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
