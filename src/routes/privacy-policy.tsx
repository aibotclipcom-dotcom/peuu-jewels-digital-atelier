import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — PEUU Jewels" },
      {
        name: "description",
        content:
          "How PEUU Jewels collects, uses, discloses, and safeguards your personal information.",
      },
      { property: "og:title", content: "Privacy Policy — PEUU Jewels" },
      {
        property: "og:description",
        content: "Our commitment to your data privacy and security.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      effectiveDate="Effective Date: July 2026 · Website: www.peuujewels.in"
    >
      <p>
        Welcome to <strong>PEUU JEWELS</strong> ("we", "our", or "us"). We highly value your
        trust and privacy. This Privacy Policy details how we collect, use, disclose, and
        safeguard your personal information when you visit our website, purchase our bespoke
        jewelry, or interact with our digital services.
      </p>
      <p>
        By accessing or using our website, you expressly consent to the data practices
        described in this Privacy Policy.
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        To provide you with a seamless shopping experience, we collect the following types of
        information:
      </p>
      <h3>A. Information You Provide Directly</h3>
      <ul>
        <li><strong>Identity Data:</strong> Full Name.</li>
        <li><strong>Contact Data:</strong> Email Address, Mobile Number.</li>
        <li><strong>Fulfillment Data:</strong> Shipping Address, Billing Address.</li>
        <li>
          <strong>Financial Data:</strong> Payment information (Processed securely via trusted
          third-party payment gateways. Note: We never store your debit/credit card numbers,
          CVV, or banking PINs on our servers.)
        </li>
      </ul>
      <h3>B. Order & Transaction Information</h3>
      <ul>
        <li>Details of products purchased (Demifine, Fashion, Sterling Silver, Gold-Plated).</li>
        <li>Complete order history and transaction records.</li>
        <li>Shipping and delivery fulfillment status.</li>
      </ul>
      <h3>C. Automated Device & Usage Data</h3>
      <p>When you navigate our site, we automatically collect:</p>
      <ul>
        <li>IP Address and general location data.</li>
        <li>Browser Type, Operating System, and Device Information.</li>
        <li>Website usage metrics (pages visited, time spent, interaction data).</li>
      </ul>

      <h2>2. How We Utilize Your Data</h2>
      <p>
        We leverage your information exclusively to enhance your experience and operate our
        business efficiently. Your data allows us to:
      </p>
      <ul>
        <li><strong>Fulfill Orders:</strong> Process transactions, arrange shipping, and deliver your jewelry.</li>
        <li><strong>Customer Support:</strong> Address inquiries, process exchanges, and provide order updates.</li>
        <li><strong>Service Improvement:</strong> Analyze traffic and user behavior to optimize our website UI/UX.</li>
        <li><strong>Security:</strong> Actively monitor against fraud, unauthorized access, and malicious activities.</li>
        <li><strong>Compliance:</strong> Meet strict legal, accounting, and tax obligations.</li>
        <li>
          <strong>Marketing (Optional):</strong> Send personalized promotional offers, newsletter
          updates, and exclusive access alerts (you maintain the right to opt-out at any time).
        </li>
      </ul>

      <h2>3. Data Sharing & Disclosure</h2>
      <p>
        We <strong>absolutely do not sell your personal data</strong>. We only share your
        information with trusted partners necessary to run our business:
      </p>
      <ul>
        <li><strong>Payment Gateways:</strong> To securely process your transactions.</li>
        <li><strong>Logistics Partners:</strong> Courier services required to deliver your packages.</li>
        <li><strong>Technology Providers:</strong> Cloud hosting and IT service providers who maintain our website operations.</li>
        <li><strong>Legal Authorities:</strong> Only when mandated by law, court order, or government request.</li>
      </ul>
      <p>
        (All third-party partners are bound by strict confidentiality agreements to protect
        your data).
      </p>

      <h2>4. Marketing Communications</h2>
      <p>If you subscribe to our VIP community or newsletter, you may receive:</p>
      <ul>
        <li>Email & SMS Notifications</li>
        <li>New Collection Drops & Product Updates</li>
        <li>Exclusive Discounts and Offers</li>
      </ul>
      <p>
        <strong>Your Choice:</strong> You can instantly unsubscribe at any time by clicking
        the "Unsubscribe" link at the bottom of our emails or by contacting our support team
        directly.
      </p>

      <h2>5. Data Security</h2>
      <p>
        We implement robust administrative, technical, and physical security protocols to
        shield your personal data from unauthorized access, alteration, or destruction. While
        we strive for 100% security, please note that no digital transmission or electronic
        storage method can be entirely infallible.
      </p>

      <h2>6. Cookies & Tracking Technologies</h2>
      <p>Our website utilizes cookies to elevate your shopping experience. Cookies help us:</p>
      <ul>
        <li>Keep items in your shopping cart.</li>
        <li>Remember your site preferences and login details.</li>
        <li>Analyze site traffic to curate better content.</li>
      </ul>
      <p>
        You may disable cookies via your browser settings; however, certain website
        functionalities may be limited as a result.
      </p>

      <h2>7. Data Retention</h2>
      <p>We retain your information only for as long as ethically and legally required to:</p>
      <ul>
        <li>Fulfill our service promises to you.</li>
        <li>Maintain accurate business, tax, and financial records.</li>
        <li>Resolve any potential disputes.</li>
      </ul>

      <h2>8. Your Privacy Rights</h2>
      <p>Depending on your jurisdiction, you have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
        <li><strong>Correction:</strong> Ask us to update or fix inaccurate information.</li>
        <li><strong>Deletion:</strong> Request the erasure of your personal data (subject to legal retention requirements).</li>
        <li><strong>Opt-Out:</strong> Withdraw consent for marketing communications.</li>
      </ul>
      <p>
        To exercise these rights, please reach out to us at{" "}
        <a href="mailto:peuujewels@gmail.com">peuujewels@gmail.com</a>.
      </p>

      <h2>9. Third-Party Links</h2>
      <p>
        Our website may contain links to external platforms. We are not responsible for the
        privacy practices, content, or security of these third-party sites. We strongly
        encourage you to review their specific policies.
      </p>

      <h2>10. Children's Privacy</h2>
      <p>
        PEUU JEWELS is designed for an adult audience. You must be at least 18 years old to
        use our site. We do not knowingly collect data from minors.
      </p>

      <h2>11. Policy Updates</h2>
      <p>
        We reserve the right to amend this Privacy Policy to reflect changes in our practices
        or legal requirements. Updated versions will be published on this page, marked with a
        new "Effective Date."
      </p>
    </LegalLayout>
  );
}
