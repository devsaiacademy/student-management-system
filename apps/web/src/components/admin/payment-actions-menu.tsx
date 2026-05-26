"use client";

import { Button } from "@student-management-system/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@student-management-system/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { ChevronDown } from "lucide-react";
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
  const [partialOptimistic, setPartialOptimistic] = useState(
    payment.partialPaymentEnabled
  );

  // Dialogs are owned here (not inside the menu) so they don't unmount when
  // the menu closes on item click.
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markUnpaidOpen, setMarkUnpaidOpen] = useState(false);

  const setPartial = useMutation(
    trpc.razorpay.setPartialEnabled.mutationOptions({
      onSuccess: ({ enabled }) => {
        setPartialOptimistic(enabled);
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
        setPartialOptimistic((prev) => !prev);
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
  const partialLocked = payment.amountPaid > 0;
  const canRevert = isPaid && payment.paymentMethod !== "razorpay";
  const paymentForDialogs = {
    id: payment.id,
    label,
    amount: totalAmount,
    dueDate: payment.dueDate,
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="More actions"
              className="h-8 rounded-md px-3 text-xs font-medium"
              size="sm"
              variant="white"
            >
              More
              <ChevronDown aria-hidden className="ml-1 size-3.5" />
            </Button>
          }
        />
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" className="min-w-40">
            {!isPaid && (
              <>
                <DropdownMenuItem onClick={() => setMarkPaidOpen(true)}>
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
                      {state.isPending
                        ? "Sending…"
                        : state.isDebounced
                          ? "Notified recently"
                          : "Notify"}
                    </DropdownMenuItem>
                  )}
                  studentId={studentId}
                />
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={partialOptimistic}
                  closeOnClick={false}
                  disabled={partialLocked || setPartial.isPending}
                  onCheckedChange={(next) => {
                    setPartialOptimistic(next);
                    setPartial.mutate({
                      paymentId: payment.id,
                      enabled: next,
                    });
                  }}
                >
                  Allow partial payment
                </DropdownMenuCheckboxItem>
              </>
            )}
            {canRevert && (
              <DropdownMenuItem onClick={() => setMarkUnpaidOpen(true)}>
                Mark Unpaid
              </DropdownMenuItem>
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
