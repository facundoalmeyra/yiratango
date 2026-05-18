import Logo from '@/components/ui/Logo';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link to="/">
            <Logo width={100} height={40} />
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: May 2025</p>

        <div className="space-y-8 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-base mb-2">1. Who we are</h2>
            <p>
              Yira Tango is a platform that helps tango artists and fans connect worldwide. We display artist tour dates and locations on an interactive map.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">2. Information we collect</h2>
            <p>When you create an account or log in with a social provider (Google, Facebook), we collect:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Your name and email address</li>
              <li>Your profile picture (if provided by the social provider)</li>
              <li>Account activity within the platform (follows, visit requests)</li>
            </ul>
            <p className="mt-2">
              We do not collect payment information, location data without explicit consent, or any sensitive personal data.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">3. How we use your information</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>To create and manage your account</li>
              <li>To display your public artist or fan profile</li>
              <li>To send notifications related to your activity on the platform</li>
              <li>To improve the service</li>
            </ul>
            <p className="mt-2">We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">4. Facebook Login</h2>
            <p>
              If you log in with Facebook, we receive your public profile and email address as permitted by Facebook's platform policies. We use this information solely to create and authenticate your Yira Tango account. We do not post to Facebook on your behalf or access your friends list.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">5. Data retention</h2>
            <p>
              Your data is retained as long as your account is active. You can delete your account at any time from your profile settings, which permanently removes your personal data from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">6. Cookies</h2>
            <p>
              We use cookies and local storage solely for authentication and language preferences. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">7. Your rights</h2>
            <p>You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at:</p>
            <p className="mt-2 text-white">
              <a href="mailto:facundo@almeyra.com" className="underline underline-offset-2">facundo@almeyra.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">8. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We will notify users of significant changes via the platform or by email.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
