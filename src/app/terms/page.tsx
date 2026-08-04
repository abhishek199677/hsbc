"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: January 2026</p>

          <div className="prose prose-indigo max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing and using HireRight ("the Platform"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Services</h2>
              <p className="text-gray-600 leading-relaxed">
                HireRight provides an AI-powered background screening and job matching platform. Our services include:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li>Profile creation and verification</li>
                <li>AI-powered job matching</li>
                <li>Virtual interview scheduling and conduction</li>
                <li>Background verification services</li>
                <li>Employer recruitment solutions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-600 leading-relaxed">
                You must provide accurate, current, and complete information during registration. 
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Responsibilities</h2>
              <p className="text-gray-600 leading-relaxed">Users agree to:</p>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li>Provide truthful and accurate information</li>
                <li>Not misrepresent their identity or qualifications</li>
                <li>Not use the platform for any illegal purposes</li>
                <li>Not attempt to circumvent security measures</li>
                <li>Respect the rights of other users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Privacy and Data Protection</h2>
              <p className="text-gray-600 leading-relaxed">
                Your privacy is important to us. Our collection and use of personal information is governed by our 
                <Link href="/privacy" className="text-indigo-600 hover:underline"> Privacy Policy</Link>. 
                By using our services, you consent to the data practices described therein.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                All content, features, and functionality of the Platform are owned by HireRight and are protected 
                by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                HireRight shall not be liable for any indirect, incidental, special, consequential, or punitive 
                damages resulting from your use of or inability to use the Platform. We do not guarantee employment 
                outcomes or the accuracy of third-party information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                We may terminate or suspend your account and access to the Platform at our sole discretion, 
                without prior notice, for conduct that we believe violates these Terms or is harmful to other users, 
                us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material 
                changes via email or through the Platform. Continued use after changes constitutes acceptance 
                of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                For questions about these Terms, please contact us at:
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Email:</strong> legal@hreright.com<br />
                <strong>Address:</strong> HireRight, Bangalore, India
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
