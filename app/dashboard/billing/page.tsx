"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard, Lock } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-6">
          <h1 className="text-lg font-semibold">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and payment methods
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Billing is currently disabled
                </span>
              </div>
              <CardTitle className="flex items-center gap-2 pt-2">
                <CreditCard className="h-6 w-6" />
                Billing &amp; subscription
              </CardTitle>
              <CardDescription>
                Subscription and payment management are not available yet. When
                billing is enabled, you will be able to manage your plan,
                payment methods, and invoices here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Check back later or contact support if you have questions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
