import { PlansContent } from '@/Components/plans/PlansContent';

export const metadata = {
  title: 'Planos — Olimpo',
};

interface PlansPageProps {
  searchParams: Promise<{ system?: string; t?: string }>;
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const { system, t } = await searchParams;
  const resolvedSystem = system ?? process.env.NEXT_PUBLIC_SYSTEM ?? '';

  return <PlansContent system={resolvedSystem} token={t ?? ''} />;
}
