'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import AlertModal from '@/components/AlertModal';
import { cn } from '@/lib/utils';

const MAX_ALERTS = 20;

type AddAlertButtonProps = {
  symbol: string;
  company: string;
  alertCount: number;
  className?: string;
  label?: string;
};

export default function AddAlertButton({
  symbol,
  company,
  alertCount,
  className,
  label = 'Add Alert',
}: AddAlertButtonProps) {
  const [open, setOpen] = useState(false);
  const atCap = alertCount >= MAX_ALERTS;

  const handleOpen = () => {
    if (atCap) {
      toast.error(`You can have at most ${MAX_ALERTS} alerts`);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={cn(className ?? 'add-alert', atCap && 'opacity-50 cursor-not-allowed')}
        aria-disabled={atCap}
        onClick={handleOpen}
        title={atCap ? `Maximum of ${MAX_ALERTS} alerts reached` : undefined}
      >
        <Bell className="h-4 w-4" />
        <span>{label}</span>
      </button>

      <AlertModal
        open={open}
        setOpen={setOpen}
        alertData={{
          symbol,
          company,
          alertName: '',
          alertType: 'upper',
          threshold: '',
        }}
      />
    </>
  );
}
