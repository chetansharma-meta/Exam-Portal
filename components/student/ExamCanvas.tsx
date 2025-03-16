"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Exam, ExamSubmission, Student } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import jsPDF from "jspdf";

// Import CanvasDraw dynamically to avoid SSR issues
const CanvasDraw = dynamic(() => import("react-canvas-draw"), {
  ssr: false,
});

interface ExamCanvasProps {
  examId: string;
}

export default function ExamCanvas({ examId }: ExamCanvasProps) {
  const router = useRouter();
  const getExam = useAppStore(state => state.getExam);
  const currentUser = useAppStore(state => state.currentUser);
  const submitExam = useAppStore(state => state.submitExam);
  const savePdfForTeacher = useAppStore(state => state.savePdfForTeacher);

  const [exam, setExam] = useState<Exam | undefined>(undefined);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // Will be set from exam duration
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [canvasesReady, setCanvasesReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for each canvas question
  const canvasRefs = useRef<any[]>([]);

  // Set canvas size based on container size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Subtract padding and border
        const width = Math.max(containerWidth - 40, 300);
        const height = Math.min(width * 0.75, 500); // Maintain aspect ratio with max height
        setCanvasSize({ width, height });
      }
    };

    // Initial update
    updateCanvasSize();

    // Update on window resize
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Initialize canvasRefs
  useEffect(() => {
    if (exam) {
      canvasRefs.current = Array(exam.questions.length)
        .fill(null)
        .map((_, i) => canvasRefs.current[i] || React.createRef());

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

  if (!exam || !currentUser || currentUser.role !== "student") {
    return <div className="p-8 text-center">Loading exam...</div>;
  }

  const student = currentUser as Student;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours > 0 ? `${hours}:` : ""}${minutes < 10 && hours > 0 ? "0" : ""}${minutes}:${
      remainingSeconds < 10 ? "0" : ""
    }${remainingSeconds}`;
  };

  const handleSubmitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Get canvas data from each question
      const answers = exam.questions.map((question, index) => {
        const canvasRef = canvasRefs.current[index];
        let imageData = "";

        try {
          if (canvasRef?.current) {
            imageData = canvasRef.current.getDataURL("png", false);
          }
        } catch (error) {
          console.error("Error getting canvas data:", error);
        }

        return {
          questionId: question.id,
          imageData,
        };
      });

      // Create the submission
      const submission: Omit<ExamSubmission, "id" | "submittedAt"> = {
        examId: exam.id,
        studentId: student.id,
        studentName: student.name,
        rollNo: student.rollNo,
        answers,
      };

      // Submit exam data
      const submittedExam = submitExam(submission);

      // Generate PDF and save it for teacher
      await generatePDFForTeacher(submittedExam);

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/student/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error submitting exam:", error);
      setIsSubmitting(false);
    }
  };

  const generatePDFForTeacher = async (submission: ExamSubmission) => {
    // Create PDF document
    const pdf = new jsPDF();

    // Add student details on first page
    pdf.setFontSize(18);
    pdf.text("Exam Submission", 105, 20, { align: "center" });

    pdf.setFontSize(12);
    pdf.text(`Name: ${student.name}`, 20, 40);
    pdf.text(`Roll Number: ${student.rollNo}`, 20, 50);
    pdf.text(`Exam: ${exam.title}`, 20, 60);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);

    // Add each question and answer to subsequent pages
    exam.questions.forEach((question, index) => {
      pdf.addPage();

      // Add question
      pdf.setFontSize(14);
      pdf.text(`Question ${index + 1}:`, 20, 20);

      // Split long questions into multiple lines
      const splitQuestion = pdf.splitTextToSize(question.text, 170);
      pdf.setFontSize(12);
      pdf.text(splitQuestion, 20, 30);

      // Add answer image
      const answer = submission.answers[index];
      if (answer?.imageData && answer.imageData !== "") {
        try {
          pdf.addImage(answer.imageData, "PNG", 20, 50, 160, 120);
        } catch (e) {
          console.error("Error adding image to PDF:", e);
          // Add error message to PDF
          pdf.text("Error rendering canvas image", 20, 50);
        }
      } else {
        pdf.text("No answer provided", 20, 50);
      }
    });

    // Generate PDF as blob
    const pdfBlob = pdf.output('blob');

    // Create file name format: studentName_rollNo_examId.pdf
    const fileName = `${student.name.replace(/\s+/g, '')}_${student.rollNo}_${exam.id}.pdf`;

    // Save PDF to teacher's dashboard for download
    await savePdfForTeacher({
      examId: exam.id,
      studentId: student.id,
      fileName: fileName,
      pdfBlob: pdfBlob,
      submittedAt: new Date().toISOString()
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
            {canvasesReady && exam.questions.map((_, qIndex) => (
              <div
                key={qIndex}
                style={{
                  display: currentQuestion === qIndex ? "block" : "none",
                  width: `${canvasSize.width}px`,
                  height: `${canvasSize.height}px`
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
                  ref={canvasRefs.current[qIndex]}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4">
            <Button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                const canvasRef = canvasRefs.current[currentQuestion];
                if (canvasRef?.current) {
                  canvasRef.current.clear();
                }
              }}
            >
              Clear Canvas
            </Button>
            <Button
              onClick={() => setCurrentQuestion(prev => Math.min(exam.questions.length - 1, prev + 1))}
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
                onClick={() => setCurrentQuestion(qIndex)}
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
