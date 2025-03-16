import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function StudentForm({ onSubmit }) {
  const [name, setName] = useState("")
  const [studentId, setStudentId] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ name, studentId })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Student Details</h1>
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="studentId">Student ID</Label>
        <Input id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
      </div>
      <Button type="submit">Start Exam</Button>
    </form>
  )
}

