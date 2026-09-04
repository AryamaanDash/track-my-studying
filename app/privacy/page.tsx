import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck, Sprout } from "lucide-react";
import ThemeSelector from "@/components/ThemeSelector";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn what Track My Studying collects, how information is used, and which service providers may receive it.",
};

const policySections = [
  ["information-we-collect", "Information we collect"],
  ["how-we-use-information", "How we use information"],
  ["artificial-intelligence", "Artificial intelligence"],
  ["sharing", "Third parties and sharing"],
  ["cookies", "Cookies and local storage"],
  ["retention", "Retention"],
  ["rights", "Your privacy rights"],
  ["security", "Security"],
  ["children", "Children's privacy"],
  ["international-transfers", "International transfers"],
  ["changes", "Changes to this policy"],
  ["contact", "Contact us"],
] as const;

export default function PrivacyPage() {
  return (
    <div className="privacy-shell">
      <header className="cover-topbar privacy-topbar">
        <Link className="cover-topbar-brand" href="/" aria-label="Track My Studying home">
          <Sprout aria-hidden="true" />
          <span>Track My Studying</span>
        </Link>

        <nav aria-label="Privacy page navigation" className="cover-topbar-nav">
          <Link href="/" className="cover-topbar-link privacy-home-link">
            <ArrowLeft aria-hidden="true" />
            <span>Journal cover</span>
          </Link>
          <Link href="/login" className="cover-topbar-link">
            Log in
          </Link>
          <Link href="/register" className="cover-topbar-signup">
            Sign up
          </Link>
          <span className="cover-theme-control">
            <ThemeSelector />
          </span>
        </nav>
      </header>

      <main className="privacy-stage">
        <article className="privacy-paper" aria-labelledby="privacy-title">
          <header className="privacy-heading">
            <div className="privacy-imprint">
              <ShieldCheck aria-hidden="true" />
              <span>Privacy notes</span>
            </div>
            <p className="privacy-kicker">Track My Studying</p>
            <h1 id="privacy-title">Privacy Policy</h1>
            <p className="privacy-lede">
              This policy explains what personal information Track My Studying collects,
              why it is used, and who may receive it. Track My Studying is operated by
              Aryamaan Dash (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
            <dl className="privacy-dates">
              <div>
                <dt>Effective</dt>
                <dd>
                  <time dateTime="2026-09-03">September 3, 2026</time>
                </dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>
                  <time dateTime="2026-09-03">September 3, 2026</time>
                </dd>
              </div>
            </dl>
          </header>

          <section className="privacy-at-a-glance" aria-labelledby="privacy-summary-title">
            <h2 id="privacy-summary-title">The short version</h2>
            <ul>
              <li>
                You provide an email address, a password, and the study records you choose
                to save. We retain a password hash, not your readable password.
              </li>
              <li>
                We do not sell personal information, show targeted advertising, or use
                third-party advertising trackers.
              </li>
              <li>
                We use AI-assisted tools, including tools from OpenAI, for development,
                maintenance, and support. The current website code does not automatically
                send saved study records to an AI provider.
              </li>
              <li>
                The named providers that may process personal information are Vercel,
                Prisma Data, and, when AI-assisted work or an AI feature is used, OpenAI.
              </li>
            </ul>
          </section>

          <div className="privacy-layout">
            <nav className="privacy-contents" aria-label="Privacy policy contents">
              <p>On this page</p>
              <ol>
                {policySections.map(([id, label], index) => (
                  <li key={id}>
                    <a href={`#${id}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="privacy-content">
              <section id="information-we-collect" aria-labelledby="information-title">
                <p className="privacy-section-number">01</p>
                <h2 id="information-title">Information we collect</h2>
                <h3>Information you provide</h3>
                <ul>
                  <li>
                    <strong>Account information:</strong> your email address and password.
                    Your password is transformed into a one-way bcrypt hash before it is
                    stored. We do not retain the readable password you enter.
                  </li>
                  <li>
                    <strong>Study information:</strong> the subject, number of hours, date,
                    and optional journal entry for each study session you save.
                  </li>
                  <li>
                    <strong>Communications:</strong> the information you include if you
                    contact us for support or make a privacy request.
                  </li>
                </ul>
                <p>
                  Journal fields are free-form. Please do not enter sensitive personal
                  information that is not needed to track your studying.
                </p>

                <h3>Information collected automatically</h3>
                <ul>
                  <li>
                    <strong>Authentication and security information:</strong> session
                    identifiers, login status, and related security data used to keep you
                    signed in and protect your account.
                  </li>
                  <li>
                    <strong>Technical and request information:</strong> our hosting provider
                    may process IP address, browser and device type, requested pages, request
                    timestamps, referring page, approximate location derived from IP address,
                    and error or diagnostic information in ordinary server and security logs.
                  </li>
                  <li>
                    <strong>Preferences:</strong> your light or dark theme choice is stored
                    in your browser&apos;s local storage under the key
                    <code>track-my-studying-theme</code>. This preference is not saved in your
                    Track My Studying account.
                  </li>
                </ul>

                <h3>Information we create</h3>
                <p>
                  We calculate totals, calendar views, trends, and other study analytics from
                  the study sessions you save. We collect information directly from you,
                  automatically from your browser and device, and from these calculations.
                </p>
              </section>

              <section id="how-we-use-information" aria-labelledby="use-title">
                <p className="privacy-section-number">02</p>
                <h2 id="use-title">How we use information</h2>
                <p>We use personal information to:</p>
                <ul>
                  <li>create your account, authenticate you, and maintain your session;</li>
                  <li>save, retrieve, display, aggregate, and delete your study records;</li>
                  <li>provide your private journal, calendar, and study analytics;</li>
                  <li>operate, troubleshoot, secure, maintain, and improve the service;</li>
                  <li>respond to support requests and privacy requests;</li>
                  <li>prevent fraud, abuse, or security incidents; and</li>
                  <li>comply with law and protect our rights and the rights of others.</li>
                </ul>
                <p>
                  Where European Economic Area or United Kingdom data protection law applies,
                  our legal bases are performance of our contract with you for account and
                  study-tracking features; our legitimate interests in operating, securing,
                  and improving the service; your consent for optional processing where we ask
                  for it; and compliance with legal obligations.
                </p>
              </section>

              <section id="artificial-intelligence" aria-labelledby="ai-title">
                <p className="privacy-section-number">03</p>
                <h2 id="ai-title">Artificial intelligence</h2>
                <p>
                  We use AI-assisted tools provided by OpenAI in connection with developing,
                  maintaining, troubleshooting, supporting, and improving Track My Studying.
                  Those tools may process the information we choose to provide for a specific
                  task, such as source code, limited technical logs, or the contents of a
                  support request. We aim to minimize or de-identify personal information
                  before using it in this way when practical, and we do not intentionally
                  provide account passwords to an AI provider.
                </p>
                <p>
                  As of the effective date, the website&apos;s application code does not
                  automatically send your email address, password, journal entries, or other
                  saved study records to OpenAI or another AI model. If we introduce an
                  optional AI feature that processes user content, we will identify the AI use
                  at the point of use and update this policy before that new processing begins.
                </p>
                <p>
                  We do not use AI to make decisions that produce legal or similarly
                  significant effects about you. AI output can be inaccurate, so it should not
                  be treated as professional advice.
                </p>
              </section>

              <section id="sharing" aria-labelledby="sharing-title">
                <p className="privacy-section-number">04</p>
                <h2 id="sharing-title">Third parties and sharing</h2>
                <p>
                  We do not sell personal information or share it for cross-context behavioral
                  advertising. Based on the current code and deployment configuration, these
                  are the named service providers that may receive or process personal
                  information:
                </p>

                <div className="privacy-table-wrap">
                  <table>
                    <caption>Named service providers</caption>
                    <thead>
                      <tr>
                        <th scope="col">Provider</th>
                        <th scope="col">Purpose</th>
                        <th scope="col">Information involved</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">
                          <a
                            href="https://vercel.com/legal/privacy-notice"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Vercel, Inc. <ExternalLink aria-hidden="true" />
                          </a>
                        </th>
                        <td>Website hosting, network delivery, and server functions.</td>
                        <td>
                          Request and device information, IP address, authentication data, and
                          information processed by the application while serving your requests.
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">
                          <a
                            href="https://www.prisma.io/legal/privacy"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Prisma Data, Inc. <ExternalLink aria-hidden="true" />
                          </a>
                        </th>
                        <td>Managed PostgreSQL database and data infrastructure.</td>
                        <td>
                          Account records, password hashes, authentication records, and saved
                          study sessions and journal entries.
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">
                          <a
                            href="https://openai.com/policies/privacy-policy/"
                            target="_blank"
                            rel="noreferrer"
                          >
                            OpenAI OpCo, LLC / OpenAI Ireland Limited{" "}
                            <ExternalLink aria-hidden="true" />
                          </a>
                        </th>
                        <td>AI-assisted development, maintenance, support, and future AI features.</td>
                        <td>
                          Information intentionally submitted for a specific AI-assisted task,
                          such as code, limited logs, support content, or content you choose to
                          use with a clearly identified AI feature.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p>
                  These providers may use their own subprocessors under their agreements and
                  published privacy materials. The current application code does not include
                  third-party analytics, advertising networks, social-login providers, payment
                  processors, or email-delivery services.
                </p>
                <p>
                  We may also disclose information to courts, regulators, law enforcement, or
                  other parties when reasonably necessary to comply with law, protect safety or
                  rights, investigate misuse, or respond to valid legal process. If the service
                  is involved in a merger, financing, reorganization, or sale, information may
                  be disclosed to professional advisers and the identified transaction parties,
                  subject to appropriate confidentiality protections. These recipients cannot
                  be named in advance because they do not currently exist or depend on the
                  circumstances.
                </p>
              </section>

              <section id="cookies" aria-labelledby="cookies-title">
                <p className="privacy-section-number">05</p>
                <h2 id="cookies-title">Cookies and local storage</h2>
                <p>
                  We use strictly necessary authentication and security cookies, including a
                  session token, to keep you signed in and protect account requests. You can
                  block or delete cookies in your browser, but account login may stop working.
                  The theme preference described above uses local storage rather than a cookie.
                </p>
                <p>
                  We do not use advertising cookies or third-party analytics. Because we do not
                  sell personal information or use cross-context behavioral advertising, the
                  service does not change its behavior in response to browser Do Not Track or
                  Global Privacy Control signals; there is no sale or advertising share to opt
                  out of under the current practices.
                </p>
              </section>

              <section id="retention" aria-labelledby="retention-title">
                <p className="privacy-section-number">06</p>
                <h2 id="retention-title">Retention</h2>
                <p>
                  We retain account, authentication, and study information while your account
                  is active and afterward only as reasonably necessary to provide the service,
                  honor deletion requests, maintain security, resolve disputes, enforce
                  agreements, and comply with legal obligations. Session cookies remain until
                  they expire, you sign out, or you delete them. Infrastructure logs and
                  backups follow the applicable provider&apos;s retention schedules.
                </p>
                <p>
                  When information is no longer needed, we will delete it or de-identify it,
                  subject to limited backup, security, fraud-prevention, and legal-retention
                  requirements.
                </p>
              </section>

              <section id="rights" aria-labelledby="rights-title">
                <p className="privacy-section-number">07</p>
                <h2 id="rights-title">Your privacy rights</h2>
                <p>
                  Depending on where you live, you may have the right to request access to,
                  correction of, deletion of, or a portable copy of your personal information;
                  to restrict or object to certain processing; to withdraw consent where we rely
                  on consent; and to appeal a denied request. You may also have the right to
                  complain to your local data protection authority. We will not discriminate
                  against you for exercising a privacy right.
                </p>
                <p>
                  To exercise a right, use the contact method in the
                  <a href="#contact"> Contact us</a> section. We may need to verify your
                  identity and account ownership before fulfilling a request. Authorized agents
                  may make requests where applicable law permits it, subject to verification of
                  their authority.
                </p>
                <aside className="privacy-right-to-object" aria-label="Right to object notice">
                  <strong>Your right to object:</strong> where we rely on legitimate interests,
                  you may object to processing based on your particular situation. We do not
                  currently use personal information for direct marketing.
                </aside>
              </section>

              <section id="security" aria-labelledby="security-title">
                <p className="privacy-section-number">08</p>
                <h2 id="security-title">Security</h2>
                <p>
                  We use administrative and technical safeguards intended to protect personal
                  information. Current safeguards include one-way password hashing, authenticated
                  access controls, encrypted connections to the production database, and HTTPS
                  transport when the service is accessed through its production host. No method
                  of transmission or storage is completely secure, so we cannot guarantee
                  absolute security.
                </p>
              </section>

              <section id="children" aria-labelledby="children-title">
                <p className="privacy-section-number">09</p>
                <h2 id="children-title">Children&apos;s privacy</h2>
                <p>
                  Track My Studying is not directed to children under 13, and we do not knowingly
                  collect personal information from a child under 13. If you believe a child has
                  provided personal information without appropriate permission, contact us so we
                  can investigate and delete it where required. Users who are minors where they
                  live should use the service only with permission from a parent or guardian.
                </p>
              </section>

              <section id="international-transfers" aria-labelledby="transfers-title">
                <p className="privacy-section-number">10</p>
                <h2 id="transfers-title">International transfers</h2>
                <p>
                  We and our providers may process information in the United States and other
                  countries where they operate. Those countries may have different data
                  protection laws from your country. Where required, we rely on contractual or
                  other legally recognized safeguards for international transfers.
                </p>
              </section>

              <section id="changes" aria-labelledby="changes-title">
                <p className="privacy-section-number">11</p>
                <h2 id="changes-title">Changes to this policy</h2>
                <p>
                  We may update this policy as the service, providers, or law changes. We will
                  post the updated version here and change the “Last updated” date. If a change
                  materially affects how we use information already collected, we will provide
                  additional notice when reasonably required before the new use begins.
                </p>
              </section>

              <section id="contact" aria-labelledby="contact-title">
                <p className="privacy-section-number">12</p>
                <h2 id="contact-title">Contact us</h2>
                <p>
                  Aryamaan Dash is responsible for Track My Studying&apos;s privacy practices. For
                  a privacy question or request, contact Aryamaan using the contact information
                  published on the developer website:
                </p>
                <a
                  className="privacy-contact-link"
                  href="https://aryamaan-dash.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                >
                  aryamaan-dash.vercel.app
                  <ExternalLink aria-hidden="true" />
                </a>
              </section>
            </div>
          </div>

          <footer className="privacy-footer">
            <Sprout aria-hidden="true" />
            <span>Private study, thoughtfully kept.</span>
            <Link href="/register">Return to sign up</Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
