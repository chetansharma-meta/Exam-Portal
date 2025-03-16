"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { generateExamPDF } from "../utils/pdfUtils"

const CanvasDraw = dynamic(() => import("react-canvas-draw"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
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
  const [canvasStates, setCanvasStates] = useState(questions.map(() => null))
  const canvasRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (canvasRef.current) {
      if (canvasStates[currentQuestion]) {
        canvasRef.current.loadSaveData(canvasStates[currentQuestion], true)
      } else {
        canvasRef.current.clear()
      }
    }
  }, [currentQuestion, canvasStates])

  const handleSavePDF = async () => {
    saveCurrentCanvas() // Save the current canvas before generating PDF
    await generateExamPDF(studentDetails, questions, canvasStates)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      saveCurrentCanvas()
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      saveCurrentCanvas()
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const saveCurrentCanvas = () => {
    if (canvasRef.current) {
      const saveData = canvasRef.current.getSaveData()
      setCanvasStates((prevStates) => {
        const newStates = [...prevStates]
        newStates[currentQuestion] = saveData
        return newStates
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Exam</h1>
        <div className="text-xl font-semibold">Time Left: {formatTime(timeLeft)}</div>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">
          Question {currentQuestion + 1} of {questions.length}:
        </h2>
        <p className="text-lg mb-4">{questions[currentQuestion]}</p>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <CanvasDraw
            ref={canvasRef}
            brushRadius={2}
            lazyRadius={0}
            canvasWidth={800}
            canvasHeight={400}
            brushColor="#000"
            backgroundColor="#fff"
          />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Button onClick={handlePreviousQuestion} disabled={currentQuestion === 0}>
          Previous Question
        </Button>
        <div>
          Question {currentQuestion + 1} of {questions.length}
        </div>
        {currentQuestion === questions.length - 1 ? (
          <Button onClick={handleSavePDF}>Submit Exam</Button>
        ) : (
          <Button onClick={handleNextQuestion}>Next Question</Button>
        )}
      </div>
    </div>
  )
}

