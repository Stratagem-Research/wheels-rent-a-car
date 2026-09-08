import { describe, expect, it } from "vitest";
import {
  acceptedIdentityTypes,
  findIdentityDocument,
  isLebaneseResident,
} from "./identity-document";
import type { UserDocument } from "@/types/domain";

function doc(type: UserDocument["type"]): UserDocument {
  return {
    id: type,
    userId: "u1",
    type,
    number: "",
    issueDate: "",
    expiryDate: "",
    issuingCountry: "LB",
    status: "pending",
    uploadedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("identity document by country", () => {
  it("Lebanese residents may upload ID or passport", () => {
    expect(acceptedIdentityTypes("LB")).toEqual(["id", "passport"]);
    expect(isLebaneseResident("LB")).toBe(true);
  });

  it("international customers must upload a passport", () => {
    expect(acceptedIdentityTypes("US")).toEqual(["passport"]);
    expect(acceptedIdentityTypes("FR")).toEqual(["passport"]);
    expect(acceptedIdentityTypes("OTHER")).toEqual(["passport"]);
    expect(isLebaneseResident("GB")).toBe(false);
  });

  it("picks ID first for Lebanese when both are in the vault", () => {
    const docs = [doc("licence"), doc("id"), doc("passport")];
    expect(findIdentityDocument(docs, "LB")?.type).toBe("id");
  });

  it("falls back to passport for Lebanese when only passport is in the vault", () => {
    const docs = [doc("licence"), doc("passport")];
    expect(findIdentityDocument(docs, "LB")?.type).toBe("passport");
  });

  it("picks passport for international", () => {
    const docs = [doc("licence"), doc("id"), doc("passport")];
    expect(findIdentityDocument(docs, "US")?.type).toBe("passport");
  });
});
