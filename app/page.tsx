// app/page.tsx
import LoginForm from "@/components/LoginForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="container max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">Online Examination System</h1>
          <p className="text-gray-600 mt-2">Login to access your account</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
