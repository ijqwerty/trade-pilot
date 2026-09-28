import { Label } from '@/components/ui/label';
import { Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SelectField = ({
  name,
  label,
  placeholder,
  options,
  control,
  error,
  required = false,
  hint,
}: SelectFieldProps) => {
  const labelId = `${name}-label`;
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [
    error ? errorId : null,
    hint ? hintId : null,
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
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger
              id={name}
              className="select-trigger"
              aria-labelledby={labelId}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="packet-select-content">
              {options.map((option) => (
                <SelectItem
                  value={option.value}
                  key={option.value}
                  className="packet-select-item"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

export default SelectField;
