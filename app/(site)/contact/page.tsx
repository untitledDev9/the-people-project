import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { ErrorState } from "@/components/ui/States";
import { safe } from "@/lib/safe";
import { getSettings } from "@/services/public";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch about The 5,000 People Project: collaborations, press, or a profile removal request.",
};

export default async function ContactPage() {
  const settings = await safe(getSettings());
  if (!settings) return <div className="container-x"><ErrorState /></div>;

  const email = settings.contactEmail;
  const socials = (["tiktok", "instagram", "youtube"] as const).filter((k) => settings.socialLinks[k]);

  return (
    <div className="container-x py-14 sm:py-24">
      <p className="eyebrow">Contact</p>
      <h1 className="display mt-3 text-5xl sm:text-7xl">Say hello.</h1>
      <p className="mt-6 max-w-xl text-lg text-ink/75">
        For collaborations, brand enquiries and press, or to ask for your profile to be changed or removed.
      </p>

      <div className="mt-14 max-w-xl space-y-10">
        {email ? (
          <a href={`mailto:${email}`} className="group block border-y border-ink/15 py-8">
            <span className="eyebrow flex items-center gap-2"><Mail className="size-3.5" /> Email</span>
            <span className="display mt-3 block break-all text-3xl group-hover:underline sm:text-4xl">{email}</span>
          </a>
        ) : (
          <p className="border-y border-ink/15 py-8 text-stone">
            A contact email has not been set up yet. In the meantime, reach out through social media below.
          </p>
        )}

        <div>
          <p className="eyebrow">Find me online</p>
          {socials.length ? (
            <ul className="mt-4 flex flex-wrap gap-3">
              {socials.map((k) => (
                <li key={k}>
                  <a href={settings.socialLinks[k]} target="_blank" rel="noopener noreferrer" className="btn-outline">
                    {k === "tiktok" ? "TikTok" : k === "youtube" ? "YouTube" : "Instagram"} ↗
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-stone">Social links will be added soon.</p>
          )}
        </div>
      </div>
    </div>
  );
}
