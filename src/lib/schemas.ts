import { z } from 'zod';

export const debtSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  creditor: z.string().min(1, 'Creditor is required'),
  amount: z.number().positive('Amount must be a positive number'),
  currency: z.enum(['USD', 'TRY', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']),
  due_date: z.string().nullable(),
  status: z.enum(['pending', 'paid']),
  type: z.enum(['short', 'long']),
});

export type DebtFormData = z.infer<typeof debtSchema>;

export const assetSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    amount: z.number().positive('Amount must be a positive number'),
    type: z.enum(['gold', 'silver', 'crypto']),
});

export type AssetFormData = z.infer<typeof assetSchema>;
