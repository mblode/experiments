"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";

import { PasswordInput } from "./password-input";

export const PasswordStrengthBlock = () => {
  const [password, setPassword] = useState("");

  return (
    <Field>
      <FieldLabel htmlFor="password">Password</FieldLabel>
      <PasswordInput
        autoComplete="new-password"
        id="password"
        onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
        showStrength
        value={password}
      />
    </Field>
  );
};
