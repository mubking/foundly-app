import { Fragment } from "react";

export const metadata = {
  title: "Request Deletion of Your Reunio Account",
  description:
    "Learn how to request permanent deletion of your Reunio account and the account-associated data we hold, including how to contact us at returnaapp@gmail.com.",
};

const CONTACT_EMAIL = "returnaapp@gmail.com";
const PRIVACY_POLICY_URL = "https://foundly-app-topaz.vercel.app/privacy-policy";

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

export default function DeleteAccountPage() {
  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          Reunio &middot; formerly Foundly
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Request Deletion of Your Reunio Account
        </h1>
        <Paragraph>
          This page explains how to request permanent deletion of your Reunio account and the
          account-associated data described below. Reunio does not currently offer an in-app feature that
          permanently erases all of your data on its own, so permanent deletion requests are handled by
          email as described on this page.
        </Paragraph>

        <Section id="how-to-request-deletion" heading="How to request deletion">
          <Paragraph>
            To request permanent deletion of your Reunio account and its associated data:
          </Paragraph>
          <List
            items={[
              <Fragment key="from-associated-email">
                Email us at <EmailLink />{" "}
                <strong>from the email address associated with your Reunio account</strong>.
              </Fragment>,
              <Fragment key="include-account-email">
                In your email, include the email address associated with your Reunio account.
              </Fragment>,
              <Fragment key="state-request">
                Clearly state that you want your account and associated data permanently deleted.
              </Fragment>,
            ]}
          />
          <Paragraph>
            You can also first deactivate your account from inside the app by going to{" "}
            <strong>Settings &rarr; Deactivate Account</strong>. Deactivation is not the same as a
            permanent deletion request &mdash; see{" "}
            <a
              className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400"
              href="#important-distinction"
            >
              the important distinction below
            </a>
            .
          </Paragraph>
        </Section>

        <Section id="data-deletion" heading="What a permanent deletion request covers">
          <Paragraph>
            A permanent deletion request covers your Reunio account and the account-associated data listed
            below, where applicable:
          </Paragraph>
          <List
            items={[
              <Fragment key="account">Account and profile information</Fragment>,
              <Fragment key="photo">Profile photo</Fragment>,
              <Fragment key="reports">Lost and found reports</Fragment>,
              <Fragment key="report-photos">Report photos</Fragment>,
              <Fragment key="claims">Claims and claim information</Fragment>,
              <Fragment key="messages">Chat and messages associated with the account</Fragment>,
              <Fragment key="saved-searches">Saved searches and notification preferences</Fragment>,
              <Fragment key="push-tokens">Push notification tokens</Fragment>,
              <Fragment key="other">Other account-associated information</Fragment>,
            ]}
          />
        </Section>

        <Section id="data-that-may-be-retained" heading="Data that may be retained">
          <Paragraph>Some information may need to be retained where necessary for:</Paragraph>
          <List
            items={[
              <Fragment key="legal">Legal obligations</Fragment>,
              <Fragment key="security">Security</Fragment>,
              <Fragment key="fraud">Fraud prevention</Fragment>,
              <Fragment key="disputes">Dispute resolution</Fragment>,
              <Fragment key="record-keeping">Legitimate record-keeping</Fragment>,
            ]}
          />
          <Paragraph>
            Retained information will only be kept for as long as reasonably necessary for the applicable
            purpose.
          </Paragraph>
        </Section>

        <Section
          id="important-distinction"
          heading="Important: in-app deactivation is not permanent deletion"
        >
          <Paragraph>
            In the Reunio app, <strong>Settings &rarr; Deactivate Account</strong> deactivates and disables
            your account. It is a soft delete: it is not the same as a permanent deletion request, and it
            does not permanently erase all of your data. Clicking &ldquo;Deactivate Account&rdquo; does not
            permanently delete your account data or the content connected to it.
          </Paragraph>
          <Paragraph>
            If you want your account and associated data permanently deleted, you must send a permanent
            deletion request by emailing us from the email address associated with your Reunio account and
            clearly stating that you want your account and associated data permanently deleted, as described
            under &ldquo;How to request deletion&rdquo; above.
          </Paragraph>
        </Section>

        <Section id="contact" heading="Contact">
          <Paragraph>
            To request permanent deletion of your Reunio account, or if you have any questions about this
            page or about deleting your account, email us at:
          </Paragraph>
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Deletion requests
            </p>
            <a
              className="mt-2 block break-all text-lg font-bold text-blue-700 underline underline-offset-4 dark:text-blue-400"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-2 text-[15px] leading-7 text-gray-600 dark:text-gray-300">
              Please email us from the email address associated with your Reunio account, include that
              address in your message, and clearly state that you want your account and associated data
              permanently deleted.
            </p>
          </div>
        </Section>

        <Section id="privacy-policy" heading="Privacy policy">
          <Paragraph>
            For more detail about what information Reunio collects, how we use it, and the choices you have,
            please review the{" "}
            <a
              className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400"
              href={PRIVACY_POLICY_URL}
            >
              Reunio Privacy Policy
            </a>
            .
          </Paragraph>
        </Section>

        <footer className="mt-14 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <p>Reunio (formerly Foundly) &middot; Account deletion requests</p>
        </footer>
      </div>
    </main>
  );
}

