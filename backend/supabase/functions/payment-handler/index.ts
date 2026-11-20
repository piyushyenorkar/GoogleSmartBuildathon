// Follow this setup guide to integrate the Deno language server with your editor:
// https://supabase.com/docs/guides/functions/getting-started

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts"
// @ts-ignore
import { encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

// Fix for VS Code complaining about Deno being undefined when the Deno extension isn't active
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()
    
    // Setup Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay keys are missing from environment variables.')
    }

    // ─── ACTION: createOrder ──────────────────────────────────────────────────
    if (action === 'createOrder') {
      const { amount, eventId, userEmail, quantity, selectedSeats } = payload
      
      if (!amount) throw new Error("Amount is required")

      // Call Razorpay API directly using Basic Auth
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // convert to paise
          currency: 'INR',
          receipt: `rcpt_${Date.now()}_${eventId?.substring(0,5)}`
        })
      });

      const orderData = await rzpRes.json()
      if (!rzpRes.ok) throw new Error(orderData.error?.description || 'Failed to create order')

      return new Response(
        JSON.stringify({
          order_id: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          key_id: razorpayKeyId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // ─── ACTION: verifyPayment ────────────────────────────────────────────────
    if (action === 'verifyPayment') {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        eventId,
        userEmail,
        quantity,
        ticketPrice,
        bookingFee,
        gstAmount,
        totalAmount,
        selectedSeats
      } = payload

      // Verify Razorpay signature securely on the backend
      const dataString = `${razorpay_order_id}|${razorpay_payment_id}`;
      
      const encoder = new TextEncoder();
      const keyBuf = encoder.encode(razorpayKeySecret);
      const dataBuf = encoder.encode(dataString);
      
      const cryptoKey = await crypto.subtle.importKey(
        "raw", keyBuf, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const signatureBuf = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
      const expectedSignature = encodeHex(new Uint8Array(signatureBuf));

      if (expectedSignature !== razorpay_signature) {
        throw new Error('Invalid payment signature')
      }

      // Check if duplicate booking
      const { data: userRow } = await supabaseClient
        .from('users').select('id').eq('email', userEmail).single()
        
      if (userRow) {
        const { data: existing } = await supabaseClient
          .from('bookings').select('id')
          .eq('event_id', eventId)
          .eq('user_id', userRow.id)
          .eq('booking_status', 'confirmed')
          .maybeSingle();

        if (existing) {
          return new Response(
            JSON.stringify({ success: false, error: 'duplicate_booking' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Insert booking directly from secure Edge Function
      const { data: insertedBooking, error: insertError } = await supabaseClient
        .from('bookings')
        .insert([{
          event_id: eventId,
          user_id: userRow?.id,
          quantity: quantity || 1,
          ticket_price: ticketPrice || 0,
          booking_fee: bookingFee || 0,
          gst_amount: gstAmount || 0,
          total_amount: totalAmount || 0,
          selected_seats: selectedSeats || null,
          booking_status: 'confirmed',
          payment_method: 'razorpay',
          payment_reference: razorpay_payment_id,
        }])
        .select('id')
        .single()

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`)
      }

      return new Response(
        JSON.stringify({ success: true, booking_id: insertedBooking.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
