import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms of Service — PEUU Jewels" },
      {
        name: "description",
        content:
          "The terms that govern your use of the PEUU Jewels website and the purchase of our collections.",
      },
      { property: "og:title", content: "Terms of Service — PEUU Jewels" },
      {
        property: "og:description",
        content: "The legally binding agreement for shopping with PEUU Jewels.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms of Service"
      effectiveDate="Effective Date: July 2026 · Website: www.peuujewels.in"
    >
      <p>
        Welcome to <strong>PEUU JEWELS</strong>. These Terms of Service ("Terms") constitute a
        legally binding agreement governing your access to our website and the purchase of our
        jewelry collections. By browsing our site or placing an order, you unequivocally
        accept these Terms.
      </p>

      <h2>1. Eligibility to Shop</h2>
      <p>By accessing www.peuujewels.in, you represent and warrant that:</p>
      <ul>
        <li>You are at least 18 years of age, or you are browsing under the direct supervision of a legal guardian.</li>
        <li>All information you provide during checkout or account creation is truthful, accurate, and current.</li>
      </ul>

      <h2>2. Product Disclaimers & Descriptions</h2>
      <p>We proudly curate and craft:</p>
      <ul>
        <li>Demifine Jewellery</li>
        <li>Fashion Jewellery</li>
        <li>Sterling Silver Jewellery</li>
        <li>Gold-Plated Jewellery</li>
      </ul>
      <p>
        <strong>Note on Appearance:</strong> We strive for photographic accuracy; however,
        product images are for illustrative purposes. Slight variations in color, finish,
        texture, or physical appearance may occur due to lighting, studio photography, or your
        individual screen calibration.
      </p>

      <h2>3. Pricing Policy</h2>
      <ul>
        <li>All prices are displayed in Indian Rupees (INR) unless otherwise explicitly stated.</li>
        <li>
          PEUU JEWELS reserves the right to modify pricing, correct typographical pricing
          errors, or cancel orders arising from such errors at our sole discretion, without
          prior notice.
        </li>
      </ul>

      <h2>4. Payments</h2>
      <p>We offer a variety of secure payment methods for your convenience:</p>
      <ul>
        <li>UPI</li>
        <li>Credit & Debit Cards</li>
        <li>Net Banking</li>
        <li>Cash on Delivery (COD) [Subject to availability based on pin code]</li>
        <li>International Cards</li>
      </ul>
      <p>Orders (excluding COD) are dispatched strictly post-payment verification.</p>

      <h2>5. Shipping & Delivery</h2>
      <p>
        Orders are processed and dispatched in accordance with our dedicated Shipping Policy.
        Please note that delivery timelines are estimates. We are not liable for delays caused
        by courier logistics, severe weather, public holidays, or unforeseen force majeure
        events.
      </p>

      <h2>6. Order Cancellations</h2>
      <ul>
        <li><strong>Pre-Dispatch:</strong> You may request an order cancellation before the item has been shipped from our facility.</li>
        <li><strong>Post-Dispatch:</strong> Once an order is handed over to our logistics partner, it cannot be cancelled.</li>
        <li><strong>Our Rights:</strong> We reserve the right to cancel any order flagged for suspected fraud, unauthorized payment, pricing errors, or lack of inventory.</li>
      </ul>

      <h2>7. Exchange Policy (Strictly Monitored)</h2>
      <p>
        PEUU JEWELS operates on a strict <strong>"No Returns"</strong> policy. However, we do
        accommodate exchanges under specific, verified conditions:
      </p>
      <ul>
        <li><strong>Timeframe:</strong> Exchange requests must be initiated within 2 days of successful delivery.</li>
        <li>
          <strong>Condition:</strong> The jewelry must be entirely unused, unworn, and in its
          pristine original condition. All original tags, packaging, and invoices must be
          wholly intact.
        </li>
        <li>
          <strong>MANDATORY UNBOXING VIDEO:</strong> To protect both our customers and our
          business, an uninterrupted unboxing video is strictly mandatory for any claims
          regarding damaged, defective, incorrect, or missing items. Claims without valid
          video proof will be categorically denied.
        </li>
      </ul>
      <p>
        Customized, engraved, or personalized pieces are final sale and entirely ineligible
        for exchange.
      </p>

      <h2>8. Refund Policy</h2>
      <p>
        Because we do not accept returns, refunds are exclusively processed only under the
        following extreme circumstances:
      </p>
      <ul>
        <li>An approved exchange cannot be fulfilled due to total stock unavailability.</li>
        <li>A rare, exceptional case formally approved by PEUU JEWELS management.</li>
      </ul>
      <p><strong>Refund Timelines (If Approved):</strong></p>
      <ul>
        <li><strong>Prepaid Orders:</strong> Refunded to the original source of payment.</li>
        <li><strong>COD Orders:</strong> Refunded via secure UPI or Bank Transfer link.</li>
      </ul>
      <p>Please allow 7–10 business days for the funds to reflect in your account post-verification.</p>

      <h2>9. International Orders</h2>
      <p>
        We love our global customers. However, international shipments are subject to the
        specific customs regulations of the destination country. The customer bears absolute
        responsibility for all import duties, local taxes, customs charges, and any related
        return shipping costs.
      </p>

      <h2>10. Product Warranty</h2>
      <p>
        Unless a specific warranty is explicitly outlined on a designated product page, PEUU
        JEWELS provides its items on an "as-is" basis without warranties.
      </p>
      <p>
        We are not responsible for natural tarnishing, normal wear and tear, improper
        handling, exposure to perfumes/chemicals/water, or accidental breakage.
      </p>

      <h2>11. Intellectual Property Rights</h2>
      <p>
        All digital assets on www.peuujewels.in—including typography, copywriting, imagery,
        graphics, logos, product designs, and trademarks—are the exclusive intellectual
        property of PEUU JEWELS. Unauthorized scraping, copying, reproduction, or commercial
        distribution of our content is a direct violation of intellectual property laws and
        will be prosecuted.
      </p>

      <h2>12. Limitation of Liability</h2>
      <p>
        To the maximum extent permissible by Indian Law, PEUU JEWELS shall not be held liable
        for any indirect, incidental, special, or consequential damages resulting from the use
        of our website or products. In any event, our maximum total liability to you shall
        never exceed the exact monetary amount you paid for the disputed order.
      </p>

      <h2>13. Governing Law & Jurisdiction</h2>
      <p>
        These Terms of Service are meticulously governed by and construed in accordance with
        the laws of India. Any disputes, claims, or legal proceedings arising from these Terms
        or your use of our website shall be subject to the exclusive jurisdiction of the
        competent civil courts located in Maharashtra, India.
      </p>

      <h2>Contact Information</h2>
      <p>For any legal inquiries, support requests, or privacy concerns, please reach out to us at:</p>
      <p>
        <strong>PEUU JEWELS</strong>
      </p>
      <ul>
        <li><strong>Headquarters:</strong> H NO 17, Amravati, Akoli Badnera Road, Maharashtra – 444607, India</li>
        <li><strong>Email Support:</strong> <a href="mailto:peuujewels@gmail.com">peuujewels@gmail.com</a></li>
        <li><strong>Customer Care:</strong> +91 7058588767</li>
        <li><strong>GSTIN:</strong> 27FUTPB4034F1ZL</li>
      </ul>
    </LegalLayout>
  );
}
