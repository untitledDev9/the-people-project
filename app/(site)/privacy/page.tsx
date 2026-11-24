import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How The 5,000 People Project handles the privacy and consent of the people it features.",
};

const sections = [
  {
    h: "Consent first",
    p: "A person is only published on this website after they have agreed to be shared. The admin system will not allow a profile to go public unless consent has been confirmed.",
  },
  {
    h: "What is shown publicly",
    p: "Only what a participant approved: a display name, an approved photo or video, the date and place or event we met, and an optional short introduction or quote. Participant numbers are permanent and public.",
  },
  {
    h: "What is never shown",
    p: "Phone numbers, home addresses, personal social media accounts and any other private contact details are never published on this website.",
  },
  {
    h: "Private records",
    p: "Someone can be recorded internally without being published. Those records are not visible to visitors and are not reachable through the public API.",
  },
  {
    h: "Removal requests",
    p: "You can ask at any time for your profile to be changed, taken offline or deleted. When a valid request is received the public profile is removed, and uploaded photos and videos are deleted from storage when the record is deleted.",
  },
  {
    h: "Visitors",
    p: "This website does not ask visitors to create accounts. Links to TikTok, Instagram and YouTube lead to third-party services with their own privacy policies.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-x py-14 sm:py-24">
      <p className="eyebrow">Privacy policy</p>
      <h1 className="display mt-3 text-5xl sm:text-7xl">Your story, your say.</h1>
      <div className="mt-14 max-w-2xl space-y-10">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="display text-2xl sm:text-3xl">{s.h}</h2>
            <p className="mt-3 text-lg leading-relaxed text-ink/75">{s.p}</p>
          </section>
        ))}
        <p className="border-t border-ink/15 pt-8 text-lg">
          Questions or a removal request?{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-ember">Contact me</Link>.
        </p>
      </div>
    </div>
  );
}
