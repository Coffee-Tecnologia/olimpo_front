import type { Metadata } from 'next';

import { AdminLoginForm } from '@/Components/admin/AdminLoginForm';

export const metadata: Metadata = { title: 'Login Admin — Olimpo' };

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
