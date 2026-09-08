import type { DocumentType, UserDocument } from "@/types/domain";

export type IdentityDocumentType = Extract<DocumentType, "id" | "passport">;

export function isLebaneseResident(country: string | undefined | null): boolean {
  return country === "LB";
}

/** Types accepted as identity proof for a given country.
 *  Lebanese residents may upload either; everyone else must provide a passport. */
export function acceptedIdentityTypes(country: string | undefined | null): IdentityDocumentType[] {
  return isLebaneseResident(country) ? ["id", "passport"] : ["passport"];
}

/** First matching vault document for the accepted identity types, in preference order. */
export function findIdentityDocument(
  docs: UserDocument[],
  country: string | undefined | null,
): UserDocument | undefined {
  const accepted = acceptedIdentityTypes(country);
  for (const type of accepted) {
    const match = docs.find((d) => d.type === type);
    if (match) return match;
  }
  return undefined;
}
