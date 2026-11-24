import type { Metadata } from "next";
import Link from "next/link";
import { ErrorState } from "@/components/ui/States";
import { safe } from "@/lib/safe";
import { getSettings } from "@/services/public";

export const metadata: Metadata = {
  title: "About",
  description: "What The 5,000 People Project is, why it exists and how to follow along.",
};

export default async function AboutPage() {
  const settings = await safe(getSettings());
  if (!settings) return <div className="container-x"><ErrorState /></div>;

  return (
    <div className="container-x py-14 sm:py-24">
      <p className="eyebrow">About the project</p>
      <h1 className="display mt-3 max-w-4xl text-5xl leading-[1.02] sm:text-7xl">{settings.tagline}</h1>

      <div className="mt-14 grid gap-12 lg:grid-cols-12">
        <div className="space-y-6 text-lg leading-relaxed text-ink/80 lg:col-span-7">
          {settings.aboutText.split(/\n{2,}/).map((para, i) => (
            <p key={i} className={i === 0 ? "display text-2xl leading-snug text-ink sm:text-3xl" : ""}>
              {para}
            </p>
          ))}
        </div>

        <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
          <div>
            <h2 className="eyebrow">Consent and privacy</h2>
            <p className="mt-3 leading-relaxed text-ink/80">
              Only people who have agreed to be shared appear on this site, and only the details they approved. If
              you want your profile removed, ask and it comes down.{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-ember">Read the privacy policy</Link>.
            </p>
          </div>
          <div>
            <h2 className="eyebrow">Follow along</h2>
            <p className="mt-3 leading-relaxed text-ink/80">
              New introductions are added as they happen. Browse{" "}
              <Link href="/people" className="underline underline-offset-4 hover:text-ember">the people</Link>, or follow
              the journey on social.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {(["tiktok", "instagram", "youtube"] as const)
                .filter((k) => settings.socialLinks[k])
                .map((k) => (
                  <li key={k}>
                    <a
                      href={settings.socialLinks[k]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium capitalize underline underline-offset-4 hover:text-ember"
                    >
                      {k === "tiktok" ? "TikTok" : k === "youtube" ? "YouTube" : "Instagram"} ↗
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
