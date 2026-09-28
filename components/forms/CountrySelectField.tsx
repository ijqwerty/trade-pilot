/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Control, Controller, FieldError } from 'react-hook-form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import countryList from 'react-select-country-list';

type CountrySelectProps = {
  name: string;
  label: string;
  control: Control<any>;
  error?: FieldError;
  required?: boolean;
  hint?: string;
};

const CountrySelect = ({
  id,
  labelId,
  describedBy,
  value,
  onChange,
  invalid,
}: {
  id: string;
  labelId: string;
  describedBy?: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const countries = countryList().getData();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : undefined}
          className={cn('country-select-trigger', {
            'border-[#9b2c2c] focus:!border-[#9b2c2c]': invalid,
          })}
        >
          {value ? (
            <span>{countries.find((c) => c.value === value)?.label ?? value}</span>
          ) : (
            'Select your country...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 packet-menu border-[color-mix(in_srgb,#1b2430_14%,transparent)]"
        align="start"
      >
        <Command className="bg-[#f7f8f8] border-0">
          <CommandInput
            placeholder="Search countries..."
            className="country-select-input"
          />
          <CommandEmpty className="country-select-empty">
            No country found.
          </CommandEmpty>
          <CommandList className="max-h-60 bg-[#f7f8f8] scrollbar-hide-default">
            <CommandGroup className="bg-[#f7f8f8]">
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={`${country.label} ${country.value}`}
                  onSelect={() => {
                    onChange(country.value);
                    setOpen(false);
                  }}
                  className="country-select-item"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 text-[#2f6f8f]',
                      value === country.value ? 'opacity-100' : 'opacity-0'
                    )}
                    aria-hidden
                  />
                  <span>{country.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const CountrySelectField = ({
  name,
  label,
  control,
  error,
  required = false,
  hint = 'Helps show market data and news relevant to your region.',
}: CountrySelectProps) => {
  const labelId = `${name}-label`;
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [
    error ? errorId : null,
    hint && !error ? hintId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <Label id={labelId} htmlFor={name} className="form-label">
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        rules={{
          required: required ? `Please select ${label.toLowerCase()}` : false,
        }}
        render={({ field }) => (
          <CountrySelect
            id={name}
            labelId={labelId}
            describedBy={describedBy}
            value={field.value}
            onChange={field.onChange}
            invalid={!!error}
          />
        )}
      />
      {hint && !error && (
        <p id={hintId} className="form-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};
