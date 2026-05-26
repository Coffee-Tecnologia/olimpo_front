import { AdminAccountDetail } from '@/Components/admin/AdminAccountDetail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminAccountDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminAccountDetail accountId={id} />;
}
