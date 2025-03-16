"use client"

import type React from "react"
import { useState } from "react"
import { useDropzone } from "react-dropzone"

interface Question {
  id: number
  text: string
  marks: number
}

const TestCreation: React.FC = () => {
  const [context, setContext] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [gradingDifficulty, setGradingDifficulty] = useState<"easy" | "medium" | "strict">("medium")
  const [aiInterpretation, setAiInterpretation] = useState("")

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file.type === "application/pdf") {
      // Handle PDF upload (you may need to use a PDF parsing library)
      console.log("PDF uploaded")
    } else if (file.type.startsWith("image/")) {
      // Handle image upload (you may need to use an image processing library)
      console.log("Image uploaded")
    } else {
      const text = await file.text()
      setContext(text)
    }
  }

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: questions.length + 1,
      text: "",
      marks: 0,
    }
    setQuestions([...questions, newQuestion])
  }

  const handleQuestionChange = (id: number, field: keyof Question, value: string | number) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const handlePreview = async () => {
    // Replace with actual API call for AI interpretation
    const response = await fetch("/api/ai-interpretation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ context, questions, gradingDifficulty }),
    })
    const interpretation = await response.text()
    setAiInterpretation(interpretation)
  }

  const handleSubmit = async () => {
    // Replace with actual API call to save the test
    await fetch("/api/save-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ context, questions, gradingDifficulty }),
    })
    alert("Test saved successfully!")
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Create Test</h2>
      <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-4 mb-4">
        <input {...getInputProps()} />
        <p>Drag & drop a file here, or click to select a file</p>
      </div>
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Or enter context here..."
        className="w-full h-32 p-2 border rounded mb-4"
      />
      <h3 className="text-xl font-semibold mb-2">Questions</h3>
      {questions.map((question) => (
        <div key={question.id} className="mb-4">
          <input
            type="text"
            value={question.text}
            onChange={(e) => handleQuestionChange(question.id, "text", e.target.value)}
            placeholder="Question text"
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="number"
            value={question.marks}
            onChange={(e) => handleQuestionChange(question.id, "marks", Number.parseInt(e.target.value))}
            placeholder="Marks"
            className="w-32 p-2 border rounded"
          />
        </div>
      ))}
      <button onClick={handleAddQuestion} className="bg-green-500 text-white px-4 py-2 rounded mb-4">
        Add Question
      </button>
      <div className="mb-4">
        <label className="block mb-2">Grading Difficulty:</label>
        <select
          value={gradingDifficulty}
          onChange={(e) => setGradingDifficulty(e.target.value as "easy" | "medium" | "strict")}
          className="p-2 border rounded"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="strict">Strict</option>
        </select>
      </div>
      <button onClick={handlePreview} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
        Preview AI Interpretation
      </button>
      <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded">
        Save Test
      </button>
      {aiInterpretation && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">AI Interpretation:</h3>
          <p>{aiInterpretation}</p>
        </div>
      )}
    </div>
  )
}

export default TestCreation

