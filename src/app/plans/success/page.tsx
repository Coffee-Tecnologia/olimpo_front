/* eslint-disable camelcase */
import { SuccessContent } from '@/Components/plans/SuccessContent';

export const metadata = {
  title: 'Assinatura confirmada — Olimpo',
};

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id } = await searchParams;
  return <SuccessContent sessionId={session_id ?? null} />;
}
