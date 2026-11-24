import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="px-4 py-12 lg:px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4">
        By using BarcodeGen you agree that all generated barcodes, AAMVA PDF417
        data, UK Field 5 values and MRZ lines are synthetic format examples for
        development, testing and education only.
      </p>
      <p className="mb-4">
        They are not authentic government-issued credentials, do not confer any
        official status, and must not be used as identification or to
        misrepresent a document as genuine. You are solely responsible for how
        you use the generated output.
      </p>
      <p className="mb-4">
        The service is provided &quot;as is&quot; without warranty. We may suspend
        accounts that abuse the generators or attempt to circumvent rate limits
        and access controls.
      </p>
      <p className="mt-8">
        <Link href="/" className="text-primary hover:underline">
          &larr; Back to home
        </Link>
      </p>
    </div>
  );
}