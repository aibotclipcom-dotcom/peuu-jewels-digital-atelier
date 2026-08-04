import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const addressBase = {
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
};

const optionalString = z.string().trim().max(300).optional().or(z.literal(""));

export const shippingSchema = z
  .object({
    ...addressBase,
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    billing_same: z.boolean(),
    billing_full_name: optionalString,
    billing_phone: optionalString,
    billing_street_address: optionalString,
    billing_city: optionalString,
    billing_state: optionalString,
    billing_postal_code: optionalString,
  })
  .superRefine((v, ctx) => {
    if (v.billing_same) return;
    const required: Array<[keyof typeof v, string]> = [
      ["billing_full_name", "Please enter the billing name"],
      ["billing_phone", "Enter a valid phone number"],
      ["billing_street_address", "Address is too short"],
      ["billing_city", "City is required"],
      ["billing_state", "State is required"],
      ["billing_postal_code", "Enter a valid postal code"],
    ];
    for (const [key, message] of required) {
      const value = String(v[key] ?? "").trim();
      if (value.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key as string], message });
      }
    }
  });

export type ShippingValues = z.infer<typeof shippingSchema>;

interface Props {
  defaultValues?: Partial<ShippingValues>;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: ShippingValues) => void | Promise<void>;
  showNotes?: boolean;
  showBilling?: boolean;
  footer?: React.ReactNode;
}

export function ShippingDetailsForm({
  defaultValues,
  submitting,
  submitLabel,
  onSubmit,
  showNotes = true,
  showBilling = false,
  footer,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
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
      billing_same: true,
      billing_full_name: "",
      billing_phone: "",
      billing_street_address: "",
      billing_city: "",
      billing_state: "",
      billing_postal_code: "",
      ...defaultValues,
    },
  });

  const billingSame = watch("billing_same");

  const inputBase =
    "w-full bg-transparent border-0 border-b pb-3 pt-6 text-navy outline-none transition-colors focus:border-navy placeholder:text-navy/35";
  const errCls = "border-rose focus:border-rose";
  const okCls = "border-border/70";
  const cls = (invalid: boolean) => `${inputBase} ${invalid ? errCls : okCls}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Full Name" error={errors.full_name?.message}>
          <input {...register("full_name")} aria-invalid={!!errors.full_name} className={cls(!!errors.full_name)} />
        </Field>
        <Field label="Phone Number" error={errors.phone?.message}>
          <input
            {...register("phone")}
            aria-invalid={!!errors.phone}
            placeholder="+91 98765 43210"
            className={cls(!!errors.phone)}
          />
        </Field>
      </div>

      <Field label="Street Address" error={errors.street_address?.message}>
        <input
          {...register("street_address")}
          aria-invalid={!!errors.street_address}
          className={cls(!!errors.street_address)}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="City" error={errors.city?.message}>
          <input {...register("city")} aria-invalid={!!errors.city} className={cls(!!errors.city)} />
        </Field>
        <Field label="State" error={errors.state?.message}>
          <input {...register("state")} aria-invalid={!!errors.state} className={cls(!!errors.state)} />
        </Field>
        <Field label="Postal Code" error={errors.postal_code?.message}>
          <input
            {...register("postal_code")}
            aria-invalid={!!errors.postal_code}
            className={cls(!!errors.postal_code)}
          />
        </Field>
      </div>

      {showBilling && (
        <div className="border-t border-border/60 pt-6">
          <label className="flex items-center gap-3 text-[0.75rem] text-navy/70">
            <input type="checkbox" {...register("billing_same")} className="h-4 w-4 accent-navy" />
            Billing address is the same as delivery address
          </label>

          {!billingSame && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Billing Name" error={errors.billing_full_name?.message}>
                  <input {...register("billing_full_name")} className={cls(!!errors.billing_full_name)} />
                </Field>
                <Field label="Billing Phone" error={errors.billing_phone?.message}>
                  <input {...register("billing_phone")} className={cls(!!errors.billing_phone)} />
                </Field>
              </div>
              <Field label="Billing Street Address" error={errors.billing_street_address?.message}>
                <input
                  {...register("billing_street_address")}
                  className={cls(!!errors.billing_street_address)}
                />
              </Field>
              <div className="grid gap-6 sm:grid-cols-3">
                <Field label="Billing City" error={errors.billing_city?.message}>
                  <input {...register("billing_city")} className={cls(!!errors.billing_city)} />
                </Field>
                <Field label="Billing State" error={errors.billing_state?.message}>
                  <input {...register("billing_state")} className={cls(!!errors.billing_state)} />
                </Field>
                <Field label="Billing Postal Code" error={errors.billing_postal_code?.message}>
                  <input {...register("billing_postal_code")} className={cls(!!errors.billing_postal_code)} />
                </Field>
              </div>
            </div>
          )}
        </div>
      )}

      {showNotes && (
        <Field label="Additional Information / Order Notes (Optional)" error={errors.notes?.message}>
          <textarea
            {...register("notes")}
            rows={3}
            className={`${cls(!!errors.notes)} resize-none`}
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
      <span className="block text-[0.65rem] tracking-luxury uppercase text-navy/55">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[0.7rem] text-rose">{error}</span>}
    </label>
  );
}
