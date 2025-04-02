"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Exam, ExamSubmission, Student, Answer } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import jsPDF from "jspdf";

// Type declaration for CanvasDraw ref
type CanvasDrawRef = {
  clear: () => void;
  getSaveData: () => string;
  loadSaveData: (data: string, immediate: boolean) => void;
  getDataURL: (type?: string, quality?: any) => string;
};

// Import CanvasDraw dynamically to avoid SSR issues
const CanvasDraw = dynamic(
  () => import("react-canvas-draw").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <p>Loading canvas...</p>,
  }
) as React.ComponentType<any>;

interface ExamCanvasProps {
  examId: string;
}

export default function ExamCanvas({ examId }: ExamCanvasProps) {
  const router = useRouter();
  const getExam = useAppStore((state) => state.getExam);
  const currentUser = useAppStore((state) => state.currentUser);
  const submitExam = useAppStore((state) => state.submitExam);
  const savePdfForTeacher = useAppStore((state) => state.savePdfForTeacher);

  const [exam, setExam] = useState<Exam | undefined>(undefined);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [canvasesReady, setCanvasesReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for each canvas question with proper typing
  const canvasRefs = useRef<(CanvasDrawRef | null)[]>([]);
  // Store canvas data for each question
  const canvasData = useRef<Record<number, string>>({});

  // Set canvas size based on container size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const width = Math.max(containerWidth - 40, 300);
        const height = Math.min(width * 0.75, 500);
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // Initialize canvasRefs
  useEffect(() => {
    if (exam) {
      canvasRefs.current = Array(exam.questions.length)
        .fill(null)
        .map((_, i) => canvasRefs.current[i] || null);

      // Wait for canvas to be ready
      setTimeout(() => {
        setCanvasesReady(true);
      }, 500);
    }
  }, [exam?.questions.length, canvasSize]);

  // Load exam data
  useEffect(() => {
    const examData = getExam(examId);
    if (examData) {
      setExam(examData);
      setTimeLeft(examData.duration);
    } else {
      router.push("/student/dashboard");
    }
  }, [examId, getExam, router]);

  // Timer countdown
  useEffect(() => {
    if (!exam || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, timeLeft]);

  // Save canvas data when switching questions
  const handleQuestionChange = (newIndex: number) => {
    if (!exam) return;

    // Save current canvas data before switching
    const currentRef = canvasRefs.current[currentQuestion];
    if (currentRef) {
      const dataUrl = currentRef.getDataURL("png", false);
      canvasData.current[currentQuestion] = dataUrl;
    }

    // Clear the canvas for the new question if it hasn't been drawn on yet
    if (canvasData.current[newIndex] === undefined) {
      const newRef = canvasRefs.current[newIndex];
      if (newRef) {
        newRef.clear();
      }
    }

    setCurrentQuestion(newIndex);
  };

  if (!exam || !currentUser || currentUser.role !== "student") {
    return <div className="p-8 text-center">Loading exam...</div>;
  }

  const student = currentUser as Student;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours > 0 ? `${hours}:` : ""}${
      minutes < 10 && hours > 0 ? "0" : ""
    }${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleClearCanvas = () => {
    const currentRef = canvasRefs.current[currentQuestion];
    if (currentRef) {
      currentRef.clear();
      delete canvasData.current[currentQuestion];
    }
  };

  const handleSubmitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Save current canvas before submission
      const currentRef = canvasRefs.current[currentQuestion];
      if (currentRef) {
        const dataUrl = currentRef.getDataURL("png", false);
        canvasData.current[currentQuestion] = dataUrl;
      }

      // Get canvas data from each question
      const answers: Answer[] = exam.questions.map((question, index) => {
        return {
          questionId: question.id,
          text: canvasData.current[index] || "", // Use saved canvas data
          isCorrect: false, // Not evaluated yet
        };
      });

      // Create the submission
      const submission: Omit<ExamSubmission, "id" | "submittedAt"> = {
        examId: exam.id,
        studentId: student.id,
        answers,
      };

      // Submit exam data
      const submittedExam = submitExam(submission);

      // Generate PDF and save it for teacher
      await generatePDFForTeacher(submittedExam);

      // Redirect to dashboard
      router.push("/student/dashboard");
    } catch (error) {
      console.error("Error submitting exam:", error);
      setIsSubmitting(false);
    }
  };

  const generatePDFForTeacher = async (submission: ExamSubmission) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add each question and answer to pages
    exam.questions.forEach((question, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      const answer = submission.answers[index];

      // Add question ID
      pdf.setFontSize(12);
      pdf.text(`Question ID: ${question.id}`, 20, 20);

      // Add answer image if exists
      if (answer?.text) {
        try {
          // Calculate image dimensions to fit page (with margins)
          const imgWidth = pageWidth - 40; // 20px margin on each side
          const imgHeight = pageHeight - 60; // 40px top margin, 20px bottom

          pdf.addImage(
            answer.text,
            "PNG",
            20,
            40,
            imgWidth,
            imgHeight,
            undefined,
            "FAST"
          );
        } catch (e) {
          console.error("Error adding image to PDF:", e);
          pdf.text("Error rendering answer", 20, 40);
        }
      } else {
        pdf.text("No answer provided", 20, 40);
      }
    });

    const pdfBlob = pdf.output("blob");
    const fileName = `${student.name.replace(/\s+/g, "")}_${student.rollNo}_${
      exam.id
    }.pdf`;

    await savePdfForTeacher({
      examId: exam.id,
      studentId: student.id,
      fileName: fileName,
      pdfBlob: pdfBlob,
      submittedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="w-full md:w-3/4 p-4 overflow-y-auto" ref={containerRef}>
        <h1 className="text-2xl font-bold mb-4">{exam.title}</h1>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">
            Question {currentQuestion + 1} of {exam.questions.length}:
          </h2>
          <p className="text-lg">{exam.questions[currentQuestion].text}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Answer:</h2>
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            {canvasesReady &&
              exam.questions.map((_, qIndex) => (
                <div
                  key={qIndex}
                  style={{
                    display: currentQuestion === qIndex ? "block" : "none",
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
                  }}
                >
                  <CanvasDraw
                    canvasWidth={canvasSize.width}
                    canvasHeight={canvasSize.height}
                    brushRadius={2}
                    lazyRadius={0}
                    brushColor="#000"
                    backgroundColor="#fff"
                    hideGrid={true}
                    ref={(el: any) => (canvasRefs.current[qIndex] = el)}
                  />
                </div>
              ))}
          </div>

          <div className="flex justify-between mt-4">
            <Button
              onClick={() => handleQuestionChange(currentQuestion - 1)}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            <Button onClick={handleClearCanvas}>Clear Canvas</Button>
            <Button
              onClick={() => handleQuestionChange(currentQuestion + 1)}
              disabled={currentQuestion === exam.questions.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/4 p-4 bg-gray-50 border-l">
        <div className="sticky top-4">
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Time Remaining:</h2>
            <p className="text-2xl font-bold text-center">
              {formatTime(timeLeft)}
            </p>
          </div>

          <h2 className="text-xl font-semibold mb-2">Questions:</h2>
          <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
            {exam.questions.map((_, qIndex) => (
              <Button
                key={qIndex}
                onClick={() => handleQuestionChange(qIndex)}
                variant={currentQuestion === qIndex ? "default" : "outline"}
                className="h-10 w-full"
              >
                {qIndex + 1}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleSubmitExam}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Exam"}
          </Button>
        </div>
      </div>
    </div>
  );
}
