import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-medium mb-2">Use of the service</h2>
          <p>ielts-papers.com provides free educational materials for personal IELTS preparation.</p>
        </section>
        <section>
          <h2 className="text-xl font-medium mb-2">Content ownership</h2>
          <p>All passages and questions are original works of ielts-papers.com, protected by copyright. You may not copy, redistribute, or republish our content without written permission.</p>
        </section>
        <section>
          <h2 className="text-xl font-medium mb-2">No official affiliation</h2>
          <p>We are not affiliated with Cambridge University Press &amp; Assessment, the British Council, IDP: IELTS Australia, or any official IELTS organization. Band score estimates are approximate.</p>
        </section>
        <section>
          <h2 className="text-xl font-medium mb-2">Account responsibility</h2>
          <p>Keep your account password secure. You are responsible for all activity under your account.</p>
        </section>
      </div>
    </div>
  );
}
