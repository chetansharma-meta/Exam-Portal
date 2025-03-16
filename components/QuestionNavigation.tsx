import type React from "react"

interface Props {
  questions: { id: number; text: string }[]
  currentIndex: number
  onNavigate: (index: number) => void
}

const QuestionNavigation: React.FC<Props> = ({ questions, currentIndex, onNavigate }) => {
  return (
    <div className="flex space-x-2 mb-4">
      {questions.map((question, index) => (
        <button
          key={question.id}
          onClick={() => onNavigate(index)}
          className={`px-3 py-1 rounded ${index === currentIndex ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Q{question.id}
        </button>
      ))}
    </div>
  )
}

export default QuestionNavigation

