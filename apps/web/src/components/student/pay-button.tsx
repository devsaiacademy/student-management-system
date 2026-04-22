"use client";

import { env } from "@student-management-system/env/web";
import { Button } from "@student-management-system/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";

import { trpc } from "@/utils/trpc";

type PayButtonProps = {
  paymentId: number;
  studentId: number;
};

const BRAND_BLUE = "#0769AB";

function showError(title: string, description?: string) {
  gooeyToast.error(title, {
    showTimestamp: false,
    borderColor: "#E0E0E0",
    borderWidth: 1.5,
    description,
    timing: { displayDuration: 5000 },
  });
}

function showSuccess(title: string, description?: string) {
  gooeyToast.success(title, {
    showTimestamp: false,
    borderColor: "#E0E0E0",
    borderWidth: 1.5,
    description,
    timing: { displayDuration: 4000 },
  });
}

export function PayButton({ paymentId, studentId }: PayButtonProps) {
  const queryClient = useQueryClient();

  const verifyPayment = useMutation(
    trpc.razorpay.verifyPayment.mutationOptions({
      onSuccess: () => {
        showSuccess(
          "Payment received",
          "The installment has been marked as paid."
        );
        queryClient.invalidateQueries({
          queryKey: trpc.payments.getStudentPayments.queryOptions({ studentId })
            .queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.enrollments.getStudentEnrollment.queryOptions({
            studentId,
          }).queryKey,
        });
      },
      onError: (error) => {
        showError("Verification failed", error.message);
      },
    })
  );

  const createOrder = useMutation(
    trpc.razorpay.createOrder.mutationOptions({
      onSuccess: (order) => {
        if (typeof window === "undefined" || !window.Razorpay) {
          showError(
            "Couldn't open Razorpay",
            "Checkout script not loaded yet. Please try again."
          );
          return;
        }

        const rzp = new window.Razorpay({
          key: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: order.razorpayOrderId,
          amount: order.amount,
          currency: order.currency,
          name: "Otomatiks Student Payment",
          description: order.description,
          prefill: {
            name: order.studentName,
            email: order.studentEmail,
            contact: order.studentPhone,
          },
          theme: { color: BRAND_BLUE },
          handler: (response) => {
            verifyPayment.mutate({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              // no-op; Pay button stays clickable for a retry.
            },
          },
        });

        rzp.on("payment.failed", (response) => {
          showError(
            "Payment failed",
            response.error?.description ?? "Please try another method."
          );
        });

        rzp.open();
      },
      onError: (error) => {
        showError("Couldn't start payment", error.message);
      },
    })
  );

  const isOpening = createOrder.isPending;
  const isVerifying = verifyPayment.isPending;

  return (
    <Button
      className="h-8 rounded-md px-5 text-xs font-medium"
      disabled={isOpening || isVerifying}
      onClick={() => createOrder.mutate({ paymentId })}
      size="sm"
      variant="blue"
    >
      {isOpening ? "Opening..." : isVerifying ? "Verifying..." : "Pay"}
    </Button>
  );
}
