import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">ielts-papers.com</h4>
            <p className="text-xs leading-relaxed">Original IELTS-style practice tests created by qualified English language educators.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Pages</h4>
            <ul className="space-y-1 text-xs">
              <li><Link href="/" className="hover:text-brand-accent">Reading tests</Link></li>
              <li><Link href="/about" className="hover:text-brand-accent">About</Link></li>
              <li><Link href="/contact" className="hover:text-brand-accent">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Legal</h4>
            <ul className="space-y-1 text-xs">
              <li><Link href="/privacy" className="hover:text-brand-accent">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-accent">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-4 text-xs text-gray-500 leading-relaxed">
          <p className="mb-2">
            <b>IELTS</b> is a registered trademark of the IELTS Partners — Cambridge University Press &amp; Assessment, the British Council, and IDP: IELTS Australia. This website is independent, is not affiliated with or endorsed by these organizations, and provides original preparation materials in the IELTS format for educational purposes. All content on this website is original work created by ielts-papers.com.
          </p>
          <p>© {new Date().getFullYear()} ielts-papers.com · All content original.</p>
        </div>
      </div>
    </footer>
  );
}
