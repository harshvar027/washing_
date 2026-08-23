import { indianMobileFromAny } from "./format";

type GooglePerson = {
  names?: Array<{ displayName?: string }>;
  phoneNumbers?: Array<{ value?: string; type?: string }>;
};

export async function googleProfileExtras(accessToken: string) {
  try {
    const response = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=names,phoneNumbers",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      return { phone: "" };
    }
    const data = (await response.json()) as GooglePerson;
    const ranked = [...(data.phoneNumbers ?? [])].sort((a, b) => {
      const score = (item: { type?: string }) =>
        item.type?.toLowerCase() === "mobile" ? 0 : 1;
      return score(a) - score(b);
    });
    const phone =
      ranked
        .map((item) => indianMobileFromAny(item.value ?? ""))
        .find(Boolean) ?? "";
    return { phone };
  } catch {
    return { phone: "" };
  }
}
