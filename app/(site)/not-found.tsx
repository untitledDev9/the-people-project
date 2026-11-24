import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-32 text-center">
      <p className="display text-[8rem] leading-none text-beige">404</p>
      <h1 className="display mt-4 text-4xl">No one by that number. Yet.</h1>
      <p className="mt-4 text-stone">This page doesn&apos;t exist, or the profile isn&apos;t public.</p>
      <Link href="/people" className="btn-solid mt-8">Explore the people</Link>
    </div>
  );
}
