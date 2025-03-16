import type React from "react"

interface Props {
  results: {
    totalScore: number
    maxScore: number
    feedback: string
    questionScores: { questionId: number; score: number; feedback: string }[]
  }
  preferredLanguage: string
}

const ResultsDisplay: React.FC<Props> = ({ results, preferredLanguage }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Test Results</h2>
      <p className="text-xl mb-2">
        Total Score: {results.totalScore} / {results.maxScore}
      </p>
      <p className="mb-4">{results.feedback}</p>
      <h3 className="text-xl font-semibold mb-2">Question-wise Scores:</h3>
      {results.questionScores.map((score) => (
        <div key={score.questionId} className="mb-2">
          <p>
            Question {score.questionId}: {score.score} points
          </p>
          <p>{score.feedback}</p>
        </div>
      ))}
    </div>
  )
}

export default ResultsDisplay

