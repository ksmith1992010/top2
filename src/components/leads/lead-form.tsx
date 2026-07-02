"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LeadFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  leadSource: string;
  jobType: "insurance" | "retail";
};

const EMPTY_FORM: LeadFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
  leadSource: "",
  jobType: "insurance",
};

type LeadFormProps = {
  mode: "create" | "edit";
  customerId?: string;
  initial?: Partial<LeadFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function LeadForm({ mode, customerId, initial, onSuccess, onCancel }: LeadFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<LeadFormData>({ ...EMPTY_FORM, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof LeadFormData>(key: K, value: LeadFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const url = mode === "create" ? "/api/customers" : `/api/customers/${customerId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const body =
        mode === "create"
          ? {
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email || undefined,
              phone: form.phone || undefined,
              notes: form.notes || undefined,
              leadSource: form.leadSource || undefined,
              jobType: form.jobType,
              property: {
                addressLine1: form.addressLine1,
                addressLine2: form.addressLine2 || undefined,
                city: form.city,
                state: form.state,
                zip: form.zip,
              },
            }
          : {
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email || undefined,
              phone: form.phone || undefined,
              notes: form.notes || undefined,
              property: {
                addressLine1: form.addressLine1,
                addressLine2: form.addressLine2 || undefined,
                city: form.city,
                state: form.state,
                zip: form.zip,
              },
            };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message ?? "Failed to save lead");
        return;
      }

      if (mode === "create" && data.customer?.id) {
        router.push(`/leads/${data.customer.id}`);
        router.refresh();
      } else {
        onSuccess?.();
        if (customerId) {
          router.push(`/leads/${customerId}`);
        }
        router.refresh();
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-top-navy">Contact</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-top-muted">First name</span>
            <input
              required
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-top-muted">Last name</span>
            <input
              required
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-top-muted">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-top-muted">Phone</span>
            <input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-top-muted">Notes</span>
          <textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
          />
        </label>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-top-navy">Property</legend>
        <label className="block text-sm">
          <span className="text-top-muted">Address</span>
          <input
            required
            value={form.addressLine1}
            onChange={(e) => updateField("addressLine1", e.target.value)}
            className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-top-muted">Address line 2</span>
          <input
            value={form.addressLine2}
            onChange={(e) => updateField("addressLine2", e.target.value)}
            className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm sm:col-span-1">
            <span className="text-top-muted">City</span>
            <input
              required
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-top-muted">State</span>
            <input
              required
              maxLength={2}
              value={form.state}
              onChange={(e) => updateField("state", e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-top-muted">ZIP</span>
            <input
              required
              value={form.zip}
              onChange={(e) => updateField("zip", e.target.value)}
              className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
            />
          </label>
        </div>
      </fieldset>

      {mode === "create" && (
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-top-navy">Lead details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-top-muted">Lead source</span>
              <input
                value={form.leadSource}
                onChange={(e) => updateField("leadSource", e.target.value)}
                className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-top-muted">Job type</span>
              <select
                value={form.jobType}
                onChange={(e) => updateField("jobType", e.target.value as "insurance" | "retail")}
                className="mt-1 w-full rounded-lg border border-top-border px-3 py-2"
              >
                <option value="insurance">Insurance</option>
                <option value="retail">Retail</option>
              </select>
            </label>
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-top-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create lead" : "Save changes"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-top-border px-4 py-2 text-sm text-slate-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
