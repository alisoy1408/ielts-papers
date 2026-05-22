import type { Metadata } from "next";
export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">About ielts-papers.com</h1>
      <p className="text-gray-700 leading-relaxed mb-4">
        ielts-papers.com provides free, high-quality IELTS Academic Reading practice tests in the real computer-based exam format. Every test on this site is original work, written and quality-checked by qualified English language educators.
      </p>
      <h2 className="text-xl font-medium mt-8 mb-3">What makes us different</h2>
      <ul className="space-y-2 text-gray-700">
        <li>• <b>Original content only.</b> We do not republish copyrighted Cambridge materials.</li>
        <li>• <b>Real exam interface.</b> Split screen, draggable divider, font size controls, timer, highlighting.</li>
        <li>• <b>Created by educators.</b> Materials developed by English language lecturers.</li>
        <li>• <b>Track your progress.</b> Free account saves your attempts and shows your band score history.</li>
      </ul>
      <h2 className="text-xl font-medium mt-8 mb-3">Important notice</h2>
      <p className="text-gray-700 leading-relaxed">
        IELTS is a registered trademark of the IELTS Partners — Cambridge University Press &amp; Assessment, the British Council, and IDP: IELTS Australia. This website is independent and is not affiliated with these organizations.
      </p>
    </div>
  );
}
