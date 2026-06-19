'use client'

import { useRouter } from 'next/navigation'

export default function LegalPage() {
  const router = useRouter()

  function goBack() {
    // Use browser history so this returns to wherever the person came from
    // (dashboard sidebar, login footer, signup footer) instead of always
    // landing on the public marketing page.
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/login')
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#F2EDE6',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      padding: 'clamp(24px, 6vw, 64px) clamp(16px, 6vw, 48px)',
    }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <button onClick={goBack} style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A',
            textDecoration: 'none', background: 'transparent', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', padding: 0,
          }}>
            ← BACK TO SETHU
          </button>
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1C1208', letterSpacing: '3px', lineHeight: 1 }}>SETHU</div>
            <div style={{ width: '40px', height: '3px', background: '#D94F00', margin: '10px 0' }} />
            <div style={{ fontSize: '10px', color: '#8A6A4A', letterSpacing: '2px' }}>LEGAL INFORMATION</div>
          </div>
          <p style={{ fontSize: '12px', color: '#8A6A4A', marginTop: '16px', lineHeight: 1.7 }}>
            These documents govern your use of SETHU, the campus management platform operated for
            Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad. 
          </p>
        </div>

        {/* Table of contents */}
        <div style={{ border: '1.5px solid #1C1208', background: '#FDFAF5', padding: '20px 24px', marginBottom: '40px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A', marginBottom: '14px' }}>CONTENTS</div>
          {[
            ['01', 'Terms of Service', '#tos'],
            ['02', 'Privacy Policy', '#privacy'],
            ['03', 'Acceptable Use Policy', '#aup'],
          ].map(([num, label, href]) => (
            <a key={href} href={href} style={{
              display: 'flex', gap: '14px', alignItems: 'baseline',
              textDecoration: 'none', padding: '7px 0',
              borderBottom: '1px solid #E0D0B8',
            }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#D94F00', minWidth: '24px' }}>{num}</span>
              <span style={{ fontSize: '13px', color: '#1C1208', fontWeight: 500 }}>{label}</span>
            </a>
          ))}
        </div>

        {/* ── 01. Terms of Service ── */}
        <section id="tos" style={{ marginBottom: '56px' }}>
          <SectionHeader number="01" title="Terms of Service" />

          <Block title="1.1 About SETHU">
            SETHU (Smart Education and Task Hub for Unified Campus Management) is a campus management
            platform developed for and operated within Chaitanya Bharathi Institute of Technology (CBIT),
            Hyderabad, Telangana, India. The platform facilitates academic management, request processing,
            notifications, timetable management, and student-faculty communication within the institution.
          </Block>

          <Block title="1.2 Acceptance of Terms">
            By creating an account or using SETHU in any capacity, you agree to be bound by these Terms of
            Service. If you do not agree, you must not use the platform. These terms apply to all users
            including students, faculty, heads of department, and administrators.
          </Block>

          <Block title="1.3 Eligibility">
            SETHU is exclusively available to current students, faculty members, and administrative staff
            of CBIT. Student accounts are created through self-registration and are subject to verification.
            Staff accounts (faculty, HOD, admin) are created directly by a SETHU administrator and do not
            require email verification. Use of the platform by anyone outside of the CBIT community is
            not authorised.
          </Block>

          <Block title="1.4 Account Responsibilities">
            You are responsible for maintaining the confidentiality of your account credentials. You must
            not share your password with anyone or allow others to access your account. You are responsible
            for all activity that occurs under your account. If you believe your account has been
            compromised, you must change your password immediately using the Forgot Password option on
            the login page and notify the SETHU administrator.
          </Block>

          <Block title="1.5 Requests and Documents">
            Requests submitted through SETHU (bonafide certificates, gate passes, complaints, etc.) are
            processed in good faith based on the information you provide. You must ensure that all
            information submitted in requests is accurate and truthful. Auto-generated documents produced
            upon approval are official records and must not be tampered with or misrepresented.
          </Block>

          <Block title="1.6 Modifications to the Platform">
            SETHU reserves the right to modify, suspend, or discontinue any feature of the platform at
            any time. Features may be added, changed, or removed as the platform evolves. Users will be
            notified of significant changes through the platform's notification system where possible.
          </Block>

          <Block title="1.7 Termination">
            Administrator accounts may be deactivated or deleted at any time by a SETHU administrator.
            Student accounts remain active for the duration of enrollment. Accounts found to be in
            violation of these terms may be suspended or permanently removed without prior notice.
          </Block>

          <Block title="1.8 Disclaimer of Warranties">
            SETHU is provided on an as-is and as-available basis. While we strive for reliability, we
            do not guarantee that the platform will be available at all times or free from errors.
            Auto-generated documents are produced from information submitted by users and administrators;
            the accuracy of those documents depends on the accuracy of the information provided.
          </Block>

          <Block title="1.9 Limitation of Liability">
            To the fullest extent permitted by law, SETHU and its developers shall not be liable for
            any indirect, incidental, or consequential damages arising from your use of or inability to
            use the platform, including but not limited to loss of data, missed deadlines, or errors in
            generated documents.
          </Block>

          <Block title="1.10 Governing Law">
            These terms are governed by the laws of India. Any disputes arising in connection with
            these terms shall be subject to the jurisdiction of the courts of Hyderabad, Telangana.
          </Block>
        </section>

        <Divider />

        {/* ── 02. Privacy Policy ── */}
        <section id="privacy" style={{ marginBottom: '56px' }}>
          <SectionHeader number="02" title="Privacy Policy" />

          <Block title="2.1 Our Commitment">
            SETHU is committed to protecting the personal information of its users. This policy explains
            what data we collect, why we collect it, how it is stored, and your rights in relation to
            your data. This policy is written in compliance with the Digital Personal Data Protection
            Act, 2023 (DPDP Act) of India.
          </Block>

          <Block title="2.2 Data We Collect">
            When you use SETHU, we collect and store the following categories of personal data:
          </Block>

          <Table rows={[
            ['Account data', 'Full name, email address, password (hashed — never stored in plain text)'],
            ['Academic data', 'Roll number, department, year of study, section'],
            ['Profile data', 'Phone number, blood group, profile photo, professional summary, education history, experience, projects, certifications, and skills — all entered voluntarily'],
            ['Request data', 'Content of submitted requests including descriptions, dates, and payment screenshots'],
            ['Communication data', 'Notifications sent and received, read receipts, deadline information'],
            ['Usage data', 'Timetable slots, subject annotations, AI planner inputs'],
            ['Device data', 'Session tokens managed by Supabase Auth for authentication purposes only'],
          ]} />

          <Block title="2.3 How We Use Your Data">
            Your data is used exclusively for operating the SETHU platform within CBIT. Specifically,
            it is used to display your profile and academic information, process and route your requests
            to the appropriate faculty or administrator, generate official documents upon approval,
            deliver notifications and deadlines from your faculty and department, and provide the AI
            study planner with subject and timetable context. Your data is never sold, rented, or
            shared with third parties outside of CBIT for commercial purposes.
          </Block>

          <Block title="2.4 Data Storage and Infrastructure">
            SETHU is built on Supabase, a cloud infrastructure provider. Your data is stored on
            Supabase servers hosted on Amazon Web Services (AWS). As a result, your data may be
            processed on servers located outside India. By using SETHU, you consent to this
            cross-border transfer for the purpose of operating the platform. Supabase maintains
            security certifications including SOC 2 Type 2.
          </Block>

          <Block title="2.5 AI Service">
            SETHU uses a FastAPI-based AI service hosted on Render that communicates with the Mistral
            API for two purposes: parsing timetable PDFs uploaded by faculty, and generating study
            priority recommendations. When you use the AI Planner, your subject names, difficulty
            levels, and free-hour estimates are sent to this service. No personally identifiable
            information (name, email, roll number) is included in these requests.
          </Block>

          <Block title="2.6 Data Retention">
            We retain your data for as long as your account is active. Specific retention rules apply
            to certain data types: completed requests are automatically deleted 7 days after completion,
            expired faculty-broadcast deadlines are deleted 30 days after their due date, and
            notification dismissals are stored indefinitely to maintain your preferences. You may
            request deletion of your account and all associated data by contacting the SETHU
            administrator.
          </Block>

          <Block title="2.7 File Uploads">
            Files you upload to SETHU (payment screenshots, profile photos, notification attachments)
            are stored in Supabase Storage. Profile photos are stored in a public bucket and accessible
            via URL. Payment screenshots and request attachments are stored in a private bucket and
            accessible only to you and authorised staff. Generated approval documents are stored in a
            public bucket and accessible via their unique URL.
          </Block>

          <Block title="2.8 Your Rights Under the DPDP Act 2023">
            Under the Digital Personal Data Protection Act, 2023, you have the right to access the
            personal data we hold about you, correct inaccurate data, request erasure of your data,
            and withdraw consent for processing where consent is the basis for processing. To exercise
            any of these rights, contact your SETHU administrator or the platform developer.
          </Block>

          <Block title="2.9 Security">
            We implement reasonable technical and organisational measures to protect your data. These
            include row-level security policies on all database tables (ensuring each user can only
            access their own data), encrypted connections over HTTPS, password hashing via Supabase
            Auth, and private storage buckets for sensitive files. No system is perfectly secure;
            you should use a strong, unique password for your SETHU account.
          </Block>

          <Block title="2.10 Cookies and Sessions">
            SETHU uses session cookies managed by Supabase Auth solely for authentication. These
            cookies are necessary for the platform to function and cannot be disabled while using the
            platform. We do not use tracking cookies, advertising cookies, or third-party analytics.
          </Block>

          <Block title="2.11 Children">
            SETHU is not directed at children under the age of 13. If a student is under 13, their
            parent or guardian must consent to the use of this platform. Most CBIT students are above
            this age threshold, but we acknowledge that some first-year students may be 17 or 18.
            We do not knowingly collect data from anyone under 13 without parental consent.
          </Block>
        </section>

        <Divider />

        {/* ── 03. Acceptable Use Policy ── */}
        <section id="aup" style={{ marginBottom: '56px' }}>
          <SectionHeader number="03" title="Acceptable Use Policy" />

          <Block title="3.1 Purpose">
            This Acceptable Use Policy defines the standards of conduct expected of all SETHU users.
            It exists to protect the integrity of the platform, the privacy of other users, and
            the trustworthiness of official records generated through SETHU.
          </Block>

          <Block title="3.2 Permitted Use">
            You may use SETHU to manage your academic activities within CBIT, including submitting
            genuine requests, viewing your timetable and subjects, communicating through the
            notification system in your authorised role, and managing your personal academic deadlines.
          </Block>

          <Block title="3.3 Prohibited Conduct">
            The following are strictly prohibited on SETHU:
          </Block>

          <List items={[
            'Submitting false, misleading, or fabricated information in any request or form',
            'Impersonating another student, faculty member, or administrator',
            'Attempting to access another user\'s account or data without authorisation',
            'Uploading malicious files, viruses, or harmful content to any storage bucket',
            'Using the notification system to send spam, harassment, or irrelevant broadcasts',
            'Attempting to circumvent, disable, or manipulate the platform\'s security mechanisms',
            'Using SETHU for any purpose unrelated to academic management at CBIT',
            'Sharing generated official documents (bonafide certificates, gate passes, receipts) in a misleading or fraudulent context',
            'Reverse engineering, scraping, or extracting data from the platform in bulk',
            'Attempting to access administrative functions without being assigned an admin or staff role',
          ]} />

          <Block title="3.4 Faculty and Staff Conduct">
            Faculty, HOD, and admin users have elevated privileges and bear additional responsibility.
            Specifically, staff must not send notifications or deadlines unrelated to academic matters,
            must not approve requests based on inaccurate or unverified information, must not create
            staff accounts for individuals who are not CBIT employees, and must not use the platform
            to communicate in a manner that constitutes harassment or discrimination.
          </Block>

          <Block title="3.5 Reporting Violations">
            If you observe a violation of this policy, you should report it to the SETHU administrator
            or to the appropriate CBIT authority. You can also report technical vulnerabilities or
            security concerns directly to the platform developer.
          </Block>

          <Block title="3.6 Consequences of Violations">
            Violations of this Acceptable Use Policy may result in temporary suspension of your account,
            permanent termination of your account, referral to CBIT's internal disciplinary committee,
            or legal action where applicable. The severity of the response will be proportionate to the
            nature and impact of the violation.
          </Block>
        </section>

        <Divider />

        {/* Contact */}
        <div style={{ padding: '24px', background: '#FDFAF5', border: '1.5px solid #1C1208', marginBottom: '40px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#8A6A4A', marginBottom: '10px' }}>CONTACT</div>
          <p style={{ fontSize: '12px', color: '#1C1208', lineHeight: 1.8, margin: 0 }}>
            For questions about these policies, data access requests, or to report a concern, contact
            the SETHU administrator through the platform or reach the developer directly via the
            SETHU GitHub repository.
          </p>
        </div>

        <p style={{ fontSize: '10px', color: '#C8A878', textAlign: 'center', letterSpacing: '1px' }}>
          SETHU · CBIT HYDERABAD
        </p>

      </div>
    </main>
  )
}

// ── Helper components ──────────────────────────────────────────

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#D94F00', letterSpacing: '1px' }}>{number}</span>
        <h2 style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: 700, color: '#1C1208', margin: 0, letterSpacing: '0.5px' }}>{title}</h2>
      </div>
      <div style={{ width: '40px', height: '2px', background: '#D94F00', marginTop: '10px' }} />
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '22px' }}>
      <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#1C1208', letterSpacing: '0.5px', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontSize: '13px', color: '#3A2A1A', lineHeight: 1.85, margin: 0 }}>{children}</p>
    </div>
  )
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: '22px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
        <thead>
          <tr>
            <th style={{ padding: '10px 14px', background: '#1C1208', color: '#C8A878', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textAlign: 'left', width: '160px' }}>CATEGORY</th>
            <th style={{ padding: '10px 14px', background: '#1C1208', color: '#C8A878', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textAlign: 'left' }}>DATA COLLECTED</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([cat, detail], i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#FDFAF5' : '#F2EDE6' }}>
              <td style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#1C1208', border: '1px solid #E0D0B8', verticalAlign: 'top' }}>{cat}</td>
              <td style={{ padding: '10px 14px', fontSize: '12px', color: '#3A2A1A', lineHeight: 1.6, border: '1px solid #E0D0B8' }}>{detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: '0 0 22px', paddingLeft: '0', listStyle: 'none' }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid #E0D0B8' : 'none',
        }}>
          <span style={{ fontSize: '10px', color: '#D94F00', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>—</span>
          <span style={{ fontSize: '13px', color: '#3A2A1A', lineHeight: 1.7 }}>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: '#C8A878', margin: '0 0 48px' }} />
}