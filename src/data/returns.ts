import type { FragmentId } from './fragments';

/**
 * The one-time return at the end. A deleted fragment can come back, but never as it was:
 * this is the sentence it returns with, in place of its original summary.
 */
export const returnedSummary: Record<FragmentId, string> = {
  recognition: '끄덕여 줄 사람을 기다리지 않고도 끝나 버린 문장. 마침표가 어색하다.',
  solitude: '문을 열어 둔 채로도 들리는 소리. 다만 전보다 작다.',
  avoidFailure: '계산은 그대로인데, 답을 적는 손이 예전만큼 망설이지 않는다.',
  expectations: '눈금은 돌아왔지만, 재어 볼 키가 조금 달라져 있다.',
  persistence: '다시 실을 쥐었지만, 한 번 놓아 본 손은 쥐는 법이 다르다.',
  gaze: '다시 켜진 조명. 꺼져 있던 동안의 어둠을 기억하는 빛.',
  understandAll: '다시 열쇠를 찾지만, 열지 않아도 되는 문이 있다는 것을 안다.',
  explainNothing: '돌아와서야 처음으로, 왜 침묵했는지 설명하고 싶어진 문장.',
};
