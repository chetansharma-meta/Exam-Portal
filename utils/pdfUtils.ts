import jsPDF from "jspdf"
import dynamic from "next/dynamic"

const CanvasDraw = dynamic(() => import("react-canvas-draw"), { ssr: false })

interface StudentDetails {
  name: string
  studentId: string
}

export const generateExamPDF = async (
  studentDetails: StudentDetails,
  questions: string[],
  canvasStates: string[],
): Promise<void> => {
  const pdf = new jsPDF()

  // Add student details on the first page
  pdf.setFontSize(16)
  pdf.text("Student Details:", 10, 10)
  pdf.setFontSize(12)
  pdf.text(`Name: ${studentDetails.name}`, 10, 20)
  pdf.text(`Student ID: ${studentDetails.studentId}`, 10, 30)

  for (let index = 0; index < questions.length; index++) {
    const question = questions[index]
    pdf.addPage()

    // Add question
    pdf.setFontSize(16)
    pdf.text(`Question ${index + 1}:`, 10, 10)
    const splitQuestion = pdf.splitTextToSize(question, 180)
    pdf.setFontSize(12)
    pdf.text(splitQuestion, 10, 20)

    // Add answer
    if (canvasStates[index]) {
      const canvas = document.createElement("canvas")
      canvas.width = 800
      canvas.height = 400
      const ctx = canvas.getContext("2d")

      if (ctx) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
          const imgData = canvas.toDataURL("image/png")
          const imgHeight = (canvas.height * 190) / canvas.width
          pdf.addImage(imgData, "PNG", 10, 40, 190, imgHeight)

          // Save the PDF after the last question
          if (index === questions.length - 1) {
            pdf.save("exam-answers.pdf")
          }
        }
        img.src = JSON.parse(canvasStates[index]).lines[0].points[0].src
      }
    }
  }
}

