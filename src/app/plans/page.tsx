import { PlansContent } from '@/Components/plans/PlansContent';

export const metadata = {
  title: 'Planos — Olimpo',
};

interface PlansPageProps {
  searchParams: Promise<{ system?: string }>;
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const { system } = await searchParams;
  const resolvedSystem = system ?? process.env.NEXT_PUBLIC_SYSTEM ?? '';

  return <PlansContent system={resolvedSystem} />;
}
