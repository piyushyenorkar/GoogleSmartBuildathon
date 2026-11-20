import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

// Re-initialize supabase specifically for cron (or we can just reuse the one in server.ts if we export it, 
// but creating a new instance here is safer and avoids circular dependencies)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function initCronJobs() {
  console.log('[Cron] Initializing cron jobs...');

  // 1. Event Reminders: Runs every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running Event Reminders Check...');
    try {
      // Find events starting in exactly 24 hours (roughly)
      // Since we store date as DD/MM/YYYY and time as HH:MM, this requires careful parsing.
      // For MVP, let's just trigger a backend check that pulls all upcoming events and checks their parsed dates.
      
      const { data: events, error } = await supabase
        .from('events')
        .select('id, title, start_date, start_time')
        .in('status', ['approved', 'live']);

      if (error || !events) return;

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      for (const event of events) {
        if (!event.start_date) continue;
        
        // start_date format is usually YYYY-MM-DD or DD/MM/YYYY. 
        // We'll just do a rough check if the event is happening tomorrow.
        const [y, m, d] = event.start_date.includes('-') 
          ? event.start_date.split('-') 
          : event.start_date.split('/').reverse(); // Assuming DD/MM/YYYY
          
        const eventDateStr = `${y}-${m}-${d}`;
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        if (eventDateStr === tomorrowStr) {
          // It's happening tomorrow! Get all booked users.
          const { data: bookings } = await supabase
            .from('bookings')
            .select('user_id')
            .eq('event_id', event.id);

          if (!bookings || bookings.length === 0) continue;

          const userIds = [...new Set(bookings.map((b: any) => b.user_id))];

          const { data: tokens } = await supabase
            .from('push_tokens')
            .select('token')
            .in('user_id', userIds);

          if (tokens && tokens.length > 0 && admin.apps.length) {
            const messages = tokens.map((t: any) => ({
              notification: {
                title: '⏰ Event Reminder',
                body: `${event.title} is happening tomorrow! Don't forget your tickets.`
              },
              token: t.token
            }));
            
            const response = await admin.messaging().sendEach(messages);
            console.log(`[Cron] Sent ${response.successCount} reminders for event ${event.title}`);
          }
        }
      }
    } catch (err) {
      console.error('[Cron] Error running event reminders:', err);
    }
  });

  console.log('[Cron] Cron jobs scheduled successfully.');
}
