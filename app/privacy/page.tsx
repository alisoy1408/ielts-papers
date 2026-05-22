import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-medium mb-2">Information we collect</h2>
          <p>We collect:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Account info (email, name) when you sign up</li>
            <li>Test attempts and scores (linked to your account)</li>
            <li>Anonymous usage analytics</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-medium mb-2">How we use your data</h2>
          <p>To provide the service, show your progress, and improve the site. We do not sell or share your data with third parties.</p>
        </section>
        <section>
          <h2 className="text-xl font-medium mb-2">Your rights (GDPR)</h2>
          <p>You can request access to, correction of, or deletion of your data. Contact: contact@ielts-papers.com</p>
        </section>
        <section>
          <h2 className="text-xl font-medium mb-2">Data storage</h2>
          <p>Your data is stored securely on Supabase infrastructure (EU servers).</p>
        </section>
      </div>
    </div>
  );
}
