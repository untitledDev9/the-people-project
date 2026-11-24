/** Digits only, e.g. "+234 909 132 4697" -> "2349091324697". */
const digits = (v: string) => v.replace(/\D/g, "");

export const whatsappLink = (v: string) => `https://wa.me/${digits(v)}`;
export const telLink = (v: string) => `tel:+${digits(v)}`;
