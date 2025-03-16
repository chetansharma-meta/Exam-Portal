import React, { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"

const CanvasDraw = dynamic(() => import("react-canvas-draw"), {
  ssr: false,
})

const questions = [
  "What are the main causes of climate change?",
  "Explain the process of photosynthesis.",
  "Describe the impact of industrialization on society.",
  "What are the key principles of democracy?",
  "How does the water cycle work?",
]

export default function ExamPage({ studentDetails }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState(3600) // 1 hour in seconds
  const canvasRefs = useRef(questions.map(() => React.createRef()))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleSavePDF = () => {
    const pdf = new jsPDF()

    // Add student details
    pdf.setFontSize(16)
    pdf.text("Student Details:", 10, 10)
    pdf.setFontSize(12)
    pdf.text(`Name: ${studentDetails.name}`, 10, 20)
    pdf.text(`Student ID: ${studentDetails.studentId}`, 10, 30)

    questions.forEach((question, index) => {
      pdf.addPage()

      // Add question
      pdf.setFontSize(16)
      pdf.text(`Question ${index + 1}:`, 10, 10)
      const splitQuestion = pdf.splitTextToSize(question, 180)
      pdf.setFontSize(12)
      pdf.text(splitQuestion, 10, 20)

      // Add answer
      const canvasRef = canvasRefs.current[index]
      if (canvasRef && canvasRef.current) {
        const canvas = canvasRef.current.canvas.drawing
        const imgData = canvas.toDataURL("image/png")
        const imgHeight = (canvas.height * 190) / canvas.width
        pdf.addImage(imgData, "PNG", 10, 40, 190, imgHeight)
      }
    })

    pdf.save("exam-answers.pdf")
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  return (
    <div className="flex">
      <div className="w-3/4 pr-4">
        <h1 className="text-3xl font-bold mb-4">Exam</h1>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Question {currentQuestion + 1}:</h2>
          <p className="text-lg">{questions[currentQuestion]}</p>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Answer:</h2>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {questions.map((_, index) => (
              <div key={index} style={{ display: currentQuestion === index ? "block" : "none" }}>
                <CanvasDraw
                  ref={canvasRefs.current[index]}
                  brushRadius={2}
                  lazyRadius={0}
                  canvasWidth={600}
                  canvasHeight={400}
                  brushColor="#000"
                  backgroundColor="#fff"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-1/4 pl-4 border-l">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Time Left:</h2>
          <p className="text-lg">{formatTime(timeLeft)}</p>
        </div>
        <h2 className="text-xl font-semibold mb-2">Questions:</h2>
        <div className="space-y-2">
          {questions.map((_, index) => (
            <Button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              variant={currentQuestion === index ? "default" : "outline"}
            >
              Question {index + 1}
            </Button>
          ))}
        </div>
        <Button onClick={handleSavePDF} className="mt-4">
          Submit Exam
        </Button>
      </div>
    </div>
  )
}

