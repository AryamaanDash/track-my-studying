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
  ["cookies", "Cookies and browser storage"],
  ["retention", "Retention and deletion"],
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
                  <time dateTime="2026-09-10">September 10, 2026</time>
                </dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>
                  <time dateTime="2026-09-10">September 10, 2026</time>
                </dd>
              </div>
            </dl>
          </header>

          <section className="privacy-at-a-glance" aria-labelledby="privacy-summary-title">
            <h2 id="privacy-summary-title">The short version</h2>
            <ul>
              <li>
                You provide an email address, a password, and any study sessions, journal
                entries, or weekly reflections you choose to save. We store a password
                hash, not your readable password. Unsaved focus-timer notes stay in your tab.
              </li>
              <li>
                We use Vercel Web Analytics to understand website usage. We do not sell
                personal information, show targeted advertising, or use advertising trackers.
              </li>
              <li>
                We use AI-assisted tools, including tools from OpenAI, for development,
                maintenance, and support. The current website code does not automatically
                send saved study records to an AI provider.
              </li>
              <li>
                Vercel hosts the website, Prisma Data provides database infrastructure, and
                Upstash supports abuse prevention. You can delete your account in Settings
                or contact us about privacy rights, including a copy of your data.
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
                    stored. We also store an internal account identifier and account creation
                    and update timestamps. We do not retain the readable password you enter.
                  </li>
                  <li>
                    <strong>Study information:</strong> the subject, number of hours, date,
                    and optional journal entry for each study session you save.
                  </li>
                  <li>
                    <strong>Weekly reflections:</strong> the week you select, what worked,
                    what felt difficult, your priorities for the following week, and when
                    the reflection was created or updated. These are saved separately from
                    individual study sessions.
                  </li>
                  <li>
                    <strong>Focus-timer drafts:</strong> the timer state, elapsed time,
                    start time, date, subject, and draft notes are kept in your browser tab.
                    When you choose Save Entry, the subject, rounded study hours, date, and
                    notes are sent to us and saved as a study session. Starting or pausing
                    the timer does not itself save a study session to your account.
                  </li>
                  <li>
                    <strong>Communications:</strong> the information you include if you
                    contact us for support or make a privacy request.
                  </li>
                </ul>
                <p>
                  Journal entries, timer notes, and reflections are free-form. Please avoid
                  unnecessary sensitive information, such as medical details, financial
                  account information, government identifiers, or private information about
                  other people. If you save that information in these fields, it becomes
                  part of the content we store for you.
                </p>
                <p>
                  An email address and password are required to create an account. You choose
                  whether to save study records or reflections; journal notes are optional.
                  You can read public pages without creating an account, although technical,
                  security, and website-usage information may still be processed.
                </p>

                <h3>Information collected automatically</h3>
                <ul>
                  <li>
                    <strong>Authentication and security information:</strong> session
                    identifiers, login status, and related security data used to keep you
                    signed in and protect your account.
                  </li>
                  <li>
                    <strong>Abuse-prevention information:</strong> we use IP addresses,
                    sign-in email addresses, or account identifiers to limit excessive
                    requests. Before sending a rate-limit identifier to Upstash, the app
                    converts it into a keyed hash. Upstash receives that pseudonymous
                    identifier, request counters, and time-window information, rather than
                    the raw identifier. This hashing does not make the information anonymous.
                  </li>
                  <li>
                    <strong>Technical and request information:</strong> our hosting provider
                    may process IP address, browser and device type, requested pages, request
                    timestamps, referring page, approximate location derived from IP address,
                    and error or diagnostic information in ordinary server and security logs.
                  </li>
                  <li>
                    <strong>Website analytics:</strong> Vercel Web Analytics may process page
                    URLs, filtered query parameters, referring pages, event times, approximate
                    location, and browser, operating-system, and device information. It
                    measures visits to public and signed-in pages. We do not configure
                    custom analytics events that send passwords, journal text, or reflections.
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
                  <li>save, retrieve, display, edit, and delete study sessions and reflections;</li>
                  <li>provide your account&apos;s journal, focus timer, calendar, and study summaries;</li>
                  <li>understand website traffic and usage through Vercel Web Analytics;</li>
                  <li>operate, troubleshoot, secure, maintain, and improve the service;</li>
                  <li>respond to support requests and privacy requests;</li>
                  <li>prevent fraud, abuse, or security incidents; and</li>
                  <li>comply with law and protect our rights and the rights of others.</li>
                </ul>
                <p>
                  Where European Economic Area or United Kingdom data protection law applies,
                  we rely on performance of a contract to provide the account and study-tracking
                  features you request; legitimate interests in protecting the service from
                  abuse, resolving support issues, and understanding and improving website
                  usage; and compliance with legal obligations. Where an activity requires
                  consent, we must obtain it before that processing begins, and you may
                  withdraw it. Acknowledging this policy during signup is not blanket consent
                  to unrelated processing or future AI features.
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
                  The website currently has no user-facing AI feature and does not automatically
                  send your email address, password, journal entries, timer drafts, or weekly
                  reflections to OpenAI or another AI model. If we introduce an
                  optional AI feature that processes user content, we will identify the AI use
                  at the point of use and update this policy before that new processing begins.
                </p>
                <p>
                  We do not use AI to make decisions that produce legal or similarly
                  significant effects about you. The study totals, charts, and calendars in
                  your account are calculated from your saved sessions; they are not AI-generated
                  assessments. AI-assisted support output can be inaccurate and requires review.
                </p>
              </section>

              <section id="sharing" aria-labelledby="sharing-title">
                <p className="privacy-section-number">04</p>
                <h2 id="sharing-title">Third parties and sharing</h2>
                <p>
                  We do not sell personal information or share it for cross-context behavioral
                  advertising. The following providers support the service and may process
                  information for the purposes described below:
                </p>

                <div
                  className="privacy-table-wrap"
                  role="region"
                  aria-label="Service providers, scroll horizontally to read all columns"
                  tabIndex={0}
                >
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
                        <td>Website hosting, network delivery, server functions, and Web Analytics.</td>
                        <td>
                          Request and device information, IP address, authentication data, and
                          information processed while serving your requests, plus website-usage
                          data described above for Web Analytics.
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
                          study sessions, journal entries, and weekly reflections, including
                          their associated identifiers and timestamps.
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">
                          <a
                            href="https://upstash.com/trust/privacy.pdf"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Upstash <ExternalLink aria-hidden="true" />
                          </a>
                        </th>
                        <td>Redis storage for request limits and abuse prevention.</td>
                        <td>
                          Keyed hashes derived from IP addresses, sign-in email addresses, or
                          account identifiers, with request counters and time windows. The
                          rate-limiting integration does not send passwords or study content,
                          and its optional analytics feature is disabled.
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
                        <td>AI-assisted development, maintenance, troubleshooting, and support.</td>
                        <td>
                          Information intentionally submitted for a specific AI-assisted task,
                          such as code, limited logs, or support content. Saved study records
                          are not automatically sent to these tools by the website.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p>
                  These providers may use their own subprocessors under their agreements and
                  published privacy materials. Provider links explain their own practices;
                  they do not replace this policy. The website currently has no advertising
                  networks, social login, payment processing, or automated email-delivery
                  integration. If you email us, your email service and the recipient&apos;s
                  email service also process that correspondence.
                </p>
                <p>
                  Your saved journal and reflections are not published for other users.
                  The operator and service providers may process them as needed to operate,
                  support, secure, or comply with legal obligations for the service. The
                  Security section explains how account privacy differs from end-to-end encryption.
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
                <h2 id="cookies-title">Cookies and browser storage</h2>
                <p>
                  We use strictly necessary authentication and security cookies, including a
                  session token, to keep you signed in and protect account requests. You can
                  block or delete cookies in your browser, but account login may stop working.
                  Session cookies normally expire after 30 days and may be renewed when you
                  use the service. Signing out clears the session in that browser; it does
                  not sign out other browsers or devices.
                </p>
                <p>
                  Your theme preference uses local storage and stays until you change it or
                  clear the website&apos;s browser data. Focus-timer state and unsaved notes
                  use session storage for your account in the current tab. They survive page
                  refreshes and navigation in that tab and are cleared when you save or discard
                  the timer session. Closing the tab normally ends this storage, but browser
                  session-restore features may preserve it. Neither signing out nor deleting
                  your account currently clears those local drafts. On a shared device, discard
                  drafts and clear this website&apos;s browser data when you finish.
                </p>
                <p>
                  Weekly reflections are saved to your account only when you choose Save
                  reflection. Text you have not saved can be lost when you leave the page.
                  Clearing browser storage does not delete study records already saved to
                  your account.
                </p>
                <p>
                  Vercel Web Analytics uses a hash derived from incoming requests to distinguish
                  visitors without analytics cookies. Vercel says that visitor identifier is
                  discarded after 24 hours; this is not a promise that all analytics statistics
                  are deleted after 24 hours. Read{" "}
                  <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noreferrer">
                    Vercel&apos;s analytics privacy information
                  </a>.
                </p>
                <p>
                  We do not use advertising cookies. Because we do not
                  sell personal information or use cross-context behavioral advertising, the
                  service does not change its behavior in response to browser Do Not Track or
                  Global Privacy Control signals; there is no sale or advertising share to opt
                  out of under the current practices. These signals do not currently disable
                  website analytics. Browser privacy tools may restrict requests or storage;
                  blocking necessary cookies can prevent sign-in.
                </p>
              </section>

              <section id="retention" aria-labelledby="retention-title">
                <p className="privacy-section-number">06</p>
                <h2 id="retention-title">Retention and deletion</h2>
                <p>
                  We keep your account, saved study sessions, journal entries, and weekly
                  reflections while you keep an account, unless you delete records or make a
                  deletion request. Signing out or taking a break does not delete saved content.
                  The website does not currently apply an automatic inactivity-deletion schedule.
                </p>
                <h3>Deleting your account or records</h3>
                <p>
                  You can remove individual study sessions from your study history. To close
                  your account, open <Link href="/settings">Settings</Link> and choose
                  Permanently delete my account. You must confirm your password, type DELETE,
                  and acknowledge the deletion. Successful deletion removes your account and
                  its associated study sessions, journal entries, and weekly reflections from
                  the active database. There is no user recovery period or undo. Request any
                  copy you need before deleting your account.
                </p>
                <p>
                  Deletion does not instantly erase every copy everywhere. Temporary copies
                  may remain in application caches until refreshed or expired, and content
                  already loaded in another browser may remain visible there. Other browsers
                  may retain their existing sign-in sessions until they sign out or expire.
                  Local timer drafts and theme preferences follow the browser-storage rules
                  above. Sign out on each device and clear site data to remove local copies.
                </p>
                <h3>Other retention</h3>
                <ul>
                  <li>
                    <strong>Security counters:</strong> individual rate-limit counter keys
                    expire automatically within approximately two hours of creation under
                    the current settings. Continued use creates new counters. They are not
                    deleted as part of account deletion and are separate from your study records.
                  </li>
                  <li>
                    <strong>Logs, backups, and analytics:</strong> retention depends on the
                    provider, service configuration, and whether information is needed to
                    diagnose a problem, investigate abuse, restore the service, or meet a legal
                    obligation. Backup copies may remain until the relevant backup expires or
                    is overwritten. Aggregated website statistics are separate from your
                    account and are not automatically removed when you delete it.
                  </li>
                  <li>
                    <strong>Support and privacy requests:</strong> we retain correspondence
                    for as long as needed to resolve the request and, where necessary, document
                    our response, handle a related dispute, or comply with law.
                  </li>
                </ul>
                <p>
                  When personal information is no longer needed for these purposes, we delete
                  or de-identify it. Contact us for information about retention that applies
                  to a particular record or request; there is no single retention period for
                  all providers and data types.
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
                  You can view, edit, and remove study sessions in your study history, edit
                  weekly reflections on the Weekly Reflection page, and delete your account
                  in Settings. The website does not currently offer a self-service data export,
                  a separate delete button for a weekly reflection, or password recovery.
                </p>
                <p>
                  To request a copy of your account data, deletion of a particular reflection,
                  a correction you cannot make in the app, or help exercising a right when you
                  cannot sign in, email us using the <a href="#contact">contact details below</a>.
                  Include the email address associated with your account and describe your
                  request. Do not send your password or unnecessary sensitive documents.
                  We may need to verify your
                  identity and account ownership before fulfilling a request. Authorized agents
                  may make requests where applicable law permits it, subject to verification of
                  their authority.
                </p>
                <p>
                  We will respond within the time required by applicable law and explain any
                  permitted extension or reason we cannot fulfill a request. You can reply to
                  ask us to review a refusal or to appeal where that right applies. Withdrawing
                  consent does not affect the lawfulness of earlier processing based on consent.
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
                <p>
                  Study content is not end-to-end encrypted. It is processed by the application
                  and stored in the database in a form the service can read. Protect your
                  password, sign out on shared devices, and contact us if you suspect
                  unauthorized access. Do not include your password in a support message.
                </p>
              </section>

              <section id="children" aria-labelledby="children-title">
                <p className="privacy-section-number">09</p>
                <h2 id="children-title">Children&apos;s privacy</h2>
                <p>
                  Track My Studying is intended for people aged 13 and older and is not directed
                  to children under 13. Children under 13 should not create an account or submit
                  personal information. Users who are minors where they live should use the
                  service only with permission from a parent or guardian. Signup does not
                  currently collect a date of birth or verify age or parental permission.
                </p>
                <p>
                  We do not knowingly collect personal information from children under 13.
                  If you believe a child under 13 has provided information, contact us using
                  the address below and identify the account if you can. We will investigate
                  and take steps to remove information collected contrary to applicable
                  children&apos;s privacy requirements. The service does not currently offer
                  a parental-consent registration process for children under 13.
                </p>
              </section>

              <section id="international-transfers" aria-labelledby="transfers-title">
                <p className="privacy-section-number">10</p>
                <h2 id="transfers-title">International transfers</h2>
                <p>
                  We and our providers may process information in the United States and other
                  countries where they operate. Those countries may have different data
                  protection laws from your country. Processing locations depend on the provider
                  and configured service region; this policy does not promise storage only in
                  your home country. Where applicable law requires transfer safeguards, these
                  must be in place, such as an applicable adequacy decision or approved
                  contractual clauses. Contact us for the locations and safeguards relevant to
                  your information and how to obtain a copy of applicable safeguards.
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
                  Aryamaan Dash is the operator responsible for Track My Studying&apos;s
                  processing of personal information. For privacy questions, access or deletion
                  requests, appeals, or concerns about a child&apos;s information, email:
                </p>
                <a
                  className="privacy-contact-link"
                  href="mailto:aryamaan.dash@icloud.com"
                >
                  aryamaan.dash@icloud.com
                </a>
                <p>
                  You can contact us without signing in. Use a subject such as “Track My
                  Studying privacy request” and include enough information to identify the
                  account or issue. This mailbox uses Apple iCloud Mail, so Apple processes
                  correspondence sent to it under its{" "}
                  <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noreferrer">
                    privacy policy
                  </a>.
                </p>
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
