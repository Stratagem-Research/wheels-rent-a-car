import { LegalArticle } from "@/components/help/LegalArticle";

export const metadata = {
  title: "Terms & Conditions · Wheels Rent A Car",
  description: "The terms that govern every rental booked through Wheels Rent A Car.",
};

export default function TermsPage() {
  return <LegalArticle slug="terms" />;
}
