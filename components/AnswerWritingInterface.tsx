"use client"

import type React from "react"
import { useState, useRef } from "react"
import dynamic from "next/dynamic"

const CanvasDraw = dynamic(() => import("react-canvas-draw"), { ssr: false })

interface Question {
  id: number
  text: string
  marks: number
}

interface Props {
  question: Question
  onSubmit: (answer: {
    questionId: number
    handwrittenText: string
    extractedText: string
    translatedText: string
  }) => void
  preferredLanguage: string
  onNext: () => void
}

const AnswerWritingInterface: React.FC<Props> = ({ question, onSubmit, preferredLanguage, onNext }) => {
  const [extractedText, setExtractedText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const canvasRef = useRef<any>(null)

  const handleSaveAnswer = async () => {
    if (canvasRef.current) {
      const handwrittenText = canvasRef.current.getSaveData()

      // Simulate OCR (replace with actual OCR API call in production)
      const extractedText = `Simulated OCR text for question ${question.id}`
      setExtractedText(extractedText)

      // Simulate translation (replace with actual translation API call in production)
      const translatedText =
        preferredLanguage !== "en"
          ? `Translated text for question ${question.id} in ${preferredLanguage}`
          : extractedText
      setTranslatedText(translatedText)

      onSubmit({
        questionId: question.id,
        handwrittenText,
        extractedText,
        translatedText,
      })
    }
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Question {question.id}</h2>
      <p className="mb-2">{question.text}</p>
      <p className="mb-2">Marks: {question.marks}</p>
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
      <div className="mt-4 flex space-x-4">
        <button onClick={handleSaveAnswer} className="bg-green-500 text-white px-4 py-2 rounded">
          Save Answer
        </button>
        <button onClick={onNext} className="bg-blue-500 text-white px-4 py-2 rounded">
          Next Question
        </button>
      </div>
      {extractedText && (
        <div className="mt-4">
          <h3 className="font-semibold">Extracted Text:</h3>
          <p>{extractedText}</p>
        </div>
      )}
      {translatedText && preferredLanguage !== "en" && (
        <div className="mt-4">
          <h3 className="font-semibold">Translated Text:</h3>
          <p>{translatedText}</p>
        </div>
      )}
    </div>
  )
}

export default AnswerWritingInterface

