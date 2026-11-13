import { supabase } from '@/lib/supabase';

export interface FeedbackInput {
  name: string;
  email: string;
  message: string;
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const { error } = await supabase.from('feedback').insert({
    name: input.name.trim() || null,
    email: input.email.trim() || null,
    message: input.message.trim(),
  });
  if (error) {
    throw new Error('Your message could not be sent. Please try again in a moment.');
  }
}
