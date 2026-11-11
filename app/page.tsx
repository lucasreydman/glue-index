import { NightView } from "@/components/NightView";
import { getIndex } from "@/lib/data";

export default async function Home() {
  const index = await getIndex();
  return <NightView date={index.latest} />;
}
