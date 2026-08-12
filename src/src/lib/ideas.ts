import { supabase } from './supabase';

export interface IdeaSubmission {
  name: string;
  contact?: string;
  message: string;
}

export async function submitIdea(input: IdeaSubmission): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('collection_ideas')
    .insert({
      name: input.name.trim(),
      contact: input.contact?.trim() || null,
      message: input.message.trim(),
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  // Fire-and-forget email notification — never block the success state on this.
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-integration`;
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'idea',
        idea: {
          id: data?.id,
          name: input.name,
          contact: input.contact ?? '',
          message: input.message,
        },
      }),
    }).catch(() => {});
  } catch {
    // Ignore — the idea is already saved either way.
  }

  return { ok: true };
}
