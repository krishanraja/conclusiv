import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Conclusiv
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 5, 2025</p>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p>
              Mindmaker LLC ("we," "us," or "our") operates Conclusiv. This Privacy Policy explains how we 
              collect, use, disclose, and safeguard your information when you use our Service. By using Conclusiv, 
              you consent to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Information:</strong> Email address and display name when you create an account</li>
              <li><strong>Content:</strong> Text, documents, and other materials you upload for narrative generation</li>
              <li><strong>Payment Information:</strong> Billing details processed securely through Stripe (we do not store your full card number)</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Usage Data:</strong> How you interact with the Service, features used, and session duration</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
              <li><strong>Log Data:</strong> IP address, access times, and referring URLs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative notifications and updates</li>
              <li>Respond to inquiries and provide customer support</li>
              <li>Monitor usage patterns and analyze trends</li>
              <li>Detect, prevent, and address security issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. AI Processing</h2>
            <p>
              Content you submit is processed by AI systems to generate narratives. We may use anonymized 
              and aggregated data to improve our AI models. We do not use your content to train AI models 
              without your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Sharing</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Service Providers:</strong> Third parties that help us operate the Service (e.g., Stripe for payments, Supabase for data storage)</li>
              <li><strong>AI Providers:</strong> AI service providers that process your content (subject to data processing agreements)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or sale of assets</li>
            </ul>
            <p className="mt-2">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information, including 
              encryption in transit and at rest, secure authentication, and regular security audits. 
              However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide 
              the Service. You may request deletion of your account and associated data at any time. 
              Certain information may be retained as required by law or for legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Delete your personal information</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of certain data processing activities</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at privacy@mindmaker.llc.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Cookies and Tracking</h2>
            <p>
              We use essential cookies to maintain your session and preferences. We may use analytics 
              tools to understand how the Service is used. You can control cookie settings through your 
              browser preferences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place for such transfers in compliance with 
              applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Children's Privacy</h2>
            <p>
              The Service is not intended for users under 16 years of age. We do not knowingly collect 
              information from children. If you believe we have collected information from a child, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">12. California Privacy Rights (CCPA)</h2>
            <p>
              California residents have additional rights including the right to know what personal 
              information is collected, request deletion, and opt out of the sale of personal information. 
              We do not sell personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">13. European Privacy Rights (GDPR)</h2>
            <p>
              EU/EEA residents have rights under GDPR including access, rectification, erasure, restriction, 
              portability, and objection. Our legal basis for processing is typically contract performance, 
              legitimate interests, or consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">14. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of material changes 
              by email or through the Service. Your continued use after changes constitutes acceptance 
              of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">15. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, contact us at:
            </p>
            <p className="mt-2">
              <strong>Mindmaker LLC</strong><br />
              Email: privacy@mindmaker.llc
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
