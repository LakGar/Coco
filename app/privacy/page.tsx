import Footer from '@/components/landing/footer'
import Nav from '@/components/landing/nav'
import LegalPageLayout from '@/components/legal/legal-page-layout'

export const metadata = {
  title: 'Privacy Policy | Coco',
  description: 'How Coco collects, uses, and protects your information.',
}

const PrivacyPage = () => {
  return (
    <div className="w-screen flex flex-col justify-center items-center z-10 relative bg-primary-foreground overflow-x-hidden">
      <Nav />
      <main className="w-full">
        <LegalPageLayout
          title="Privacy Policy"
          description="Last updated: March 2025. We take your privacy seriously and are committed to protecting the information you share with us."
        >
          <p>
            Coco (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides
            support and resources for caregivers and families. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your
            information when you use our website, app, or services. Please read
            it carefully.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We may collect information that you provide directly (such as name,
            email, phone number, and account details), information collected
            automatically when you use our services (such as device type, IP
            address, and usage data), and information from third parties where
            you have given permission (e.g., calendar or contact access to
            support care coordination).
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use your information to provide, maintain, and improve our
            services; to communicate with you; to personalize your experience;
            to send updates and support materials; to comply with legal
            obligations; and to protect the security of our users and services.
          </p>

          <h2>3. Sharing Your Information</h2>
          <p>
            We do not sell your personal information. We may share information
            with service providers who assist our operations (under strict
            confidentiality), with your consent, or when required by law. We do
            not share health or care-related data with advertisers.
          </p>

          <h2>4. Data Security</h2>
          <p>
            We use industry-standard measures to protect your data, including
            encryption and access controls. Despite our efforts, no method of
            transmission or storage is 100% secure, and we cannot guarantee
            absolute security.
          </p>

          <h2>5. Your Rights and Choices</h2>
          <p>
            Depending on your location, you may have the right to access,
            correct, delete, or port your data, and to object to or restrict
            certain processing. You can update your preferences or request
            changes by contacting us at{' '}
            <a href="mailto:staff@joincoco.app">staff@joincoco.app</a>.
          </p>

          <h2>6. Children and Sensitive Data</h2>
          <p>
            Our services are not directed to children under 13. When you use
            Coco in a caregiving context, you may provide information about
            dependents or family members. We treat such information with the
            same care as your own and use it only as necessary to provide the
            services you request.
          </p>

          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post
            the revised policy on this page and update the &quot;Last
            updated&quot; date. Continued use of our services after changes
            constitutes acceptance of the updated policy.
          </p>

          <h2>8. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or our practices, contact us
            at <a href="mailto:staff@joincoco.app">staff@joincoco.app</a> or by
            phone at <a href="tel:+14084558736">+1 (408) 455-8736</a>.
          </p>
        </LegalPageLayout>
      </main>
      <Footer />
    </div>
  )
}

export default PrivacyPage
