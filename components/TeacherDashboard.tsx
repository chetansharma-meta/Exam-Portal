import type React from "react"
import { useState } from "react"
import TestCreation from "./TestCreation"
import ResultsManagement from "./ResultsManagement"

const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"create" | "results">("create")

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Teacher Dashboard</h1>
      <div className="mb-4">
        <button
          onClick={() => setActiveTab("create")}
          className={`mr-2 px-4 py-2 rounded ${activeTab === "create" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Create Test
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`px-4 py-2 rounded ${activeTab === "results" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Manage Results
        </button>
      </div>
      {activeTab === "create" ? <TestCreation /> : <ResultsManagement />}
    </div>
  )
}

export default TeacherDashboard

