import type { Metadata } from "next";
export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Contact</h1>
      <p className="text-gray-700 mb-6">For questions, feedback, or content suggestions:</p>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-sm text-gray-500 mb-1">Email</p>
        <p className="text-lg font-medium text-brand-accent">contact@ielts-papers.com</p>
      </div>
    </div>
  );
}
