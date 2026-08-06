"use client";

import {
  Chart3Icon,
  ReceiptBillIcon,
  Users,
  Wallet1Icon,
} from "blode-icons-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const TabsBlock = () => {
  return (
    <div className="mx-auto w-full">
      <Tabs className="w-full" defaultValue="payments">
        <div className="w-full overflow-x-auto">
          <TabsList
            className="w-full"
            floatingBgClassName="bg-blue-500"
            variant="clip-path"
          >
            {TABS.map((tab) => (
              <TabsTrigger
                className="flex h-10 flex-shrink-0 items-center gap-2 rounded-full px-4"
                key={tab.value}
                value={tab.value}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {TABS.map((tab) => (
          <TabsContent
            className="mt-6 rounded-2xl border border-border py-8 text-center"
            key={tab.value}
            value={tab.value}
          >
            <p className="text-muted-foreground text-sm">
              Content for {tab.name}
            </p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const TABS = [
  {
    name: "Payments",
    value: "payments",
    icon: <Wallet1Icon aria-hidden className="size-4" />,
  },
  {
    name: "Balances",
    value: "balances",
    icon: <Chart3Icon aria-hidden className="size-4" />,
  },
  {
    name: "Customers",
    value: "customers",
    icon: <Users aria-hidden className="size-4" />,
  },
  {
    name: "Billing",
    value: "billing",
    icon: <ReceiptBillIcon aria-hidden className="size-4" />,
  },
];
