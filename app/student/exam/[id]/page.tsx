// app/student/exam/[id]/page.tsx
"use client";

import ExamCanvas from "@/components/student/ExamCanvas";

export default function StudentExamPage({ params }: { params: { id: string } }) {
  return <ExamCanvas examId={params.id} />;
}
