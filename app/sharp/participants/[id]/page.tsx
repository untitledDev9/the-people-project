"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ParticipantForm } from "@/components/admin/ParticipantForm";
import { Skeleton } from "@/components/ui/States";
import { getErrorMessage } from "@/lib/api";
import * as admin from "@/services/admin";
import type { AdminParticipant } from "@/types";

export default function EditParticipantPage() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<AdminParticipant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    admin.getParticipant(id).then(setPerson).catch((e) => setError(getErrorMessage(e, "Could not load participant.")));
  }, [id]);

  if (error) return <p role="alert" className="rounded-lg bg-red-100 p-4 text-red-800">{error}</p>;
  if (!person) return <div aria-busy="true"><Skeleton className="h-10 w-72" /><Skeleton className="mt-8 h-96 max-w-3xl" /></div>;
  return <ParticipantForm initial={person} />;
}
