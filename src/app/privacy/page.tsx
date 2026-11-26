import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="px-4 py-12 lg:px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">
        BarcodeGen does not sell or share your personal data. The email and
        password you provide at registration are stored to authenticate your
        account. Passwords are hashed before storage; we never store or transmit
        them in plain text.
      </p>
      <p className="mb-4">
        All generators produce synthetic test data for development and
        education. No government-issued credential data is collected or stored.
      </p>
      <p className="mb-4">
        To delete your account and all associated data, contact support.
        Signing out only ends your session; it does not delete your account.
      </p>
      <p className="mt-8">
        <Link href="/" className="text-primary hover:underline">
          &larr; Back to home
        </Link>
      </p>
    </div>
  );
}