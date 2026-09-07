"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { completeOnboarding, type OnboardingState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { AUSTRALIAN_STATES } from "@/lib/types";

const initialState: OnboardingState = {};

const TRADES: { value: string; label: string }[] = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" },
  { value: "building", label: "Building" },
  { value: "carpentry", label: "Carpentry" },
  { value: "other", label: "Other" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" isLoading={pending}>
      Finish setup
    </Button>
  );
}

export function OnboardingForm() {
  const [state, formAction] = useFormState(completeOnboarding, initialState);
  const [gstRegistered, setGstRegistered] = useState<"yes" | "no">("no");

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink-900">Business details</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Business name</Label>
            <Input id="name" name="name" required placeholder="e.g. Smith Plumbing Co." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="abn">ABN</Label>
              <Input id="abn" name="abn" placeholder="11 digits" inputMode="numeric" />
            </div>
            <div>
              <Label htmlFor="phone">Business phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="04xx xxx xxx" />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Business email</Label>
            <Input id="email" name="email" type="email" placeholder="jobs@yourbusiness.com.au" />
          </div>
          <div>
            <Label htmlFor="address">Street address</Label>
            <Input id="address" name="address" placeholder="12 Example St" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Label htmlFor="suburb">Suburb</Label>
              <Input id="suburb" name="suburb" />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Select id="state" name="state" defaultValue="">
                <option value="" disabled>
                  Select
                </option>
                {AUSTRALIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" name="postcode" inputMode="numeric" maxLength={4} />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink-900">Your trade</h2>
        <Label htmlFor="trade">Primary trade</Label>
        <Select id="trade" name="trade" defaultValue="plumbing">
          {TRADES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <p className="mt-2 text-xs text-ink-500">
          TradieAI is optimised for plumbing in V1 - other trades are supported but some quote
          suggestions are tuned for plumbing jobs.
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink-900">GST</h2>
        <Label>Are you registered for GST?</Label>
        <div className="flex gap-3">
          <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-ink-200 py-2.5 text-sm font-medium has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
            <input
              type="radio"
              name="gstRegistered"
              value="yes"
              className="sr-only"
              checked={gstRegistered === "yes"}
              onChange={() => setGstRegistered("yes")}
            />
            Yes
          </label>
          <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border border-ink-200 py-2.5 text-sm font-medium has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
            <input
              type="radio"
              name="gstRegistered"
              value="no"
              className="sr-only"
              checked={gstRegistered === "no"}
              onChange={() => setGstRegistered("no")}
            />
            No
          </label>
        </div>

        {gstRegistered === "yes" && (
          <div className="mt-4">
            <Label htmlFor="pricesIncludeGst">Are your prices...</Label>
            <Select id="pricesIncludeGst" name="pricesIncludeGst" defaultValue="inclusive">
              <option value="inclusive">GST inclusive</option>
              <option value="exclusive">GST exclusive</option>
            </Select>
          </div>
        )}

        <p className="mt-3 text-xs text-ink-500">
          TradieAI performs the GST calculation you configure here - this isn't tax advice, and you
          should confirm your GST setup with your accountant or the ATO.
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink-900">Defaults</h2>
        <p className="mb-4 text-xs text-ink-500">
          Used to pre-fill new quotes. You can change these anytime in Settings.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="defaultLabourRate">Default labour rate ($/hr)</Label>
            <Input
              id="defaultLabourRate"
              name="defaultLabourRate"
              type="number"
              min="0"
              step="0.01"
              defaultValue="120"
            />
          </div>
          <div>
            <Label htmlFor="defaultCalloutFee">Default call-out fee ($)</Label>
            <Input
              id="defaultCalloutFee"
              name="defaultCalloutFee"
              type="number"
              min="0"
              step="0.01"
              defaultValue="120"
            />
          </div>
        </div>
      </Card>

      <FormMessage message={state.error} />

      <SubmitButton />
    </form>
  );
}
