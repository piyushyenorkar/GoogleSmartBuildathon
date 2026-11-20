export interface Booking {
  id: string
  event_id: string
  user_id: string
  quantity: number
  ticket_price: number
  booking_fee: number
  gst_amount: number
  total_amount: number
  selected_seats?: string[]
  booking_status: 'confirmed' | 'cancelled' | 'pending'
  payment_method: string
  payment_reference?: string
  created_at: string
}

export interface PaymentOrder {
  order_id: string
  amount: number
  currency: string
  key_id: string
  db_order_id?: string
}

export interface PaymentVerification {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  eventId: string
  userEmail: string
  quantity: number
  ticketPrice: number
  bookingFee: number
  gstAmount: number
  totalAmount: number
  selectedSeats?: string[]
  paymentMethod?: string
}
