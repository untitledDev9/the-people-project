import Link from "next/link";
import { Portrait } from "./Portrait";
import { formatDate, pad } from "@/lib/format";
import type { PublicParticipant } from "@/types";

export function PersonCard({ person, index = 0 }: { person: PublicParticipant; index?: number }) {
  const where = person.location || person.eventName;
  return (
    <Link
      href={`/people/${pad(person.number)}`}
      className="group block animate-rise"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <Portrait url={person.portraitUrl} number={person.number} alt={`Portrait of ${person.displayName}`} width={640} />
      <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.28em] text-stone">
        Person #{pad(person.number)}
      </p>
      <h3 className="display mt-1 text-2xl leading-tight group-hover:underline group-hover:underline-offset-4">
        {person.displayName}
      </h3>
      <p className="mt-1 text-sm text-stone">
        {formatDate(person.dateMet, "short")}
        {where ? ` · ${where}` : ""}
      </p>
    </Link>
  );
}
