// Metaphorical material for the experience — not diagnoses or claims about the user.
// Order is reading order: keyboard navigation and the mobile grid follow it.

export type FragmentId =
  | 'recognition'
  | 'solitude'
  | 'avoidFailure'
  | 'expectations'
  | 'persistence'
  | 'gaze'
  | 'understandAll'
  | 'explainNothing';

export type Fragment = {
  id: FragmentId;
  archiveNo: string;
  title: string;
  summary: string;
  detail: string;
  /** Desktop placement: top-left corner in % of the field, title scale, tilt in degrees. */
  layout: { x: number; y: number; scale: number; rotate: number };
};

export const fragments: Fragment[] = [
  {
    id: 'recognition',
    archiveNo: 'F-01',
    title: '인정받고 싶은 마음',
    summary: '누군가 고개를 끄덕여 줄 때 비로소 완성되는 문장.',
    detail:
      '혼자서는 끝맺지 못하는 문장이 있다. 다른 사람의 눈빛이 마침표가 되어 줄 때까지, 이것은 조용히 기다린다. 기다림이 길어지면 문장은 조금씩 다른 사람의 말투를 닮아 간다.',
    layout: { x: 3, y: 6, scale: 1.18, rotate: -1.2 },
  },
  {
    id: 'solitude',
    archiveNo: 'F-02',
    title: '혼자 있고 싶은 마음',
    summary: '문을 닫은 방에서만 들리는 소리.',
    detail:
      '사람들 사이에서는 들리지 않는 낮은 소리가 있다. 이것은 그 소리를 듣기 위해 문을 닫는다. 도망이라고 부르기도 하고, 휴식이라고 부르기도 한다. 이름은 아직 정해지지 않았다.',
    layout: { x: 29, y: 0, scale: 0.9, rotate: 0.8 },
  },
  {
    id: 'avoidFailure',
    archiveNo: 'F-03',
    title: '실패를 피하는 습관',
    summary: '시작하지 않은 일은 실패하지 않는다는 계산.',
    detail:
      '출발선 앞에서 오래 머무르는 법을 안다. 넘어지지 않은 기록은 깨끗하다. 다만 그 기록에는 걸어간 거리도 함께 적혀 있지 않다.',
    layout: { x: 55, y: 13, scale: 1, rotate: -0.6 },
  },
  {
    id: 'expectations',
    archiveNo: 'F-04',
    title: '기대에 부응하려는 마음',
    summary: '보이지 않는 눈금에 맞춰 키를 재는 일.',
    detail:
      '누가 그어 놓았는지 모르는 선이 있다. 이것은 그 선에 닿으려 발끝을 세운다. 닿았을 때의 안도와 닿지 못했을 때의 침묵이 번갈아 쌓인다.',
    layout: { x: 79, y: 3, scale: 0.95, rotate: 1.4 },
  },
  {
    id: 'persistence',
    archiveNo: 'F-05',
    title: '쉽게 포기하지 않는 성향',
    summary: '끊어질 듯한 실을 끝까지 쥐고 있는 손.',
    detail:
      '놓아도 되는 순간을 알아보는 데 오래 걸린다. 그 느림 덕분에 끝까지 간 일들이 있고, 그 느림 때문에 너무 오래 붙든 것들도 있다. 손바닥에는 두 가지 자국이 함께 남아 있다.',
    layout: { x: 7, y: 58, scale: 0.95, rotate: 0.9 },
  },
  {
    id: 'gaze',
    archiveNo: 'F-06',
    title: '타인의 시선을 의식하는 마음',
    summary: '방 안에 늘 켜져 있는 또 하나의 조명.',
    detail:
      '아무도 보지 않을 때에도 어딘가 불이 켜져 있다. 이것은 그 빛 아래서 자세를 고친다. 그림자가 어떻게 보일지 먼저 생각하고, 그다음에 움직인다.',
    layout: { x: 32, y: 45, scale: 1.12, rotate: -1.6 },
  },
  {
    id: 'understandAll',
    archiveNo: 'F-07',
    title: '모든 것을 이해하고 싶은 욕구',
    summary: '모든 문에 맞는 열쇠를 찾으려는 손.',
    detail:
      '설명되지 않은 것은 잠긴 문처럼 느껴진다. 이것은 하나씩 열어 보려 한다. 열린 문 너머에 또 다른 문이 있다는 사실도, 언젠가는 이해할 수 있으리라 믿는다.',
    layout: { x: 58, y: 56, scale: 1.04, rotate: 0.5 },
  },
  {
    id: 'explainNothing',
    archiveNo: 'F-08',
    title: '아무것도 설명하고 싶지 않은 마음',
    summary: '번역되지 않은 채로 남고 싶은 문장.',
    detail:
      '설명하는 순간 무언가가 줄어든다고 느낀다. 이것은 말 대신 침묵을 고른다. 이해받지 못하는 것과 오해받지 않는 것 사이 어딘가에 머문다.',
    layout: { x: 80, y: 48, scale: 0.88, rotate: -0.9 },
  },
];

export const fragmentById = new Map(fragments.map((f) => [f.id, f]));
