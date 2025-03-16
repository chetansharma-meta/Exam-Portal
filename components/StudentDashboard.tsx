"use client"

import type React from "react"
import { useState, useEffect } from "react"
import AnswerWritingInterface from "./AnswerWritingInterface"
import QuestionNavigation from "./QuestionNavigation"
import ResultsDisplay from "./ResultsDisplay"

interface Question {
  id: number
  text: string
  marks: number
}

interface Answer {
  questionId: number
  handwrittenText: string
  extractedText: string
  translatedText: string
}

const StudentDashboard: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [results, setResults] = useState<any>(null)
  const [preferredLanguage, setPreferredLanguage] = useState("en")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        setError(null)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const mockQuestions: Question[] = [
          { id: 1, text: "What is the capital of France?", marks: 5 },
          { id: 2, text: "Explain the process of photosynthesis.", marks: 10 },
          { id: 3, text: "Solve the equation: 2x + 5 = 15", marks: 5 },
        ]
        setQuestions(mockQuestions)
      } catch (error) {
        console.error("Error fetching questions:", error)
        setError("Failed to fetch questions. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const handleAnswerSubmit = (answer: Answer) => {
    setAnswers((prevAnswers) => {
      const newAnswers = [...prevAnswers]
      const index = newAnswers.findIndex((a) => a.questionId === answer.questionId)
      if (index !== -1) {
        newAnswers[index] = answer
      } else {
        newAnswers.push(answer)
      }
      return newAnswers
    })
  }

  const handleNavigate = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleSubmitTest = async () => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockResults = {
        totalScore: 15,
        maxScore: 20,
        feedback: "Good attempt! Keep practicing.",
        questionScores: [
          { questionId: 1, score: 5, feedback: "Correct!" },
          { questionId: 2, score: 7, feedback: "Good explanation, but missed some key points." },
          { questionId: 3, score: 3, feedback: "Partially correct. Remember to show your work." },
        ],
      }
      setResults(mockResults)
    } catch (error) {
      console.error("Error submitting test:", error)
      setError("Failed to submit test. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>
  }

  if (questions.length === 0) {
    return <div className="text-center mt-8">No questions available.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Student Dashboard</h1>
      {!results ? (
        <>
          <QuestionNavigation questions={questions} currentIndex={currentQuestionIndex} onNavigate={handleNavigate} />
          <AnswerWritingInterface
            question={questions[currentQuestionIndex]}
            onSubmit={handleAnswerSubmit}
            preferredLanguage={preferredLanguage}
            onNext={handleNextQuestion}
          />
          {currentQuestionIndex === questions.length - 1 && (
            <button onClick={handleSubmitTest} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
              Submit Test
            </button>
          )}
        </>
      ) : (
        <ResultsDisplay results={results} preferredLanguage={preferredLanguage} />
      )}
    </div>
  )
}

export default StudentDashboard

