"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DpaPage() {
  return (
    <div className="min-h-screen bg-[#09090b] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[#f5c542] hover:text-[#f5c542]/80 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 lg:p-12">
          <h1 className="text-3xl font-bold text-[#fafafa] mb-4">Data Processing Agreement</h1>
          <p className="text-[#a1a1aa] mb-8">Last updated: January 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">1. Purpose and Scope</h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                This Data Processing Agreement (&quot;DPA&quot;) forms part of the agreement between HireRight
                (&quot;Processor&quot;) and the Customer (&quot;Controller&quot;) for the provision of AI-powered background
                screening and job matching services. This DPA applies where HireRight processes personal data
                on behalf of the Controller in the course of providing services.
              </p>
              <p className="text-[#a1a1aa] leading-relaxed mt-2">
                This DPA reflects the parties&apos; agreement on the terms governing the processing and security
                of personal data under applicable data protection laws, including the General Data Protection
                Regulation (GDPR), the UK GDPR, and other applicable data protection legislation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">2. Definitions</h2>
              <ul className="list-disc list-inside text-[#a1a1aa] space-y-2">
                <li><strong>Personal Data:</strong> Any information relating to an identified or identifiable natural person processed by the Processor on behalf of the Controller under this DPA.</li>
                <li><strong>Controller:</strong> The natural or legal person, public authority, agency, or other body which, alone or jointly with others, determines the purposes and means of the processing of personal data. In this context, the Controller is the Customer using HireRight&apos;s services.</li>
                <li><strong>Processor:</strong> The natural or legal person, public authority, agency, or other body which processes personal data on behalf of the Controller. In this context, HireRight acts as the Processor.</li>
                <li><strong>Sub-processor:</strong> Any third party engaged by the Processor (or by any Sub-processor of the Processor) to process personal data on behalf of the Controller.</li>
                <li><strong>Data Subject:</strong> An identified or identifiable natural person whose personal data is processed under this DPA.</li>
                <li><strong>Processing:</strong> Any operation or set of operations performed on personal data, including collection, recording, organization, structuring, storage, adaptation, retrieval, consultation, use, disclosure, dissemination, alignment, combination, restriction, erasure, or destruction.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">3. Processing Details</h2>
              <p className="text-[#a1a1aa] leading-relaxed mb-4">
                The Processor shall process personal data only on documented instructions from the Controller
                and only for the duration of the services. The following details apply:
              </p>
              <ul className="list-disc list-inside text-[#a1a1aa] space-y-2">
                <li><strong>Types of Personal Data Processed:</strong> Names, email addresses, phone numbers, dates of birth, professional history (resume/CV data), educational background, skills, work history, government-issued identification documents (for background verification), address information, employment references, and verification results.</li>
                <li><strong>Purposes of Processing:</strong> (a) Providing AI-powered background screening and job matching services; (b) Conducting virtual interviews; (c) Performing identity and background verification; (d) Communicating with data subjects about services; (e) Ensuring platform security and preventing fraud; (f) Complying with legal obligations.</li>
                <li><strong>Duration of Processing:</strong> Processing shall continue for the duration of the services agreement between the Controller and the Processor, unless terminated earlier in accordance with this DPA or applicable law.</li>
                <li><strong>Nature and Purpose of Processing:</strong> Collection, recording, organization, structuring, storage, adaptation, retrieval, consultation, use, disclosure, alignment, combination, restriction, erasure, and destruction of personal data for the purposes described above.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">4. Controller Obligations</h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                The Controller shall:
              </p>
              <ul className="list-disc list-inside text-[#a1a1aa] mt-2 space-y-1">
                <li>Ensure that it has a valid legal basis for processing personal data under applicable data protection laws.</li>
                <li>Provide the Processor with documented instructions for the processing of personal data.</li>
                <li>Obtain all necessary consents from data subjects prior to providing their personal data to the Processor.</li>
                <li>Ensure that personal data provided to the Processor is accurate, complete, and up to date.</li>
                <li>Respond to data subject rights requests in a timely manner, with the Processor providing reasonable assistance as agreed.</li>
                <li>Notify the Processor without undue delay if it believes the Processor&apos;s processing instructions infringe applicable data protection laws.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">5. Processor Obligations (HireRight)</h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                The Processor (HireRight) shall:
              </p>
              <ul className="list-disc list-inside text-[#a1a1aa] mt-2 space-y-1">
                <li>Process personal data only on documented instructions from the Controller and in accordance with this DPA.</li>
                <li>Ensure that persons authorized to process personal data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.</li>
                <li>Implement appropriate technical and organizational security measures as required by Article 32 of the GDPR.</li>
                <li>Not engage another processor without prior specific or general written authorization of the Controller. In the case of general written authorization, the Processor shall inform the Controller of any intended changes, giving the Controller the opportunity to object.</li>
                <li>Assist the Controller by appropriate technical and organizational measures, insofar as this is possible, for the fulfillment of the Controller&apos;s obligation to respond to requests for exercising the data subject&apos;s rights.</li>
                <li>Assist the Controller in ensuring compliance with the obligations pursuant to Articles 32 to 36 of the GDPR, taking into account the nature of processing and the information available to the Processor.</li>
                <li>At the choice of the Controller, delete or return all personal data to the Controller after the end of the provision of services, and delete existing copies unless applicable law requires storage of the personal data.</li>
                <li>Make available to the Controller all information necessary to demonstrate compliance with the obligations laid down in this DPA and allow for and contribute to audits, including inspections, conducted by the Controller or another auditor mandated by the Controller.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">6. Sub-processing</h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                The Processor has obtained general authorization from the Controller for the engagement of Sub-processors.
                The following Sub-processors are currently authorized:
              </p>
              <ul className="list-disc list-inside text-[#a1a1aa] mt-2 space-y-1">
                <li><strong>OpenAI:</strong> AI and machine learning services for interview analysis and job matching algorithms.</li>
                <li><strong>Cloudflare:</strong> Content delivery network, security, and DDoS protection services.</li>
                <li><strong>Vercel:</strong> Hosting and deployment infrastructure for the platform.</li>
                <li><strong>Stripe:</strong> Payment processing services for subscription and billing management.</li>
                <li><strong>Turso:</strong> Database services for data storage and management.</li>
              </ul>
              <p className="text-[#a1a1aa] mt-2">
                The Processor shall maintain an up-to-date list of Sub-processors and shall notify the Controller
                of any intended changes at least 30 days in advance. The Controller may object to a new Sub-processor
                within 14 days of notification. If the Controller objects, the Processor shall either not engage
                the Sub-processor or allow the Controller to terminate the affected services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">7. Data Subject Rights</h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                The Processor shall assist the Controller in responding to data subject rights requests, including:
              </p>
              <ul className="list-disc list-inside text-[#a1a1aa] mt-2 space-y-1">
                <li><strong>Right of Access:</strong> Data subjects may request access to their personal data.</li>
                <li><strong>Right to Rectification:</strong> Data subjects may request correction of inaccurate personal data.</li>
                <li><strong>Right to Erasure:</strong> Data subjects may request deletion of their personal data where processing is no longer necessary or consent is withdrawn.</li>
                <li><strong>Right to Restriction:</strong> Data subjects may request restriction of processing in certain circumstances.</li>
                <li><strong>Right to Data Portability:</strong> Data subjects may request to receive their personal data in a structured, commonly used, and machine-readable format.</li>
                <li><strong>Right to Object:</strong> Data subjects may object to processing based on legitimate interests or public interest.</li>
                <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, data subjects may withdraw consent at any time.</li>
              </ul>
              <p className="text-[#a1a1aa] mt-2">
                The Processor shall promptly notify the Controller if it receives a request from a data subject
                and shall not respond directly to the data subject without authorization from the Controller,
                unless required by applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">8. Security Measures</h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                The Processor shall implement appropriate technical and organizational measures to ensure a level
                of security appropriate to the risk, including as appropriate:
              </p>
              <ul className="list-disc list-inside text-[#a1a1aa] mt-2 space-y-1">
                <li>Pseudonymization and encryption of personal data.</li>
                <li>Measures to ensure the ongoing confidentiality, integrity, availability, and resilience of processing systems and services.</li>
                <li>Measures to ensure the ability to restore the availability and access to personal data in a timely manner in the event of a physical or technical incident.</li>
                <li>A process for regularly testing, assessing, and evaluating the effectiveness of technical and organizational measures for ensuring the security of processing.</li>
                <li>Role-based access controls and principle of least privilege.</li>
                <li>Regular security assessments and penetration testing.</li>
                <li>Employee training on data protection and security practices.</li>
                <li>Incident response and breach notification procedures.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">9. Data Breach Notification</h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                In the event of a personal data breach, the Processor shall:
              </p>
              <ul className="list-disc list-inside text-[#a1a1aa] mt-2 space-y-1">
                <li>Notify the Controller without undue delay and no later than 48 hours after becoming aware of a personal data breach.</li>
                <li>Provide the Controller with details of the breach, including the nature of the personal data, the categories and approximate number of data subjects affected, and the likely consequences.</li>
                <li>Take all reasonable steps to contain and mitigate the effects of the breach.</li>
                <li>Cooperate with the Controller and take reasonable commercial steps as directed by the Controller to assist in the investigation, mitigation, and remediation of each breach.</li>
                <li>Provide the Controller with information necessary to enable the Controller to meet any obligations to report or inform data subjects of the breach.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">10. Cross-border Transfers</h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                The Processor shall not transfer personal data to a country or international organization outside
                the European Economic Area (EEA), United Kingdom, or other applicable jurisdiction without the
                prior written consent of the Controller. Where such transfer is authorized:
              </p>
              <ul className="list-disc list-inside text-[#a1a1aa] mt-2 space-y-1">
                <li>The Processor shall ensure appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs), Binding Corporate Rules (BCRs), or other transfer mechanisms recognized under applicable data protection laws.</li>
                <li>The Processor shall conduct a transfer impact assessment where required.</li>
                <li>The Processor shall ensure that Sub-processors comply with the same data protection obligations regarding cross-border transfers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">11. Liability</h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                Each party&apos;s liability under this DPA shall be subject to the exclusions and limitations of
                liability set out in the main services agreement between the parties. Nothing in this DPA shall
                limit or exclude either party&apos;s liability for:
              </p>
              <ul className="list-disc list-inside text-[#a1a1aa] mt-2 space-y-1">
                <li>Death or personal injury caused by negligence.</li>
                <li>Fraud or fraudulent misrepresentation.</li>
                <li>Any liability that cannot be limited or excluded under applicable law.</li>
              </ul>
              <p className="text-[#a1a1aa] mt-2">
                The Processor shall indemnify and hold harmless the Controller from and against any claims,
                damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in
                connection with the Processor&apos;s breach of this DPA or applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">12. Termination</h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                This DPA shall remain in effect for the duration of the services agreement between the parties.
                Upon termination of the services agreement:
              </p>
              <ul className="list-disc list-inside text-[#a1a1aa] mt-2 space-y-1">
                <li>The Processor shall, at the choice of the Controller, return or delete all personal data and certify in writing that such action has been completed, unless applicable law requires storage of the personal data.</li>
                <li>The Processor shall ensure that any Sub-processors are bound by the same obligations regarding the return or deletion of personal data.</li>
                <li>The Processor may retain copies of personal data to the extent required by applicable law, provided that such data remains protected in accordance with this DPA.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#fafafa] mb-4">13. Contact Information</h2>
              <p className="text-[#a1a1aa] leading-relaxed">
                For questions about this Data Processing Agreement, please contact us at:
              </p>
              <p className="text-[#a1a1aa] mt-2">
                <strong>Data Protection Officer:</strong> dpo@hireright.com<br />
                <strong>Email:</strong> legal@hireright.com<br />
                <strong>Address:</strong> HireRight, Bangalore, India
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
