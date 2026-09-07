"use client";

import { useFormState } from "react-dom";
import { updateCustomer, type CustomerFormState } from "../../actions";
import { CustomerForm } from "../../customer-form";
import type { Customer } from "@/lib/types";

const initialState: CustomerFormState = {};

export function EditCustomerForm({ customer }: { customer: Customer }) {
  const boundUpdate = updateCustomer.bind(null, customer.id);
  const [state, formAction] = useFormState(boundUpdate, initialState);

  return (
    <CustomerForm formAction={formAction} state={state} defaultValues={customer} submitLabel="Save Changes" />
  );
}
