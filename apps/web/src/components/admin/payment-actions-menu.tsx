"use client";

import { Button } from "@student-management-system/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@student-management-system/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Coins,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

import { MarkAsPaid } from "../student/mark-as-paid";
import { MarkAsUnpaid } from "../student/mark-as-unpaid";
import { NotifyUserButton } from "../student/notify-user-button";

type PaymentForMenu = {
  id: number;
  paymentStatus: string;
  paymentMethod: string | null;
  partialPaymentEnabled: boolean;
  amountPaid: number;
  metaData: { overdueNotifiedAt?: string } | null;
  dueDate: string;
};

type PaymentActionsMenuProps = {
  payment: PaymentForMenu;
  totalAmount: number;
  label: string;
  studentId: number;
  formatCurrency: (amount: number) => string;
  formatDate: (value: string) => string;
};

export function PaymentActionsMenu({
  payment,
  totalAmount,
  label,
  studentId,
  formatCurrency,
  formatDate,
}: PaymentActionsMenuProps) {
  const queryClient = useQueryClient();

  // Dialogs are owned here so they survive when the menu closes on click.
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markUnpaidOpen, setMarkUnpaidOpen] = useState(false);

  const setPartial = useMutation(
    trpc.razorpay.setPartialEnabled.mutationOptions({
      onSuccess: ({ enabled }) => {
        queryClient.invalidateQueries({
          queryKey: trpc.payments.getStudentPayments.queryOptions({ studentId })
            .queryKey,
        });
        gooeyToast.success(
          enabled ? "Partial payment enabled" : "Partial payment disabled",
          {
            showTimestamp: false,
            borderColor: "#E0E0E0",
            borderWidth: 1.5,
            timing: { displayDuration: 3000 },
          }
        );
      },
      onError: (error) => {
        gooeyToast.error("Couldn't update", {
          showTimestamp: false,
          borderColor: "#E0E0E0",
          borderWidth: 1.5,
          description: error.message,
          timing: { displayDuration: 5000 },
        });
      },
    })
  );

  const isPaid = payment.paymentStatus === "paid";
  const canRevert = isPaid && payment.paymentMethod !== "razorpay";
  const paymentForDialogs = {
    id: payment.id,
    label,
    amount: totalAmount,
    amountPaid: payment.amountPaid,
    dueDate: payment.dueDate,
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Actions"
              className="h-8 rounded-md px-3 text-xs font-medium"
              size="sm"
              variant="white"
            >
              Actions
              <ChevronDown aria-hidden className="ml-1 size-3.5" />
            </Button>
          }
        />
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" className="min-w-44">
            {!isPaid && (
              <>
                <DropdownMenuItem onClick={() => setMarkPaidOpen(true)}>
                  <CheckCircle2
                    className="group-hover/dropdown-menu-item:[animation:pop_0.5s_ease-in-out]"
                    color="#16a34a"
                  />
                  Mark Paid
                </DropdownMenuItem>
                <NotifyUserButton
                  notifiedAt={payment.metaData?.overdueNotifiedAt ?? null}
                  paymentId={payment.id}
                  renderTrigger={(notify, state) => (
                    <DropdownMenuItem
                      disabled={state.isPending || state.isDebounced}
                      onClick={notify}
                    >
                      <Bell
                        className="origin-top group-hover/dropdown-menu-item:[animation:wiggle_0.5s_ease-in-out]"
                        color="#eab308"
                      />
                      {state.isPending
                        ? "Sending…"
                        : state.isDebounced
                          ? "Notified recently"
                          : "Notify"}
                    </DropdownMenuItem>
                  )}
                  studentId={studentId}
                />
                <DropdownMenuCheckboxItem
                  checked={payment.partialPaymentEnabled}
                  closeOnClick={false}
                  disabled={setPartial.isPending}
                  onCheckedChange={(next) => {
                    setPartial.mutate({
                      paymentId: payment.id,
                      enabled: next,
                    });
                  }}
                >
                  <Coins
                    className="group-hover/dropdown-menu-item:[animation:flip-coin_0.6s_ease-in-out]"
                    color="#f97316"
                  />
                  Allow partial payment
                </DropdownMenuCheckboxItem>
              </>
            )}
            {canRevert && (
              <>
                <DropdownMenuItem onClick={() => setMarkUnpaidOpen(true)}>
                  <XCircle
                    className="group-hover/dropdown-menu-item:animate-[pop_0.5s_ease-in-out]"
                    color="#dc2626"
                  />
                  Mark Unpaid
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Bell
                    className="origin-top transition-transform duration-300 group-hover/dropdown-menu-item:-rotate-12"
                    color="#eab308"
                  />
                  Notify
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem
                  checked={payment.partialPaymentEnabled}
                  closeOnClick={false}
                  disabled
                >
                  <Coins
                    className="group-hover/dropdown-menu-item:animate-[flip-coin_0.6s_ease-in-out]"
                    color="#f97316"
                  />
                  Allow partial payment
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>

      {!isPaid && (
        <MarkAsPaid
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onOpenChange={setMarkPaidOpen}
          open={markPaidOpen}
          payment={paymentForDialogs}
          renderTrigger={() => null}
          studentId={studentId}
        />
      )}
      {canRevert && (
        <MarkAsUnpaid
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onOpenChange={setMarkUnpaidOpen}
          open={markUnpaidOpen}
          payment={paymentForDialogs}
          renderTrigger={() => null}
          studentId={studentId}
        />
      )}
    </>
  );
}
