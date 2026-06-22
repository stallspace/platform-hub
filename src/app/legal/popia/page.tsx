import Link from 'next/link'

export const metadata = {
  title: 'POPIA Compliance | Stallspace',
  description: 'How Stallspace complies with the Protection of Personal Information Act.',
}

export default function PopiaCompliancePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link href="/marketplace" className="text-sm text-[#2ECC8E] hover:underline mb-8 inline-block">
          ← Back to Marketplace
        </Link>

        <h1 className="text-3xl font-bold text-[#0D3B2E] mb-2">POPIA Compliance</h1>
        <p className="text-sm text-[#9CA3AF] mb-10">Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-sm max-w-none text-[#374151] space-y-6">
          <p>
            Stallspace, operated by Kwry (Pty) Ltd, is committed to complying with the Protection of Personal
            Information Act 4 of 2013 ("POPIA"). This page summarises the measures we take to protect personal
            information processed on our platform.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">Information Officer</h2>
          <p>
            In terms of Section 55 of POPIA, Stallspace has appointed an Information Officer responsible for
            ensuring compliance with the Act. As Stallspace currently operates with a single team member, this
            responsibility is held directly by the founder of Kwry (Pty) Ltd.
          </p>
          <p>
            You can contact our Information Officer with any questions, access requests, or complaints
            relating to your personal information at:{' '}
            <a href="mailto:privacy@stallspace.co.za" className="text-[#2ECC8E] hover:underline">privacy@stallspace.co.za</a>
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">The Eight Conditions for Lawful Processing</h2>
          <p>We process personal information in accordance with POPIA's eight conditions:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Accountability</strong> — We take responsibility for ensuring all processing on Stallspace complies with POPIA.</li>
            <li><strong>Processing Limitation</strong> — We only collect personal information that is necessary to operate the marketplace (account details, order information, vendor applications).</li>
            <li><strong>Purpose Specification</strong> — Information is collected for clearly defined purposes: facilitating orders, vendor verification, and customer support.</li>
            <li><strong>Further Processing Limitation</strong> — We do not use your information for purposes incompatible with why it was originally collected.</li>
            <li><strong>Information Quality</strong> — We take reasonable steps to ensure the personal information we hold is accurate and up to date.</li>
            <li><strong>Openness</strong> — This page and our Privacy Policy document how and why we process your information.</li>
            <li><strong>Security Safeguards</strong> — We use SSL encryption, Supabase Row-Level Security, role-based access control, and secure password hashing to protect data.</li>
            <li><strong>Data Subject Participation</strong> — You may request access to, correction of, or deletion of your personal information at any time.</li>
          </ul>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">Security Measures in Place</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>SSL encryption across the platform</li>
            <li>Role-based access control separating customer, vendor, and admin permissions</li>
            <li>Supabase Row-Level Security policies restricting data access at the database level</li>
            <li>Secure password hashing — passwords are never stored in plain text</li>
            <li>Encrypted handling of sensitive vendor payment configuration details</li>
            <li>Automated backups of platform data</li>
          </ul>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">Cross-Border Data Transfers</h2>
          <p>
            Some of our service providers (such as our hosting and database infrastructure) may process data
            outside South Africa. Where this occurs, we ensure these providers maintain a comparable level of
            data protection in accordance with Section 72 of POPIA.
          </p>

          <h2 className="text-lg font-bold text-[#0D3B2E] mt-8 mb-3">Submitting a Request or Complaint</h2>
          <p>
            To exercise any of your rights under POPIA — including access, correction, deletion, or objection
            to processing — please email{' '}
            <a href="mailto:privacy@stallspace.co.za" className="text-[#2ECC8E] hover:underline">privacy@stallspace.co.za</a>.
            We aim to respond to all requests within a reasonable time as required by law.
          </p>
          <p>
            If you are not satisfied with our response, you have the right to lodge a complaint with the
            Information Regulator of South Africa:
          </p>
          <p>
            Website: <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="text-[#2ECC8E] hover:underline">inforegulator.org.za</a><br />
            Email: <a href="mailto:complaints.IR@justice.gov.za" className="text-[#2ECC8E] hover:underline">complaints.IR@justice.gov.za</a>
          </p>
        </div>
      </div>
    </div>
  )
}
