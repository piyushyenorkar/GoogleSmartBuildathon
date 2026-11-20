---
name: pluto-financial-ledger
description: Enforce Razorpay cryptographic HMAC-SHA256 signature verification, atomic split-ledger fee calculations, and payout settlement rules for Pluto Campus ticket bookings.
---

# Pluto Campus Financial & Split-Ledger Guardrails

This skill establishes the strict operational and security standards for processing ticket payments, verifying Razorpay webhooks, calculating atomic fee splits, and executing organizer payout disbursements for **Pluto Campus**.

---

## 1. Cryptographic Signature Verification

Every payment transaction must be verified on the backend before creating or updating any booking record:

1. **HMAC-SHA256 Verification Formula**:
   ```typescript
   const expectedSignature = crypto
     .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
     .update(`${razorpay_order_id}|${razorpay_payment_id}`)
     .digest('hex');
   ```
2. **Timing-Safe Comparison**:
   Always use constant-time comparison to protect against timing attacks:
   ```typescript
   const isValid = crypto.timingSafeEqual(
     Buffer.from(expectedSignature, 'utf-8'),
     Buffer.from(razorpay_signature, 'utf-8')
   );
   ```
3. **Strict Gate**: If signature comparison fails:
   - Reject the request immediately with HTTP 400.
   - Log the incident with IP address and order ID.
   - NEVER create a booking row in `bookings` or mark status as `confirmed`.

---

## 2. Financial Model: "Option A — Collect All, Payout Later"

All ticket revenues flow into Pluto Campus's primary Razorpay account. Net earnings are accrued in the platform ledger and disbursed to organizers upon manual or automated review.

### Atomic Fee Split Formula:
Given an event ticket order with `ticket_price` and `quantity`:

$$\text{Ticket Subtotal} = \text{ticket\_price} \times \text{quantity}$$

$$\text{Booking Fee (2.5\%)} = \text{round}(\text{Ticket Subtotal} \times 0.025, 2)$$

$$\text{GST on Fee (18\%)} = \text{round}(\text{Booking Fee} \times 0.18, 2)$$

$$\text{Total Student Paid} = \text{Ticket Subtotal} + \text{Booking Fee} + \text{GST on Fee}$$

$$\text{Platform Commission (10\%)} = \text{round}(\text{Ticket Subtotal} \times 0.10, 2)$$

$$\text{Organizer Net Payable} = \text{Ticket Subtotal} - \text{Platform Commission}$$

---

## 3. Atomic Ledger Persistence (`booking_financials`)

Upon successful payment verification, the transaction ledger MUST be written atomically alongside the booking record:

```sql
INSERT INTO public.booking_financials (
  booking_id,
  event_id,
  user_id,
  organizer_id,
  ticket_subtotal,
  booking_fee,
  gst_on_fee,
  total_paid,
  platform_commission,
  organizer_payable,
  currency,
  payment_gateway,
  gateway_payment_id,
  gateway_order_id,
  created_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'INR', 'razorpay', $11, $12, now()
);
```

---

## 4. Organizer Payout & Withdrawal Workflow

1. **Threshold & Eligibility**:
   - Organizers can request a payout when their net unwithdrawn balance exceeds the minimum threshold (₹500).
   - Event must not be under active cancellation review or chargeback dispute.
2. **Disbursement Pipeline**:
   - **`requested`**: Organizer submits bank account/UPI ID via `/api/payouts/request`.
   - **`processing`**: Pluto HQ verifies linked ticket transactions and audits refund liabilities.
   - **`completed`**: Bank transfer (NEFT/IMPS/UPI) is logged with a mandatory external bank UTR/reference number.
   - **`rejected`**: Rejection requires an explicit `failure_reason` and restores organizer balance.

---

## 5. Refund & Cancellation Guardrails

1. **Time-Window Rule**: Refunds are only permitted if requested at least **24 hours prior** to event `start_date` and `start_time`.
2. **Policy Verification**: Event `refund_policy` must explicitly permit cancellations.
3. **Fee Deduction**: The 2.5% convenience booking fee and GST are non-refundable to cover payment gateway processing costs. Only the `ticket_subtotal` is eligible for refund.

---

## 6. Secrets & Credential Protection

1. **Zero Client Leakage**:
   - `RAZORPAY_KEY_SECRET` must NEVER appear in `pluto_web`, `pluto_owner`, or client bundles.
   - Only `RAZORPAY_KEY_ID` (public key) is permitted in frontend `.env` (`VITE_RAZORPAY_KEY_ID`).
2. **Backend Authentication**:
   - Payout approval endpoints (`/api/pluto-hq/payouts/:id/process`) must require the `x-pluto-pin` header validated against `PLUTO_OWNER_PIN`.
