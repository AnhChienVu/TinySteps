import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { ChildrenService } from '../children/children.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAiChatMessageDto } from './dto/create-ai-chat-message.dto';

type FeedingRow = {
  id: string;
  occurred_at: string;
  type: 'breast' | 'bottle' | 'solid';
  amount: number | string | null;
  unit: string | null;
  notes: string | null;
};

type SleepRow = {
  id: string;
  start_time: string;
  end_time: string | null;
  notes: string | null;
};

type DiaperRow = {
  id: string;
  occurred_at: string;
  type: 'wet' | 'dry' | 'both';
  notes: string | null;
};

type HealthLogRow = {
  id: string;
  occurred_at: string;
  type: 'symptom' | 'medication' | 'doctor' | 'vaccination';
  title: string;
  notes: string | null;
};

type ConversationMessage = {
  role: 'user' | 'model';
  text: string;
};

@Injectable()
export class AiChatService {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly childrenService: ChildrenService,
  ) {}

  async createReply(
    childId: string,
    user: DecodedIdToken,
    dto: CreateAiChatMessageDto,
  ) {
    const child = await this.childrenService.getChildForUser(childId, user);
    const client = this.supabaseService.getAdminClient();

    const [feedingsResult, sleepsResult, diapersResult, healthLogsResult] =
      await Promise.all([
        client
          .from('feedings')
          .select('id, occurred_at, type, amount, unit, notes')
          .eq('child_id', childId)
          .order('occurred_at', { ascending: false })
          .limit(100)
          .returns<FeedingRow[]>(),
        client
          .from('sleeps')
          .select('id, start_time, end_time, notes')
          .eq('child_id', childId)
          .order('start_time', { ascending: false })
          .limit(100)
          .returns<SleepRow[]>(),
        client
          .from('diapers')
          .select('id, occurred_at, type, notes')
          .eq('child_id', childId)
          .order('occurred_at', { ascending: false })
          .limit(100)
          .returns<DiaperRow[]>(),
        client
          .from('health_logs')
          .select('id, occurred_at, type, title, notes')
          .eq('child_id', childId)
          .order('occurred_at', { ascending: false })
          .limit(100)
          .returns<HealthLogRow[]>(),
      ]);

    const queryError =
      feedingsResult.error ??
      sleepsResult.error ??
      diapersResult.error ??
      healthLogsResult.error;

    if (queryError) {
      throw new Error(`Unable to load AI chat context: ${queryError.message}`);
    }

    const reply = await this.generateReply({
      childName: child.name,
      message: dto.message,
      recentMessages: dto.recentMessages ?? [],
      feedings: feedingsResult.data ?? [],
      sleeps: sleepsResult.data ?? [],
      diapers: diapersResult.data ?? [],
      healthLogs: healthLogsResult.data ?? [],
    });

    return {
      reply,
    };
  }

  private async generateReply({
    childName,
    message,
    recentMessages,
    feedings,
    sleeps,
    diapers,
    healthLogs,
  }: {
    childName: string;
    message: string;
    recentMessages: ConversationMessage[];
    feedings: FeedingRow[];
    sleeps: SleepRow[];
    diapers: DiaperRow[];
    healthLogs: HealthLogRow[];
  }) {
    const fallbackReply = this.generateFallbackReply({
      childName,
      message,
      recentMessages,
      feedings,
      sleeps,
      diapers,
      healthLogs,
    });
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash-lite';

    if (!apiKey) {
      return fallbackReply;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: [
                    'You are TinySteps AI, a warm and practical baby-care assistant inside a parenting app.',
                    'When the user asks about their child logs, use the provided activity context and do not invent events that are not in the data.',
                    'When the user asks a broader baby-care question that is not answered by the logs, you may answer using general baby-care knowledge.',
                    'Be clear about the difference between observations from the app and general guidance.',
                    'Do not pretend to know facts about the child that are not present in the logs.',
                    'Be supportive, practical, and concise.',
                    'If the topic is medical, safety-related, or urgent, include a brief note that you are not a substitute for a clinician and suggest getting professional care when appropriate.',
                    'Usually answer in 2-6 sentences unless the question clearly needs a little more detail.',
                  ].join(' '),
                },
              ],
            },
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: this.buildGeminiPrompt({
                      childName,
                      message,
                      recentMessages,
                      feedings,
                      sleeps,
                      diapers,
                      healthLogs,
                    }),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              topP: 0.9,
              maxOutputTokens: 300,
            },
          }),
        },
      );

      if (!response.ok) {
        return fallbackReply;
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim();

      return text || fallbackReply;
    } catch {
      return fallbackReply;
    }
  }

  private generateFallbackReply({
    childName,
    message,
    recentMessages,
    feedings,
    sleeps,
    diapers,
    healthLogs,
  }: {
    childName: string;
    message: string;
    recentMessages: ConversationMessage[];
    feedings: FeedingRow[];
    sleeps: SleepRow[];
    diapers: DiaperRow[];
    healthLogs: HealthLogRow[];
  }) {
    const normalized = message.toLowerCase();
    const todayKey = this.getLocalDayKey(new Date().toISOString());
    const todayFeedings = feedings.filter((item) =>
      this.isOnDay(item.occurred_at, todayKey),
    );
    const todayDiapers = diapers.filter((item) =>
      this.isOnDay(item.occurred_at, todayKey),
    );
    const todaySleeps = sleeps.filter((item) =>
      this.getSleepMinutesWithinDay(item, todayKey) > 0,
    );
    const todaySleepMinutes = todaySleeps.reduce(
      (sum, item) => sum + this.getSleepMinutesWithinDay(item, todayKey),
      0,
    );
    const todayHealthLogs = healthLogs.filter((item) =>
      this.isOnDay(item.occurred_at, todayKey),
    );

    const latestFeeding = feedings[0] ?? null;
    const latestDiaper = diapers[0] ?? null;
    const latestHealth = healthLogs[0] ?? null;
    const latestSleep = sleeps[0] ?? null;

    let text = `${childName} has ${todayFeedings.length} feeding log${todayFeedings.length === 1 ? '' : 's'} and ${todayDiapers.length} diaper change${todayDiapers.length === 1 ? '' : 's'} today.`;

    const lastUserQuestion =
      [...recentMessages]
        .reverse()
        .find((entry) => entry.role === 'user')?.text ?? null;

    if (
      normalized.includes('feed') ||
      normalized.includes('eat') ||
      normalized.includes('bottle') ||
      normalized.includes('milk')
    ) {
      text = latestFeeding
        ? `${childName}'s latest feeding was ${latestFeeding.type} at ${this.formatTimestamp(latestFeeding.occurred_at)}${latestFeeding.amount ? ` for ${latestFeeding.amount} ${latestFeeding.unit ?? ''}` : ''}. Today there are ${todayFeedings.length} feeding entries logged.`
        : `There are no feeding entries for ${childName} yet. You can start by logging a bottle, nursing session, or solids in the feeding page.`;
    } else if (normalized.includes('sleep') || normalized.includes('nap')) {
      text = latestSleep
        ? `${childName} has ${todaySleeps.length} sleep session${todaySleeps.length === 1 ? '' : 's'} touching today for a combined ${this.formatMinutes(todaySleepMinutes)}. The latest sleep entry started at ${this.formatTimestamp(latestSleep.start_time)}.`
        : `There are no sleep logs for ${childName} yet. Once you log naps or bedtime, I can summarize patterns here.`;
    } else if (
      normalized.includes('diaper') ||
      normalized.includes('poop') ||
      normalized.includes('wet')
    ) {
      text = latestDiaper
        ? `${childName} has ${todayDiapers.length} diaper change${todayDiapers.length === 1 ? '' : 's'} today. The latest was ${latestDiaper.type} at ${this.formatTimestamp(latestDiaper.occurred_at)}.`
        : `There are no diaper logs yet for ${childName}. I can summarize diaper patterns once you start logging them.`;
    } else if (
      normalized.includes('health') ||
      normalized.includes('fever') ||
      normalized.includes('medicine') ||
      normalized.includes('medication')
    ) {
      text = latestHealth
        ? `The latest health note for ${childName} is "${latestHealth.title}" logged at ${this.formatTimestamp(latestHealth.occurred_at)}. This assistant can help summarize patterns, but it is not a substitute for medical advice.`
        : `There are no health notes logged for ${childName} yet. If you're asking about symptoms or medication, please also check with a pediatrician.`;
    } else if (
      normalized.includes('summary') ||
      normalized.includes('today') ||
      normalized.includes('overview')
    ) {
      text = `${childName}'s day so far: ${todayFeedings.length} feedings, ${todayDiapers.length} diaper changes, ${todaySleeps.length} sleep session${todaySleeps.length === 1 ? '' : 's'}, and ${todayHealthLogs.length} health note${todayHealthLogs.length === 1 ? '' : 's'} today.`;
    } else if (
      normalized.includes('help') ||
      normalized.includes('what can you do')
    ) {
      text = `I can summarize ${childName}'s feeding, sleep, diaper, and health logs, and I can also answer general baby-care questions about routines, feeding, sleep habits, and what different milestones or behaviors may mean. For anything urgent or medical, it’s still best to check with a clinician.`;
    } else {
      text = lastUserQuestion
        ? `I can help with both ${childName}'s tracked activity and broader baby-care questions. Your latest follow-up seems broader than the app data alone, so ask it directly and I’ll give general guidance while using the logs when they’re relevant.`
        : `I can help with two kinds of questions: details from ${childName}'s tracked activity in the app, and general baby-care questions like sleep routines, feeding patterns, or what certain behaviors may mean. If you want, ask something specific and I’ll either use the logs or give general guidance.`;
    }

    return `${text} This is the fallback assistant response because the live model is unavailable right now.`;
  }

  private buildGeminiPrompt({
    childName,
    message,
    recentMessages,
    feedings,
    sleeps,
    diapers,
    healthLogs,
  }: {
    childName: string;
    message: string;
    recentMessages: ConversationMessage[];
    feedings: FeedingRow[];
    sleeps: SleepRow[];
    diapers: DiaperRow[];
    healthLogs: HealthLogRow[];
  }) {
    const todayKey = this.getLocalDayKey(new Date().toISOString());
    const todayFeedings = feedings.filter((item) =>
      this.isOnDay(item.occurred_at, todayKey),
    );
    const todayDiapers = diapers.filter((item) =>
      this.isOnDay(item.occurred_at, todayKey),
    );
    const todaySleeps = sleeps.filter(
      (item) => this.getSleepMinutesWithinDay(item, todayKey) > 0,
    );
    const todayHealthLogs = healthLogs.filter((item) =>
      this.isOnDay(item.occurred_at, todayKey),
    );
    const feedingAmountSummary = this.getFeedingAmountSummary(todayFeedings);
    const totalSleepMinutesToday = todaySleeps.reduce(
      (sum, item) => sum + this.getSleepMinutesWithinDay(item, todayKey),
      0,
    );
    const latestFeeding = feedings[0]
      ? this.describeFeeding(feedings[0])
      : 'No feeding logged yet.';
    const latestSleep = sleeps[0]
      ? this.describeSleep(sleeps[0], todayKey)
      : 'No sleep logged yet.';
    const latestDiaper = diapers[0]
      ? this.describeDiaper(diapers[0])
      : 'No diaper change logged yet.';
    const latestHealth = healthLogs[0]
      ? this.describeHealthLog(healthLogs[0])
      : 'No health note logged yet.';
    const recentFeedings = feedings
      .slice(0, 6)
      .map((item) => `- ${this.describeFeeding(item)}`)
      .join('\n');
    const recentSleeps = sleeps
      .slice(0, 6)
      .map((item) => `- ${this.describeSleep(item, todayKey)}`)
      .join('\n');
    const recentDiapers = diapers
      .slice(0, 6)
      .map((item) => `- ${this.describeDiaper(item)}`)
      .join('\n');
    const recentHealthLogs = healthLogs
      .slice(0, 6)
      .map((item) => `- ${this.describeHealthLog(item)}`)
      .join('\n');
    const conversationContext = recentMessages
      .slice(-8)
      .map(
        (entry, index) =>
          `${index + 1}. ${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.text}`,
      )
      .join('\n');

    return [
      `Child name: ${childName}`,
      `Current local date key: ${todayKey}`,
      `User question: ${message}`,
      '',
      'Recent conversation:',
      conversationContext || '- No previous conversation',
      '',
      'Today summary:',
      `- Feeding entries today: ${todayFeedings.length}`,
      `- Feeding amount summary today: ${feedingAmountSummary || 'No measurable amount recorded today.'}`,
      `- Diaper changes today: ${todayDiapers.length}`,
      `- Sleep sessions touching today: ${todaySleeps.length}`,
      `- Sleep duration today: ${this.formatMinutes(totalSleepMinutesToday)}`,
      `- Health notes today: ${todayHealthLogs.length}`,
      '',
      'Latest activity:',
      `- Latest feeding: ${latestFeeding}`,
      `- Latest sleep: ${latestSleep}`,
      `- Latest diaper: ${latestDiaper}`,
      `- Latest health note: ${latestHealth}`,
      '',
      'Recent feedings:',
      recentFeedings || '- None',
      '',
      'Recent sleeps:',
      recentSleeps || '- None',
      '',
      'Recent diapers:',
      recentDiapers || '- None',
      '',
      'Recent health logs:',
      recentHealthLogs || '- None',
      '',
      'Instruction:',
      'Use the recent conversation to resolve follow-up questions and pronouns like "that", "it", or "what about yesterday".',
      'If the question is about tracked activity, use the log context directly and say what the app data shows.',
      'If the question goes beyond the logs, answer using general baby-care knowledge and clearly separate that from log-based observations.',
      'Do not claim the logs prove something they do not prove.',
      'If the question is about health, include a brief safety note to consult a clinician when appropriate.',
    ].join('\n');
  }

  private getFeedingAmountSummary(feedings: FeedingRow[]) {
    const totals = new Map<string, number>();

    feedings.forEach((feeding) => {
      const amount =
        typeof feeding.amount === 'number'
          ? feeding.amount
          : typeof feeding.amount === 'string'
            ? Number(feeding.amount)
            : null;

      if (!amount || amount <= 0 || !feeding.unit) {
        return;
      }

      totals.set(feeding.unit, (totals.get(feeding.unit) ?? 0) + amount);
    });

    return Array.from(totals.entries())
      .map(([unit, total]) => `${this.formatNumber(total)} ${unit}`)
      .join(', ');
  }

  private describeFeeding(feeding: FeedingRow) {
    const amount =
      typeof feeding.amount === 'number'
        ? feeding.amount
        : typeof feeding.amount === 'string'
          ? Number(feeding.amount)
          : null;
    const amountText =
      amount && feeding.unit ? ` for ${this.formatNumber(amount)} ${feeding.unit}` : '';
    const notesText = feeding.notes ? ` Notes: ${feeding.notes}` : '';

    return `${feeding.type} at ${this.formatTimestamp(feeding.occurred_at)}${amountText}.${notesText}`.trim();
  }

  private describeSleep(sleep: SleepRow, dayKey: string) {
    const duration = this.getSleepMinutesWithinDay(sleep, dayKey);
    const endText = sleep.end_time
      ? `ended ${this.formatTimestamp(sleep.end_time)}`
      : 'still in progress';
    const notesText = sleep.notes ? ` Notes: ${sleep.notes}` : '';

    return `started ${this.formatTimestamp(sleep.start_time)}, ${endText}, ${this.formatMinutes(duration)} touching today.${notesText}`.trim();
  }

  private describeDiaper(diaper: DiaperRow) {
    const notesText = diaper.notes ? ` Notes: ${diaper.notes}` : '';

    return `${diaper.type} at ${this.formatTimestamp(diaper.occurred_at)}.${notesText}`.trim();
  }

  private describeHealthLog(item: HealthLogRow) {
    const notesText = item.notes ? ` Notes: ${item.notes}` : '';

    return `${item.title} (${item.type}) at ${this.formatTimestamp(item.occurred_at)}.${notesText}`.trim();
  }

  private getLocalDayKey(value?: string) {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private isOnDay(value: string, dayKey: string) {
    return this.getLocalDayKey(value) === dayKey;
  }

  private getDayBounds(dayKey: string) {
    const [year, month, day] = dayKey.split('-').map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

    return { start, end };
  }

  private getSleepMinutesWithinDay(log: SleepRow, dayKey: string) {
    const start = new Date(log.start_time);
    const end = new Date(log.end_time ?? new Date().toISOString());

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return 0;
    }

    const bounds = this.getDayBounds(dayKey);
    const overlapStart = Math.max(start.getTime(), bounds.start.getTime());
    const overlapEnd = Math.min(end.getTime(), bounds.end.getTime());

    if (overlapEnd <= overlapStart) {
      return 0;
    }

    return Math.round((overlapEnd - overlapStart) / 60000);
  }

  private formatTimestamp(value?: string) {
    if (!value) {
      return 'not logged yet';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'not available';
    }

    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private formatMinutes(totalMinutes: number) {
    if (totalMinutes <= 0) {
      return '0m';
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }

  private formatNumber(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
}
