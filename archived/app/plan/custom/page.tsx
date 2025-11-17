'use client';

import { useRouter } from 'next/navigation';
import { CustomPlanBuilder } from '@/components/CustomPlanBuilder';

export default function CustomPlanPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/plan');
  };

  return (
    <CustomPlanBuilder
      isOpen={true}
      onClose={handleClose}
    />
  );
}
