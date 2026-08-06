"use client";

import { useId, useState } from "react";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

import { PasswordInput } from "./password-input";

export const PasswordStrengthBlock = () => {
  const [password, setPassword] = useState("");
  const hintId = useId();

  return (
    <div className="max-w-sm">
      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <PasswordInput
          aria-describedby={hintId}
          autoComplete="new-password"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          showStrength
          value={password}
        />
        <FieldDescription id={hintId}>
          Ten characters or more scores as strong.
        </FieldDescription>
      </Field>
    </div>
  );
};
