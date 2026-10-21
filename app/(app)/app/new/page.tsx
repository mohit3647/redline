import type { Metadata } from 'next';
import { UploadFlow } from '../../../../src/components/upload-flow';
import { isSupabaseConfigured } from '../../../../src/lib/supabase/config';

export const metadata: Metadata = { title: 'New agreement - Redline' };
export const dynamic = 'force-dynamic';

export default function NewDocument() {
  return <UploadFlow configured={isSupabaseConfigured()} />;
}
