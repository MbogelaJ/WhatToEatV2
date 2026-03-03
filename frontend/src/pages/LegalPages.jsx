import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6" data-testid="terms-page">
      <Link to="/settings" className="inline-flex items-center gap-2 text-emerald-600 mb-6 hover:text-emerald-700">
        <ArrowLeft size={20} />
        Back to Settings
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">Terms of Use</h1>

      <div className="prose prose-stone prose-sm max-w-none">
        <div className="bg-white rounded-xl p-6 border border-stone-200 space-y-4">
          <section>
            <h2 className="text-lg font-semibold text-stone-800">1. Educational Purpose</h2>
            <p className="text-stone-600">
              WhatToEat is an educational reference application that provides general information 
              about nutrition during pregnancy. The content is compiled from public health sources 
              and is intended for educational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800">2. Not Medical Advice</h2>
            <p className="text-stone-600">
              The information provided in this app does not constitute medical advice, diagnosis, 
              or treatment. Always seek the advice of your physician or other qualified health 
              provider with any questions you may have regarding nutrition or medical conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800">3. Individual Variation</h2>
            <p className="text-stone-600">
              Nutritional needs vary among individuals. The information provided is general in 
              nature and may not be appropriate for your specific circumstances. Consult a 
              healthcare professional for personalized guidance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800">4. Limitation of Liability</h2>
            <p className="text-stone-600">
              We make no warranties about the completeness, reliability, or accuracy of the 
              information provided. Any action you take based on the information in this app 
              is strictly at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800">5. Updates</h2>
            <p className="text-stone-600">
              We may update these terms from time to time. Continued use of the app after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6" data-testid="privacy-page">
      <Link to="/settings" className="inline-flex items-center gap-2 text-emerald-600 mb-6 hover:text-emerald-700">
        <ArrowLeft size={20} />
        Back to Settings
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">Privacy Policy</h1>

      <div className="prose prose-stone prose-sm max-w-none">
        <div className="bg-white rounded-xl p-6 border border-stone-200 space-y-4">
          <section>
            <h2 className="text-lg font-semibold text-stone-800">Data Collection</h2>
            <p className="text-stone-600">
              WhatToEat collects minimal data necessary for app functionality. We do not collect 
              personal health information or require user registration for basic features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800">Push Notifications</h2>
            <p className="text-stone-600">
              If you opt in to push notifications, we store a device token to send you daily 
              nutrition tips. This token is not linked to any personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800">No Health Data</h2>
            <p className="text-stone-600">
              This app does not integrate with Apple HealthKit or any health data services. 
              We do not collect, store, or process any personal health information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800">Third-Party Services</h2>
            <p className="text-stone-600">
              We use Firebase Cloud Messaging for push notifications. Please review Google's 
              privacy policy for information about their data practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-800">Contact</h2>
            <p className="text-stone-600">
              If you have questions about this privacy policy, please contact us through the 
              Support section of the app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6" data-testid="support-page">
      <Link to="/settings" className="inline-flex items-center gap-2 text-emerald-600 mb-6 hover:text-emerald-700">
        <ArrowLeft size={20} />
        Back to Settings
      </Link>

      <h1 className="text-2xl font-bold text-stone-800 mb-6">Support</h1>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-6 border border-stone-200">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">Need Help?</h2>
          <p className="text-stone-600 mb-4">
            We're here to help you get the most out of WhatToEat. If you have questions, 
            feedback, or need assistance, please reach out to us.
          </p>
          <a
            href="mailto:support@whattoeat.app"
            className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Contact Support
          </a>
        </div>

        <div className="bg-stone-50 rounded-xl p-6 border border-stone-200">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">Frequently Asked Questions</h2>
          <div className="space-y-3 text-sm text-stone-600">
            <div>
              <p className="font-medium text-stone-700">Is this app a substitute for medical advice?</p>
              <p>No. This app provides educational information only. Always consult healthcare professionals for medical guidance.</p>
            </div>
            <div>
              <p className="font-medium text-stone-700">Where does the information come from?</p>
              <p>Our content is compiled from public health organizations including WHO, CDC, NHS, and ACOG.</p>
            </div>
            <div>
              <p className="font-medium text-stone-700">How do I turn off notifications?</p>
              <p>You can manage notification preferences in your device's Settings app under Notifications.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
