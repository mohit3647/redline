'use server';

import type { Analysis, ContractValue } from '../analyse/types';
import { createClient } from '../supabase/server';
import { isContractValue, isDocumentId, verifyAnalysis } from './logic';

export type SaveAnalysisResult =
  | { status: 'saved' }
  | { status: 'unconfigured' }
  | { status: 'signed-out' }
  | { status: 'refused'; message: string }
  | { status: 'error'; message: string };

/**
 * Stores an analysis against a document the signer owns. The client sends the result, so it is
 * checked here against the stored document text: a result with any quote that is not an exact
 * substring is refused and nothing is written.
 */
export async function saveAnalysis(documentId: string, analysis: Analysis, contractValue?: ContractValue): Promise<SaveAnalysisResult> {
  if (!isDocumentId(String(documentId))) return { status: 'refused', message: 'That document could not be found.' };
  if (contractValue !== undefined && !isContractValue(contractValue)) {
    return { status: 'refused', message: 'The contract value is not valid, so nothing was saved.' };
  }
  const supabase = await createClient();
  if (!supabase) return { status: 'unconfigured' };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: 'signed-out' };

  const { data: doc, error: docError } = await supabase.from('documents').select('text').eq('id', documentId).maybeSingle();
  if (docError) return { status: 'error', message: 'The analysis could not be saved. Try again in a moment.' };
  if (!doc) return { status: 'refused', message: 'That document could not be found.' };

  const verdict = verifyAnalysis(String(doc.text), analysis);
  if (!verdict.ok) {
    return { status: 'refused', message: `The analysis was not saved. ${verdict.reason} Redline does not store a quotation it cannot show.` };
  }

  const { error } = await supabase.from('analyses').insert({
    document_id: documentId,
    result: analysis,
    contract_value: contractValue ?? null,
  });
  if (error) return { status: 'error', message: 'The analysis could not be saved. Try again in a moment.' };
  return { status: 'saved' };
}
