import { Fragment } from "react";

export const metadata = {
  title: "Reunio Child Safety Standards",
  description:
    "Reunio's Child Safety Standards: our zero-tolerance policy on child sexual abuse and exploitation (CSAE), how to report concerns, and how reports are handled.",
};

const EFFECTIVE_DATE = "September 10, 2026";
const CONTACT_EMAIL = "returnaapp@gmail.com";
const PRIVACY_POLICY_URL = "https://foundly-app-topaz.vercel.app/privacy-policy";
const DELETE_ACCOUNT_URL = "https://foundly-app-topaz.vercel.app/delete-account";

function Section({ id, heading, children }) {
  return (
    <section id={id} className="mt-10">
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{heading}</h2>
      <div className="mt-3 text-[15px] leading-7 text-gray-700 dark:text-gray-300">{children}</div>
    </section>
  );
}

function List({ items }) {
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function Paragraph({ children }) {
  return <p className="mt-3">{children}</p>;
}

function EmailLink() {
  return (
    <a
      className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400"
      href={`mailto:${CONTACT_EMAIL}`}
    >
      {CONTACT_EMAIL}
    </a>
  );
}

export default function ChildSafetyPage() {
  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          Reunio &middot; formerly Foundly
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Reunio Child Safety Standards
        </h1>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Effective date: {EFFECTIVE_DATE}
        </p>

        <Paragraph>
          These Child Safety Standards explain Reunio&rsquo;s (the app formerly known as Foundly)
          commitment to protecting children and to preventing our platform from being used to
          facilitate child sexual abuse or exploitation (&ldquo;CSAE&rdquo;). &ldquo;Reunio,&rdquo;
          &ldquo;we,&rdquo; and &ldquo;our&rdquo; refer to the team that operates the Reunio service.
        </Paragraph>

        <Section id="purpose" heading="1. Purpose">
          <Paragraph>
            Reunio is a lost-and-found platform designed to help people report lost items, report
            found items, communicate with one another about those items, and get belongings reunited
            with their owners. Reunio is committed to preventing the platform from being used, in any
            way, to facilitate child sexual abuse or exploitation.
          </Paragraph>
        </Section>

        <Section id="zero-tolerance" heading="2. Zero-Tolerance Policy">
          <Paragraph>
            Reunio has a zero-tolerance policy toward child sexual abuse and exploitation. The
            following are strictly prohibited on Reunio:
          </Paragraph>
          <List
            items={[
              <Fragment key="csae">Child sexual abuse and exploitation.</Fragment>,
              <Fragment key="csam">Child sexual abuse material (CSAM).</Fragment>,
              <Fragment key="sexualization">Sexual exploitation or sexualization of minors.</Fragment>,
              <Fragment key="grooming">
                Grooming or attempts to establish inappropriate sexual contact with minors.
              </Fragment>,
              <Fragment key="solicit">
                Soliciting, requesting, uploading, sharing, distributing, or promoting sexual content
                involving minors.
              </Fragment>,
              <Fragment key="arrange">
                Using Reunio to arrange or facilitate sexual abuse or exploitation of children.
              </Fragment>,
              <Fragment key="other">Any other conduct that facilitates or promotes CSAE.</Fragment>,
            ]}
          />
          <Paragraph>
            Content or conduct that violates this policy may result in removal of the content,
            suspension or deactivation of the associated account, preservation of relevant information
            where appropriate, and reporting to appropriate authorities when legally required or
            appropriate.
          </Paragraph>
        </Section>

        <Section id="user-safety" heading="3. User Safety">
          <Paragraph>
            When using Reunio, do not share unnecessary sensitive personal information &mdash; with
            other users or in reports, messages, or claims &mdash; and avoid engaging with users whose
            behavior seems suspicious or unsafe. If an interaction on Reunio makes you uncomfortable,
            stop engaging with that user and report it as described below.
          </Paragraph>
        </Section>

        <Section id="reporting" heading="4. Reporting Safety Concerns">
          <Paragraph>
            Reunio&rsquo;s app currently includes a general-purpose reporting feature: from a listing
            or a user, you can choose &ldquo;Report&rdquo; and select a reason (spam, inappropriate
            content, fraud or scam, harassment, or other), with an optional written description. This
            feature is not specific to child-safety concerns and does not currently support attaching
            screenshots or other files.
          </Paragraph>
          <Paragraph>
            For child-safety concerns, including anything related to CSAE, please contact us directly
            at <EmailLink /> rather than relying solely on the in-app report reason list. When you
            report a concern, please include, where you have it:
          </Paragraph>
          <List
            items={[
              <Fragment key="account-email">Your Reunio account email, if applicable.</Fragment>,
              <Fragment key="description">A description of the concern.</Fragment>,
              <Fragment key="username">Relevant username or account information.</Fragment>,
              <Fragment key="item-info">
                Item, report, or message information that helps us identify the issue (for example, a
                report title or a conversation).
              </Fragment>,
              <Fragment key="evidence">Screenshots or other relevant evidence, where appropriate.</Fragment>,
            ]}
          />
          <Paragraph>
            If you believe a child is in immediate danger, please contact local law enforcement or
            emergency services directly, in addition to reporting the concern to us.
          </Paragraph>
        </Section>

        <Section id="handling-reports" heading="5. Handling of Reports">
          <Paragraph>
            When we receive a report of a child-safety concern, we review it and take appropriate
            action under this policy and our other applicable policies, which may include restricting
            or removing the content or account involved. Where required or appropriate, we cooperate
            with lawful requests from relevant authorities.
          </Paragraph>
        </Section>

        <Section id="csam" heading="6. Child Sexual Abuse Material">
          <Paragraph>
            Reunio does not permit child sexual abuse material (CSAM) on the platform in any form, and
            does not permit users to upload, request, distribute, or otherwise facilitate such
            material. Suspected CSAM or other child exploitation concerns may be escalated to
            appropriate authorities where required by applicable law.
          </Paragraph>
        </Section>

        <Section id="contact" heading="7. Child Safety Contact">
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Child Safety Contact
            </p>
            <a
              className="mt-2 block break-all text-lg font-bold text-blue-700 underline underline-offset-4 dark:text-blue-400"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-2 text-[15px] leading-7 text-gray-600 dark:text-gray-300">
              This is our designated contact for reporting child-safety concerns, including CSAE and
              CSAM.
            </p>
          </div>
        </Section>

        <Section id="legal-compliance" heading="8. Legal Compliance">
          <Paragraph>
            Reunio seeks to comply with applicable child-safety and child-protection laws and will
            cooperate with lawful requests from appropriate authorities in connection with child-safety
            matters.
          </Paragraph>
        </Section>

        <Section id="enforcement" heading="9. Enforcement">
          <Paragraph>Violations of these Child Safety Standards can result in:</Paragraph>
          <List
            items={[
              <Fragment key="removal">Removal of the violating content.</Fragment>,
              <Fragment key="restriction">Restriction of the associated account.</Fragment>,
              <Fragment key="deactivation">Deactivation of the associated account.</Fragment>,
              <Fragment key="other-action">Other appropriate action.</Fragment>,
              <Fragment key="escalation">
                Reporting or escalation to authorities where legally required or appropriate.
              </Fragment>,
            ]}
          />
        </Section>

        <Section id="updates" heading="10. Updates">
          <Paragraph>
            These Child Safety Standards may be updated as Reunio&rsquo;s safety practices and legal
            obligations evolve. When we do, we will update the &ldquo;Effective date&rdquo; at the top
            of this page.
          </Paragraph>
        </Section>

        <Section id="links" heading="11. Links">
          <List
            items={[
              <Fragment key="privacy">
                <a
                  className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400"
                  href={PRIVACY_POLICY_URL}
                >
                  Reunio Privacy Policy
                </a>
              </Fragment>,
              <Fragment key="delete">
                <a
                  className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400"
                  href={DELETE_ACCOUNT_URL}
                >
                  Account deletion request
                </a>
              </Fragment>,
            ]}
          />
        </Section>

        <footer className="mt-14 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <p>Reunio (formerly Foundly) &middot; Child Safety Standards &middot; Effective {EFFECTIVE_DATE}</p>
        </footer>
      </div>
    </main>
  );
}
