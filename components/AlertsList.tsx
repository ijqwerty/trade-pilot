'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AlertModal from '@/components/AlertModal';
import { deleteAlert } from '@/lib/actions/alert.actions';
import { formatPrice, getAlertText } from '@/lib/utils';

export default function AlertsList({ alertData }: AlertsListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Alert | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const alerts = alertData ?? [];

  const openEdit = (alert: Alert) => {
    setEditing(alert);
    setEditOpen(true);
  };

  const handleDelete = (alert: Alert) => {
    if (pending) return;
    const confirmed = window.confirm(`Delete alert “${alert.alertName}”?`);
    if (!confirmed) return;

    setDeletingId(alert.id);
    startTransition(async () => {
      try {
        const result = await deleteAlert(alert.id);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success('Alert deleted');
        router.refresh();
      } catch {
        toast.error('Something went wrong. Please try again.');
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="watchlist-alerts flex">
      <h2 className="packet-section-title">Alerts</h2>

      {alerts.length === 0 ? (
        <div className="alert-list">
          <p className="alert-empty">
            No alerts yet. On a watchlist row or stock page, choose{' '}
            <strong>Add Alert</strong> to set an upper or lower price threshold.
          </p>
        </div>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => (
            <li key={alert.id} className="alert-item">
              <p className="alert-name">{alert.alertName}</p>
              <div className="alert-details">
                <span className="alert-company">
                  {alert.company} ({alert.symbol})
                </span>
                <span className="alert-price">
                  {alert.currentPrice > 0 ? formatPrice(alert.currentPrice) : '—'}
                </span>
              </div>
              <div className="alert-actions">
                <span className="text-sm text-[var(--briefing-slate)]">{getAlertText(alert)}</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="alert-update-btn"
                    aria-label={`Edit ${alert.alertName}`}
                    onClick={() => openEdit(alert)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="alert-delete-btn"
                    aria-label={`Delete ${alert.alertName}`}
                    disabled={pending && deletingId === alert.id}
                    onClick={() => handleDelete(alert)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <AlertModal
          open={editOpen}
          setOpen={(next) => {
            setEditOpen(next);
            if (!next) setEditing(null);
          }}
          alertId={editing.id}
          alertData={{
            symbol: editing.symbol,
            company: editing.company,
            alertName: editing.alertName,
            alertType: editing.alertType,
            threshold: String(editing.threshold),
          }}
        />
      ) : null}
    </div>
  );
}
