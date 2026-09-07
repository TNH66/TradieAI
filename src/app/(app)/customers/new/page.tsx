"use client";

import { useFormState } from "react-dom";
import { createCustomer, type CustomerFormState } from "../actions";
import { CustomerForm } from "../customer-form";

const initialState: CustomerFormState = {};

export default function NewCustomerPage() {
  const [state, formAction] = useFormState(createCustomer, initialState);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink-900">Add Customer</h1>
      <CustomerForm formAction={formAction} state={state} submitLabel="Save Customer" />
    </div>
  );
}
