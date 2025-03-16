"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface TestResult {
  id: number
  studentName: string
  totalScore: number
  maxScore: number
  feedback: string
  questionScores: { questionId: number; score: number; feedback: string }[]
}

const ResultsManagement: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([])
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)

  useEffect(() => {
    // Fetch results from API
    const fetchResults = async () => {
      const response = await fetch("/api/test-results")
      const data = await response.json()
      setResults(data)
    }
    fetchResults()
  }, [])

  const handleSelectResult = (result: TestResult) => {
    setSelectedResult(result)
  }

  const handleScoreChange = (questionId: number, newScore: number) => {
    if (selectedResult) {
      const updatedScores = selectedResult.questionScores.map((score) =>
        score.questionId === questionId ? { ...score, score: newScore } : score,
      )
      const totalScore = updatedScores.reduce((sum, score) => sum + score.score, 0)
      setSelectedResult({
        ...selectedResult,
        questionScores: updatedScores,
        totalScore,
      })
    }
  }

  const handleSaveChanges = async () => {
    if (selectedResult) {
      // Replace with actual API call to update results
      await fetch(`/api/update-result/${selectedResult.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedResult),
      })
      alert("Changes saved successfully!")
    }
  }

  const handleExportResults = async () => {
    // Replace with actual API call to export results
    const response = await fetch("/api/export-results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(results),
    })
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = "test_results.pdf"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Results</h2>
      <div className="flex">
        <div className="w-1/3 pr-4">
          <h3 className="text-xl font-semibold mb-2">Test Results</h3>
          {results.map((result) => (
            <div
              key={result.id}
              onClick={() => handleSelectResult(result)}
              className={`p-2 mb-2 cursor-pointer ${
                selectedResult?.id === result.id ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              <p>{result.studentName}</p>
              <p>
                Score: {result.totalScore} / {result.maxScore}
              </p>
            </div>
          ))}
        </div>
        <div className="w-2/3 pl-4">
          {selectedResult && (
            <>
              <h3 className="text-xl font-semibold mb-2">{selectedResult.studentName}'s Result</h3>
              <p className="mb-2">
                Total Score: {selectedResult.totalScore} / {selectedResult.maxScore}
              </p>
              <p className="mb-4">{selectedResult.feedback}</p>
              <h4 className="text-lg font-semibold mb-2">Question Scores:</h4>
              {selectedResult.questionScores.map((score) => (
                <div key={score.questionId} className="mb-2">
                  <label className="block">Question {score.questionId}:</label>
                  <input
                    type="number"
                    value={score.score}
                    onChange={(e) => handleScoreChange(score.questionId, Number.parseInt(e.target.value))}
                    className="w-16 p-1 border rounded mr-2"
                  />
                  <span>{score.feedback}</span>
                </div>
              ))}
              <button onClick={handleSaveChanges} className="bg-green-500 text-white px-4 py-2 rounded mt-4">
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>
      <button onClick={handleExportResults} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
        Export Results
      </button>
    </div>
  )
}

export default ResultsManagement

