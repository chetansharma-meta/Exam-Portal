// components/teacher/TestCreator.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store";
import { Exam, Question } from "@/lib/types";
import { generateId } from "@/lib/store";
import { toast } from "@/components/ui/use-toast";

type DifficultyLevel = 'easy' | 'medium' | 'hard';

export default function TestCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("id");

  const currentUser = useAppStore(state => state.currentUser);
  const createExam = useAppStore(state => state.createExam);
  const updateExam = useAppStore(state => state.updateExam);
  const exams = useAppStore(state => state.exams);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const [isActive, setIsActive] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // New question form state
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState<DifficultyLevel>("medium");

  // Validation
  const [errors, setErrors] = useState({
    title: "",
    questions: "",
  });

  // Load exam data if in edit mode
  useEffect(() => {
    if (examId) {
      const examToEdit = exams.find(exam => exam.id === examId);
      if (examToEdit) {
        setTitle(examToEdit.title);
        setSubject(examToEdit.subject || "");
        setDuration(examToEdit.duration / 60); // Convert seconds to minutes
        setIsActive(examToEdit.isActive);
        setQuestions(examToEdit.questions);
        setIsEditMode(true);
      } else {
        // Handle invalid exam ID
        toast({
          title: "Error",
          description: "Exam not found",
          variant: "destructive"
        });
        router.push("/teacher/dashboard");
      }
    }
  }, [examId, exams, router]);

  // Ensure user is a teacher
  useEffect(() => {
    if (!currentUser || currentUser.role !== "teacher") {
      router.push("/");
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== "teacher") {
    return null;
  }

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) {
      setErrors(prev => ({ ...prev, questions: "Question text cannot be empty" }));
      return;
    }

    const question: Question = {
      id: generateId(),
      text: newQuestion.trim(),
      difficulty: newQuestionDifficulty,
    };

    setQuestions(prev => [...prev, question]);
    setNewQuestion("");
    setErrors(prev => ({ ...prev, questions: "" }));
  };

  const handleRemoveQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const validateForm = () => {
    const newErrors = {
      title: !title.trim() ? "Title is required" : "",
      questions: questions.length === 0 ? "At least one question is required" : "",
    };

    setErrors(newErrors);
    return !newErrors.title && !newErrors.questions;
  };

  const handleSaveTest = () => {
    if (!validateForm()) {
      return;
    }

    const examData: Partial<Exam> = {
      title,
      subject,
      createdBy: currentUser.id,
      questions,
      duration: duration * 60, // Convert minutes to seconds
      isActive,
    };

    if (isEditMode && examId) {
      // Update existing exam
      updateExam({
        id: examId,
        ...examData,
      } as Exam);
      toast({
        title: "Success",
        description: `Exam ${isActive ? "published" : "saved as draft"} successfully`,
      });
    } else {
      // Create new exam
      createExam({
        ...examData,
      } as Exam);
      toast({
        title: "Success",
        description: `Exam ${isActive ? "published" : "saved as draft"} successfully`,
      });
    }

    // Navigate back to dashboard
    router.push("/teacher/dashboard");
  };

  const handlePreview = () => {
    // In a real app, you might want to save a draft and preview it
    if (!validateForm()) {
      return;
    }

    // For this demo, we'll just show a simple alert with the exam details
    const questionCount = questions.length;
    const previewText = `
      Title: ${title}
      ${subject ? `Subject: ${subject}` : ''}
      Duration: ${duration} minutes
      Questions: ${questionCount} (${questions.filter(q => q.difficulty === 'easy').length} easy,
      ${questions.filter(q => q.difficulty === 'medium').length} medium,
      ${questions.filter(q => q.difficulty === 'hard').length} hard)
      Status: ${isActive ? 'Published' : 'Draft'}
    `;
    alert(previewText);
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? "Edit Test" : "Create New Test"}
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Test Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors(prev => ({ ...prev, title: "" }));
                  }
                }}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={5}
                max={180}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active-status"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="active-status">
                {isActive ? "Published" : "Draft"}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          Question {index + 1}
                        </h3>
                        <p className="mt-1">{question.text}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveQuestion(question.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No questions added yet.</p>
              </div>
            )}

            {errors.questions && (
              <p className="text-red-500 text-sm">{errors.questions}</p>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Add New Question</h3>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="question-text">Question Text</Label>
                  <Textarea
                    id="question-text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter your question here..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={newQuestionDifficulty}
                    onValueChange={(value) => setNewQuestionDifficulty(value as DifficultyLevel)}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleAddQuestion}>Add Question</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/teacher/dashboard")}>
          Cancel
        </Button>
        <div className="space-x-3">
          <Button variant="outline" onClick={handlePreview}>
            Preview Test
          </Button>
          <Button onClick={handleSaveTest}>
            {isEditMode ? "Update" : "Create"} {isActive ? "& Publish" : "& Save Draft"}
          </Button>
        </div>
      </div>
    </div>
  );
}
