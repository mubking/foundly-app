import { Fragment } from "react";

export const metadata = {
  title: "Reunio Privacy Policy",
  description:
    "Privacy Policy for Reunio, a lost-and-found platform that helps people report, discover, and reunite lost and found items.",
};

const EFFECTIVE_DATE = "September 8, 2026";
const CONTACT_EMAIL = "returnaapp@gmail.com";

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

export default function PrivacyPolicyPage() {
  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          Reunio &middot; formerly Foundly
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Reunio Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Effective date: {EFFECTIVE_DATE}
        </p>

        <Paragraph>
          Reunio is a community lost-and-found service (the app formerly known as Foundly). It helps
          people report lost and found items, search for them, and get reunited with their belongings.
          This Privacy Policy explains what information Reunio collects, why we collect it, how we use
          and share it, and the choices you have. &ldquo;Reunio,&rdquo; &ldquo;we,&rdquo; and
          &ldquo;our&rdquo; refer to the team that operates the Reunio service.
        </Paragraph>
        <Section id="who-operates" heading="Who operates Reunio">
          <Paragraph>
            Reunio is operated by the team behind the Reunio app (formerly Foundly). If you have any
            questions about this Privacy Policy or about your information, you can contact us at{" "}
            <a className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </Paragraph>
        </Section>

        <Section id="what-we-collect" heading="What information Reunio collects">
          <p className="font-semibold">Information you provide</p>
          <List
            items={[
              <Fragment key="account">
                <strong>Account details.</strong> When you create an account with an email address and
                password, you provide your first name, last name, email address, phone number, and a
                password. Your password is stored only as a one-way, cryptographically hashed value (using
                bcrypt) — we never store your password in readable form.
              </Fragment>,
              <Fragment key="social">
                <strong>Google or Apple sign-in.</strong> If you sign in with Google or Apple, that provider
                shares with us the profile information you authorize (typically your name and verified email
                address), and we store a provider account identifier so we can sign you back in. We never
                receive or store your Google or Apple password.
              </Fragment>,
              <Fragment key="profile">
                <strong>Profile information.</strong> You may optionally add a profile photo and update your
                name and phone number in Settings.
              </Fragment>,
              <Fragment key="reports">
                <strong>Lost and found reports.</strong> When you post a lost or found item, you provide a
                title, a description, a category, photos you attach, location details (such as an address,
                neighborhood, city, or state), the date the item was lost or found, and, for lost items, an
                optional reward amount.
              </Fragment>,
              <Fragment key="claims">
                <strong>Claims.</strong> When you claim an item you believe is yours, you provide a message
                explaining your claim and may optionally provide a proof photo and offer a reward.
              </Fragment>,
              <Fragment key="chat">
                <strong>Chat messages.</strong> If you message another user, we collect the text of your
                messages and related conversation details so the conversation can be shown to both of you.
              </Fragment>,
              <Fragment key="saved">
                <strong>Saved searches and preferences.</strong> If you save a search to be alerted about new
                matching reports, we store the search terms and filters you saved, along with preferences
                such as whether you want email notifications.
              </Fragment>,
              <Fragment key="support">
                <strong>Feedback and reports.</strong> If you contact us or report another user, listing, or
                message for abuse, we collect what you send us so we can respond and keep the community safe.
              </Fragment>,
            ]}
          />

          <p className="mt-6 font-semibold">Information we collect automatically</p>
          <List
            items={[
              <Fragment key="usage">
                <strong>Activity needed to run the service.</strong> For example, whether notifications and
                messages have been read, so badges and unread counts stay accurate.
              </Fragment>,
              <Fragment key="push">
                <strong>Push notification tokens.</strong> If you allow notifications, we store a push token
                for your device so we can deliver notifications about matches, claims, and messages.
              </Fragment>,
              <Fragment key="technical">
                <strong>Technical and security data.</strong> We process limited technical data, such as your
                IP address, to protect the service against abuse and to rate-limit requests. This data is
                stored only briefly (records expire within 24 hours) and is not used to build profiles or
                identify you as an individual.
              </Fragment>,
            ]}
          />

          <p className="mt-6 font-semibold">Device permissions you control</p>
          <List
            items={[
              <Fragment key="camera">
                <strong>Camera and photo library.</strong> Used only when you choose to take or pick photos
                for a report, your profile, or a claim.
              </Fragment>,
              <Fragment key="location">
                <strong>Location.</strong> Reunio asks for your device&rsquo;s location only when you create
                or edit a report, so it can pre-fill where the item was lost or found. You can deny this
                permission and type the location yourself instead.
              </Fragment>,
              <Fragment key="notifications">
                <strong>Notifications.</strong> Used to show alerts for matches, claim updates, and messages.
              </Fragment>,
            ]}
          />
          <Paragraph>
            You can change or revoke any of these permissions at any time through your device&rsquo;s
            settings. Reunio keeps working (with some limits) even if you decline them.
          </Paragraph>
        </Section>
        <Section id="why-we-collect" heading="Why we collect this information and how we use it">
          <Paragraph>We use the information we collect to:</Paragraph>
          <List
            items={[
              <Fragment key="run">
                Run Reunio and its core features: create and manage your account, publish and display lost and
                found reports, and let you search, save searches, and browse reports.
              </Fragment>,
              <Fragment key="match">
                Match lost and found items to one another and notify you about possible matches, including by
                email when you have email notifications enabled.
              </Fragment>,
              <Fragment key="connect">
                Connect you with other users so items can be returned: 1:1 chat between people who found an
                item and people who lost it.
              </Fragment>,
              <Fragment key="claims">
                Process and verify claims so lost items are returned to the right person, and detect and
                prevent fraudulent claims.
              </Fragment>,
              <Fragment key="notify">
                Send you notifications about messages, claims, and matches (push and in-app; email only if you
                enable it).
              </Fragment>,
              <Fragment key="support">
                Respond to your questions and requests, and support you when something goes wrong.
              </Fragment>,
              <Fragment key="safe">
                Keep Reunio safe: detect and remove spam, abusive content, and suspicious or fraudulent
                activity, and enforce our rules (including account suspension for abuse).
              </Fragment>,
              <Fragment key="legal">
                Comply with legal obligations and protect our rights and the rights of our users.
              </Fragment>,
            ]}
          />
          <Paragraph>
            <strong>Optional AI-assisted descriptions.</strong> When you use the optional &ldquo;scan&rdquo;
            feature on a report, the photo you selected is sent to our AI provider (OpenAI) to draft a title,
            category, and description for you. You can review and edit the draft before posting, and only the
            version you actually post is saved with your report.
          </Paragraph>
        </Section>
        <Section id="how-we-share" heading="How your information is shared">
          <p className="font-semibold">What other Reunio users can see</p>
          <List
            items={[
              <Fragment key="public">
                <strong>Lost and found reports are public to Reunio users.</strong> When you post a report, its
                description, photos, and location details are shown to other people using Reunio, together with
                your name and profile photo, so they can help or reach you about the item.
              </Fragment>,
              <Fragment key="chat-visible">
                <strong>Conversations.</strong> Messages you send in a chat are visible to the other person in
                that conversation (and to us, to operate the service and address abuse).
              </Fragment>,
              <Fragment key="claims-visible">
                <strong>Claims.</strong> When you claim an item, the message and any proof photo you submit are
                shown to the item&rsquo;s owner so they can verify whether the item is yours. They are not
                posted publicly.
              </Fragment>,
              <Fragment key="blocks">
                <strong>Blocks.</strong> If you block another user, we record the block so we can honor it.
              </Fragment>,
            ]}
          />
          <p className="mt-6 font-semibold">Sharing with companies that help us run Reunio</p>
          <Paragraph>
            We share information only with the providers we need to operate Reunio. They receive only the
            information required to do their job, may use it only to provide their service to us, and are
            expected to protect it. See the next section for who they are.
          </Paragraph>
          <p className="mt-6 font-semibold">Other sharing</p>
          <List
            items={[
              <Fragment key="law">
                <strong>Legal and safety.</strong> We may disclose information when we believe in good faith
                that the law requires it, such as in response to a court order or legal process, or when needed
                to protect the safety, rights, or property of Reunio, its users, or the public.
              </Fragment>,
              <Fragment key="business">
                <strong>Business transfers.</strong> If Reunio is involved in a merger, acquisition, or sale of
                assets, your information may be transferred as part of that transaction, and this policy will
                continue to apply to it.
              </Fragment>,
            ]}
          />
          <Paragraph>
            <strong>We do not sell your personal information, and we do not show ads.</strong> We do not share
            your information with advertisers or data brokers.
          </Paragraph>
        </Section>

        <Section id="third-parties" heading="Third-party services">
          <Paragraph>
            To operate Reunio we rely on the following categories of service providers. When you use a related
            feature, your information may be processed by them:
          </Paragraph>
          <List
            items={[
              <Fragment key="cloudinary">
                <strong>Cloudinary</strong> — stores and delivers the photos you upload (profile photos, report
                photos, and claim proof photos).
              </Fragment>,
              <Fragment key="openai">
                <strong>OpenAI</strong> — powers the optional AI-assisted &ldquo;scan&rdquo; that drafts a
                description from a photo when you choose to use it.
              </Fragment>,
              <Fragment key="google-apple">
                <strong>Google and Apple</strong> — provide sign-in when you choose &ldquo;Continue with
                Google&rdquo; or &ldquo;Sign in with Apple,&rdquo; sharing only the profile details you
                authorize. Each provider also operates under its own privacy policy and your choices there.
              </Fragment>,
              <Fragment key="expo">
                <strong>Expo</strong> — delivers push notifications to your device through the Expo push
                notification service (delivery uses Google&rsquo;s and Apple&rsquo;s platform notification
                services on Android and iOS).
              </Fragment>,
              <Fragment key="email">
                <strong>An email delivery provider</strong> — sends transactional emails such as password reset
                codes and, if you enable email notifications, updates about matches, claims, and messages.
              </Fragment>,
              <Fragment key="database">
                <strong>A cloud database provider</strong> — hosts the database where Reunio stores your
                account, reports, messages, and other data.
              </Fragment>,
              <Fragment key="hosting">
                <strong>Hosting providers</strong> — host the Reunio website and API and the real-time chat
                service that delivers messages instantly.
              </Fragment>,
            ]}
          />
        </Section>
        <Section id="user-content" heading="User-generated content">
          <Paragraph>
            Reports, photos, and messages you post on Reunio are content you choose to share. Lost and found
            reports (including their photos and location details) are visible to other users of Reunio, and
            messages are visible to the people you chat with. Think carefully before posting personal details,
            and never post anything that could help someone falsely claim an item, such as serial numbers or
            documents that prove ownership — that kind of proof belongs in a private claim or a direct
            conversation, not in a public report.
          </Paragraph>
        </Section>

        <Section id="location" heading="Location information">
          <Paragraph>
            Reunio does not track your location in the background. We ask for your device&rsquo;s location
            only when you create or edit a lost or found report, and only to pre-fill where the item was lost
            or found. If you allow it, we attach the location you provide — which can include text you type
            (such as an address, neighborhood, city, or state) and, when the device provides it, map
            coordinates — to that report.
          </Paragraph>
          <Paragraph>
            The location details you include on a report are shown to other Reunio users as part of the report
            so people can tell whether an item was lost or found near them. You can choose to post only a
            general area, and you can always deny the location permission and type a location yourself. We use
            location information to match lost and found items in the same area and to let people search for
            items by city or state.
          </Paragraph>
        </Section>

        <Section id="photos" heading="Photos and images">
          <Paragraph>
            Photos are part of how Reunio works: photos of lost or found items are how people recognize their
            belongings. Photos you upload to a report are stored by our image provider (Cloudinary) and shown
            to other Reunio users as part of the public report. Your profile photo is visible to other users on
            your reports and in conversations. A proof photo you submit with a claim is shown only to the
            item&rsquo;s owner (and to us) to help verify ownership — it is not posted publicly.
          </Paragraph>
        </Section>

        <Section id="chat" heading="Chat and messaging">
          <Paragraph>
            Reunio lets the person who lost an item and the person who found it talk to each other in a private,
            1:1 conversation, for example to arrange how the item will be returned. Message text is stored so
            the conversation can be shown to both participants, and we may review conversations when someone
            reports abuse, spam, or fraud. Conversations linked to a claim may include a system notice (for
            example, that a claim was submitted) so both people have the same context.
          </Paragraph>
        </Section>

        <Section id="claims" heading="Claims and reunification">
          <Paragraph>
            When someone reports an item they believe is theirs, Reunio shows the claim to the person who posted
            the item, including the claimant&rsquo;s name, profile photo, their message, and any proof photo.
            The item&rsquo;s owner decides whether to approve or reject the claim, and can message the claimant
            to ask questions. If a claim is approved, the people involved can use chat to complete the return of
            the item. We use claim information — including proof photos — to reduce fraud, and providing false
            or misleading claim information may lead to your account being suspended.
          </Paragraph>
        </Section>

        <Section id="push-notifications" heading="Push notifications">
          <Paragraph>
            With your permission, Reunio sends push notifications to alert you about things like possible
            matches, new messages, and updates on claims you&rsquo;ve submitted or received. To do this we store
            a push token for your device and send notifications through the Expo push notification service.
            You can turn push notifications off at any time in your device settings. Separate from push, you can
            control email notifications from inside the app (Settings), and email is only sent when you have
            that preference enabled.
          </Paragraph>
        </Section>

        <Section id="auth" heading="Account creation and authentication">
          <Paragraph>
            You can create a Reunio account with your name, email address, phone number, and a password, or you
            can sign in with Google or Apple. Passwords are stored only as one-way bcrypt hashes and are never
            readable by us. For Google and Apple sign-in, we verify the provider&rsquo;s identity token on our
            servers and store the profile details the provider shares with you and an identifier for your
            provider account. We never store your Google or Apple password, and deleting your Reunio account
            does not delete your Google or Apple account.
          </Paragraph>
        </Section>
        <Section id="account-deletion" heading="Account deletion">
          <Paragraph>
            <strong>How to delete (deactivate) your account.</strong> In the Reunio app, go to Settings &rarr;
            Deactivate Account (listed in the &ldquo;Danger Zone&rdquo;). You will be asked to confirm your
            identity before anything happens: accounts with a password require that password, and accounts
            created with Google or Apple require a fresh sign-in with that provider. After you confirm:
          </Paragraph>
          <List
            items={[
              <Fragment key="inactive">
                Your account is deactivated immediately — you can no longer sign in, and your profile stops
                being visible to other users.
              </Fragment>,
              <Fragment key="hidden">
                The lost and found reports you posted are hidden from public search and feeds.
              </Fragment>,
              <Fragment key="push">
                Your device&rsquo;s push tokens are removed, so you stop receiving push notifications.
              </Fragment>,
              <Fragment key="irreversible">
                The action cannot be undone from inside the app.
              </Fragment>,
            ]}
          />
          <Paragraph>
            <strong>What deletion means today.</strong> Deactivation is a soft delete: your account record and
            the content connected to it (such as reports, claims, messages, and notifications) are retained by
            Reunio rather than permanently erased. We retain this data so reports, claims, and conversations you
            were part of don&rsquo;t break, so that other users can still see the history of a completed return,
            and so we can address fraud, disputes, and legal obligations. Reunio does not currently offer an
            in-app feature that permanently erases all of this retained data on your own.
          </Paragraph>
          <Paragraph>
            If you want to request permanent deletion of your personal information, or if you have any questions
            about deletion, email us at{" "}
            <a className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            and we will respond in line with applicable law, telling you what we can delete and what we must
            keep and why.
          </Paragraph>
        </Section>

        <Section id="retention" heading="Data retention">
          <Paragraph>
            We keep your information for as long as your account is active and as long as needed to provide
            Reunio to you, to keep the service safe, and to meet our legal obligations. After you deactivate
            your account, we retain the data described in the Account Deletion section above. Short-lived
            technical data used for security and rate limiting is retained only briefly and expires automatically
            within 24 hours.
          </Paragraph>
        </Section>

        <Section id="security" heading="Data security">
          <Paragraph>
            We work to protect your information with reasonable technical and organizational safeguards,
            including: encryption of traffic to and from Reunio (HTTPS/TLS), password storage using a strong,
            one-way hashing algorithm (bcrypt) so passwords are never stored in readable form, server-side
            verification of Google and Apple sign-in tokens, and restricted access to production data (only
            people who need it to run and moderate the service can reach it, and the admin tools are
            separately protected). No method of transmission or storage is 100% secure, so we cannot guarantee
            absolute security — but we take reasonable steps to protect what you share with us.
          </Paragraph>
        </Section>
        <Section id="children" heading={"Children’s privacy"}>
          <Paragraph>
            Reunio is not directed to children under 13, and we do not knowingly collect personal information
            from children under 13. If you believe a child under 13 has provided us personal information,
            please contact us at{" "}
            <a className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            and we will take steps to delete the information where we are able to.
          </Paragraph>
        </Section>

        <Section id="your-rights" heading="Your rights and choices">
          <List
            items={[
              <Fragment key="profile">
                <strong>Edit your profile.</strong> You can update your name, phone number, and profile photo at
                any time from Settings &rarr; Edit Profile.
              </Fragment>,
              <Fragment key="notif">
                <strong>Notification preferences.</strong> You can turn email notifications on or off in
                Settings, and control push notifications through your device&rsquo;s settings.
              </Fragment>,
              <Fragment key="content">
                <strong>Manage your content.</strong> You can edit or remove your own reports and delete your
                notifications, conversations, and messages through the app wherever those controls appear.
              </Fragment>,
              <Fragment key="block">
                <strong>Blocking.</strong> You can block other users so they can&rsquo;t message you, and
                blocked users are hidden from your search results.
              </Fragment>,
              <Fragment key="delete">
                <strong>Deletion.</strong> You can deactivate your account as described in the Account Deletion
                section, and you can ask us about permanent deletion by email.
              </Fragment>,
              <Fragment key="law">
                <strong>Legal rights.</strong> Depending on where you live, you may have additional rights under
                local law — for example to request access to, correction of, or deletion of your personal
                information, or to object to or restrict certain processing. To exercise any of these rights,
                email us at{" "}
                <a className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                , and we will respond as required by applicable law.
              </Fragment>,
            ]}
          />
        </Section>

        <Section id="changes" heading="Changes to this Privacy Policy">
          <Paragraph>
            We may update this Privacy Policy from time to time to reflect changes in Reunio, the law, or how
            we handle information. When we do, we will update the &ldquo;Effective date&rdquo; at the top of
            this page. If a change is significant, we will also make reasonable efforts to let you know through
            the app or by email. We encourage you to review this page from time to time.
          </Paragraph>
        </Section>

        <Section id="contact" heading="Contact us">
          <Paragraph>
            If you have questions or concerns about this Privacy Policy or about how Reunio handles your
            information, or if you would like to request access to, correction of, or deletion of your personal
            information, please email us at{" "}
            <a className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </Paragraph>
        </Section>

        <footer className="mt-14 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <p>Reunio (formerly Foundly) &middot; Privacy Policy &middot; Effective {EFFECTIVE_DATE}</p>
        </footer>
      </div>
    </main>
  );
}
