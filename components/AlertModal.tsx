'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALERT_TYPE_OPTIONS } from '@/lib/constants';
import { createAlert, updateAlert } from '@/lib/actions/alert.actions';

const EMPTY_FORM = {
  alertName: '',
  alertType: 'upper' as 'upper' | 'lower',
  threshold: '',
};

export default function AlertModal({
  alertId,
  alertData,
  open,
  setOpen,
}: AlertModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [alertName, setAlertName] = useState(EMPTY_FORM.alertName);
  const [alertType, setAlertType] = useState<'upper' | 'lower'>(EMPTY_FORM.alertType);
  const [threshold, setThreshold] = useState(EMPTY_FORM.threshold);
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(alertId);

  useEffect(() => {
    if (!open) return;

    if (alertData && alertId) {
      setAlertName(alertData.alertName || '');
      setAlertType(alertData.alertType === 'lower' ? 'lower' : 'upper');
      setThreshold(alertData.threshold || '');
    } else {
      setAlertName('');
      setAlertType('upper');
      setThreshold('');
    }
    setThresholdError(null);

    const focusTimer = window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [open, alertId, alertData]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;

    const symbol = (alertData?.symbol || '').trim();
    const company = (alertData?.company || symbol).trim() || symbol;
    if (!symbol) {
      toast.error('Symbol is required');
      return;
    }

    const name = alertName.trim();
    if (!name) {
      toast.error('Alert name is required');
      return;
    }

    const parsedThreshold = Number(String(threshold).trim());
    if (!Number.isFinite(parsedThreshold) || parsedThreshold <= 0) {
      setThresholdError('Enter a positive number');
      return;
    }
    setThresholdError(null);

    const payload = {
      symbol,
      company,
      alertName: name,
      alertType,
      threshold: parsedThreshold,
    };

    startTransition(async () => {
      try {
        const result = isEdit && alertId
          ? await updateAlert(alertId, payload)
          : await createAlert(payload);

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success(isEdit ? 'Alert updated' : 'Alert created');
        setOpen(false);
        router.refresh();
      } catch {
        toast.error('Something went wrong. Please try again.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="alert-dialog">
        <DialogHeader>
          <DialogTitle className="alert-title">
            {isEdit ? 'Edit Alert' : 'Add Alert'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {alertData?.symbol ? (
            <p className="text-sm text-[var(--briefing-slate)]">
              {alertData.company || alertData.symbol} ({alertData.symbol})
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="alert-name" className="form-label">
              Alert name
            </Label>
            <Input
              ref={nameInputRef}
              id="alert-name"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              placeholder="e.g. AAPL breakout"
              maxLength={80}
              disabled={pending}
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <Label className="form-label">Alert type</Label>
            <Select
              value={alertType}
              onValueChange={(value) =>
                setAlertType(value === 'lower' ? 'lower' : 'upper')
              }
              disabled={pending}
            >
              <SelectTrigger className="select-trigger w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="packet-select-content">
                {ALERT_TYPE_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="packet-select-item"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-threshold" className="form-label">
              Threshold
            </Label>
            <Input
              id="alert-threshold"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value);
                if (thresholdError) setThresholdError(null);
              }}
              placeholder="Price level"
              disabled={pending}
              className="form-input"
              aria-invalid={Boolean(thresholdError)}
            />
            {thresholdError ? (
              <p className="text-sm text-red-500">{thresholdError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="text-[var(--briefing-slate)] hover:text-[var(--briefing-ink)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="yellow-btn"
            >
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create alert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
