import type { Metadata } from "next";
import { NightView } from "@/components/NightView";
import { getIndex } from "@/lib/data";
import { longDate } from "@/lib/format";

type Props = { params: Promise<{ date: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const index = await getIndex();
  return index.nights.map((date) => ({ date }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  return { title: `${longDate(date)}, ${date.slice(0, 4)}` };
}

export default async function NightPage({ params }: Props) {
  const { date } = await params;
  return <NightView date={date} />;
}
