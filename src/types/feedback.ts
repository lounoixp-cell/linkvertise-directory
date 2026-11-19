import { z } from 'zod';

export interface FeedbackRequestPayload {
  message: string;
  email?: string;
  name?: string;
  pageUrl: string;
  hp_val?: string;
}

export interface FeedbackResponsePayload {
  success: boolean;
  message?: string;
  error?: string;
}

export type FeedbackUIStatus = 'idle' | 'submitting' | 'success' | 'error';

export const CRLF_REGEX = /[\r\n]/;

export const feedbackRequestSchema = z.object({
  message: z
    .string('Message is required and cannot be empty.')
    .max(2000, 'Message exceeds maximum length of 2000 characters.')
    .refine((val) => val.trim().length > 0, {
      message: 'Message is required and cannot be empty.',
    }),
  email: z
    .string()
    .max(254, 'Email must be 254 characters or less.')
    .refine((val) => !CRLF_REGEX.test(val), {
      message: 'Invalid characters in email address (CRLF prohibited).',
    })
    .refine(
      (val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      {
        message: 'Invalid email address format.',
      }
    )
    .optional()
    .or(z.literal('')),
  name: z
    .string()
    .max(100, 'Name must be 100 characters or less.')
    .refine((val) => !CRLF_REGEX.test(val), {
      message: 'Invalid characters in name (CRLF prohibited).',
    })
    .optional()
    .or(z.literal('')),
  pageUrl: z
    .string('Context pageUrl is required.')
    .min(1, 'Context pageUrl is required.'),
  hp_val: z.string().optional().or(z.literal('')),
});

export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
export const feedbackPayloadSchema = feedbackRequestSchema;
