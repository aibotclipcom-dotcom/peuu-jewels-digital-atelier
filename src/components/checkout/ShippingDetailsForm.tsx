import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

export const shippingSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-]{7,15}$/, "Enter a valid phone number"),
  street_address: z.string().trim().min(5, "Address is too short").max(300),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "State is required").max(80),
  postal_code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9\s\-]{3,10}$/, "Enter a valid postal code"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ShippingValues = z.infer<typeof shippingSchema>;

interface Props {
  defaultValues?: Partial<ShippingValues>;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: ShippingValues) => void | Promise<void>;
  showNotes?: boolean;
  footer?: React.ReactNode;
}

export function ShippingDetailsForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  showNotes = true,
  footer,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      street_address: "",
      city: "",
      state: "",
      postal_code: "",
      notes: "",
      ...defaultValues,
    },
  });

  const inputBase =
    "w-full bg-transparent border-0 border-b pb-3 pt-6 text-navy outline-none transition-colors focus:border-navy placeholder:text-navy/35";
  const errCls = "border-rose focus:border-rose";
  const okCls = "border-border/70";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Full Name" error={errors.full_name?.message}>
          <input
            {...register("full_name")}
            aria-invalid={!!errors.full_name}
            className={`${inputBase} ${errors.full_name ? errCls : okCls}`}
          />
        </Field>
        <Field label="Phone Number" error={errors.phone?.message}>
          <input
            {...register("phone")}
            aria-invalid={!!errors.phone}
            placeholder="+91 98765 43210"
            className={`${inputBase} ${errors.phone ? errCls : okCls}`}
          />
        </Field>
      </div>

      <Field label="Street Address" error={errors.street_address?.message}>
        <input
          {...register("street_address")}
          aria-invalid={!!errors.street_address}
          className={`${inputBase} ${errors.street_address ? errCls : okCls}`}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="City" error={errors.city?.message}>
          <input
            {...register("city")}
            aria-invalid={!!errors.city}
            className={`${inputBase} ${errors.city ? errCls : okCls}`}
          />
        </Field>
        <Field label="State" error={errors.state?.message}>
          <input
            {...register("state")}
            aria-invalid={!!errors.state}
            className={`${inputBase} ${errors.state ? errCls : okCls}`}
          />
        </Field>
        <Field label="Postal Code" error={errors.postal_code?.message}>
          <input
            {...register("postal_code")}
            aria-invalid={!!errors.postal_code}
            className={`${inputBase} ${errors.postal_code ? errCls : okCls}`}
          />
        </Field>
      </div>

      {showNotes && (
        <Field
          label="Additional Information / Order Notes (Optional)"
          error={errors.notes?.message}
        >
          <textarea
            {...register("notes")}
            rows={3}
            className={`${inputBase} ${errors.notes ? errCls : okCls} resize-none`}
          />
        </Field>
      )}

      {footer}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex w-full items-center justify-center gap-3 bg-navy py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Processing…" : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[0.65rem] tracking-luxury uppercase text-navy/55">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-[0.7rem] text-rose">{error}</span>
      )}
    </label>
  );
}
