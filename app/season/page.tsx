import { redirect } from "next/navigation";
import { getIndex } from "@/lib/data";

export default async function SeasonIndex() {
  const index = await getIndex();
  redirect(`/season/${index.seasons[0]}`);
}
