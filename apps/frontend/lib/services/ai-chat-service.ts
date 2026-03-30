import type { ChatMessage } from '@/types';
import { fetchBackend } from '@/lib/services/backend-client';

export async function generateAiReply({
  childId,
  message,
  recentMessages,
}: {
  childId: string;
  message: string;
  recentMessages: ChatMessage[];
}): Promise<ChatMessage> {
  const response = await fetchBackend<{ reply: string }>(
    `/children/${childId}/ai-chat`,
    {
      method: 'POST',
      body: JSON.stringify({ message, recentMessages }),
    },
  );

  return {
    role: 'model',
    text: response.reply,
  };
}
