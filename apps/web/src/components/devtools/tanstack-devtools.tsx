"use client";

import { TanStackDevtools } from "@tanstack/react-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";

export function TanStackDevTools() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <TanStackDevtools
      config={{
        defaultOpen: false,
      }}
      plugins={[
        {
          defaultOpen: true,
          name: "TanStack Query",
          render: <ReactQueryDevtoolsPanel />,
        },
        {
          defaultOpen: true,
          name: "TanStack Form",
          render: <FormDevtoolsPanel />,
        },
      ]}
    />
  );
}
