/**
 * ONE TWO — OneTwo Assistant server contract
 * Server-side only. Do not import this module from Client Components.
 */

export const ONETWO_ASSISTANT_NAME = 'OneTwo Assistant';

export const INSUFFICIENT_DATA_RESPONSE =
  'Não encontrei dados suficientes para responder com segurança.';

export type OneTwoAssistantFeature =
  | 'chat'
  | 'fill'
  | 'summarize'
  | 'voice'
  | 'analysis';

export type OneTwoAssistantResult = 'success' | 'insufficient_data' | 'error';

export function createAssistantPlaceholderResponse(feature: OneTwoAssistantFeature) {
  return {
    assistant: ONETWO_ASSISTANT_NAME,
    feature,
    status: 'planned',
    message: INSUFFICIENT_DATA_RESPONSE,
  };
}
