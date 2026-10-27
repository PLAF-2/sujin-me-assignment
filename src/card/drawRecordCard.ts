import { fragments, type FragmentId } from '../data/fragments';

/** Everything the card shows. Built by the caller from the ending state; the card itself knows no app state. */
export type CardData = {
  code: string;
  /** e.g. "1 OF 20,160", or null when nothing was deleted. */
  odds: string | null;
  date: string;
  order: FragmentId[];
  returned: FragmentId | null;
  /** One entry per fragment, in field order: a sentence, or a blank as long as the deleted one. */
  prose: ({ kind: 'sentence'; text: string; returned?: boolean } | { kind: 'gap'; length: number })[];
  finalLine: string;
};

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

const M = 80; // outer margin
const MAP = { top: 150, height: 470 };
const COLORS = {
  bg: '#0a0a0a',
  surface: '#141414',
  line: '#2a2a2a',
  lineStrong: '#444',
  text1: '#f2f2f2',
  text2: '#c4c4c4',
  text3: '#969696',
  text4: '#808080',
};
const SERIF = '"Noto Serif KR", serif';
const SANS = '"Pretendard Variable", Pretendard, sans-serif';
const MONO = 'ui-monospace, "Cascadia Mono", Consolas, monospace';

/** Web fonts are split by unicode range; load exactly the glyphs the card will draw before drawing. */
export async function loadCardFonts(data: CardData) {
  const text = [
    '존재하지 않는 나를 삭제하는 법 지금의 나',
    data.finalLine,
    ...data.prose.map((p) => (p.kind === 'sentence' ? p.text : '')),
    ...fragments.map((f) => f.title),
  ].join(' ');
  await Promise.all([
    document.fonts.load(`300 32px ${SERIF}`, text),
    document.fonts.load(`400 20px ${SANS}`, text),
  ]);
}

export function drawRecordCard(canvas: HTMLCanvasElement, data: CardData) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  const width = CARD_WIDTH - M * 2;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.textBaseline = 'alphabetic';

  // Header
  ctx.font = `18px ${MONO}`;
  ctx.fillStyle = COLORS.text3;
  ctx.textAlign = 'left';
  ctx.fillText('ARCHIVE 000 / SELF-DELETION', M, 96);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.text1;
  ctx.fillText(data.code, CARD_WIDTH - M, 96);
  ctx.textAlign = 'left';

  drawMap(ctx, data, width);

  // "지금의 나"
  let y = MAP.top + MAP.height + 80;
  ctx.font = `300 30px ${SERIF}`;
  ctx.fillStyle = COLORS.text2;
  ctx.fillText('지금의 나', M, y);
  y += 26;
  y = drawProse(ctx, data.prose, M, y, width, CARD_HEIGHT - 250);

  // Final line, anchored above the footer
  ctx.font = `300 26px ${SERIF}`;
  const finalLines = wrapWords(ctx, data.finalLine, width);
  let fy = CARD_HEIGHT - 150 - (finalLines.length - 1) * 42;
  ctx.fillStyle = COLORS.text1;
  for (const line of finalLines) {
    ctx.fillText(line, M, fy);
    fy += 42;
  }

  // Footer
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, CARD_HEIGHT - 100);
  ctx.lineTo(CARD_WIDTH - M, CARD_HEIGHT - 100);
  ctx.stroke();
  ctx.font = `300 22px ${SERIF}`;
  ctx.fillStyle = COLORS.text2;
  ctx.fillText('존재하지 않는 나를 삭제하는 법', M, CARD_HEIGHT - 58);
  ctx.font = `16px ${MONO}`;
  ctx.fillStyle = COLORS.text3;
  ctx.textAlign = 'right';
  ctx.fillText([data.odds, data.date].filter(Boolean).join('  ·  '), CARD_WIDTH - M, CARD_HEIGHT - 58);
  ctx.textAlign = 'left';
}

function nodeRect(index: number, width: number) {
  const { x, y } = fragments[index].layout;
  return {
    x: M + (x / 100) * width,
    y: MAP.top + ((y * 1.3 + 4) / 100) * MAP.height,
    w: 0.19 * width,
    h: 0.19 * MAP.height,
  };
}

function drawMap(ctx: CanvasRenderingContext2D, data: CardData, width: number) {
  ctx.fillStyle = COLORS.surface;
  ctx.fillRect(M, MAP.top, width, MAP.height);
  const deleted = new Set(data.order);
  const centers = new Map<FragmentId, { x: number; y: number }>();

  fragments.forEach((f, i) => {
    const r = nodeRect(i, width);
    centers.set(f.id, { x: r.x + r.w / 2, y: r.y + r.h / 2 });
    const isReturned = f.id === data.returned;
    const isDeleted = deleted.has(f.id) && !isReturned;

    if (isDeleted || isReturned) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isReturned ? COLORS.text3 : COLORS.lineStrong;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
      ctx.setLineDash([]);
    }
    ctx.font = `14px ${MONO}`;
    ctx.fillStyle = isDeleted ? COLORS.text4 : COLORS.text2;
    ctx.fillText(`${isDeleted ? '× ' : isReturned ? '↺ ' : ''}${f.archiveNo}`, r.x + 12, r.y + 26);
    if (!isDeleted) {
      // Up to two lines; only an unusually long title would be shortened.
      ctx.font = `300 17px ${SERIF}`;
      ctx.fillStyle = isReturned ? COLORS.text2 : COLORS.text1;
      const lines = wrapWords(ctx, f.title, r.w - 20);
      const shown = lines.length > 2 ? [lines[0], fitText(ctx, lines.slice(1).join(' '), r.w - 20)] : lines;
      shown.forEach((line, n) => ctx.fillText(line, r.x + 12, r.y + 52 + n * 24));
    }
  });

  // The shape of the void, in deletion order
  const points = data.order.flatMap((id) => centers.get(id) ?? []);
  if (points.length > 1) {
    ctx.strokeStyle = COLORS.text1;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  }
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bg;
    ctx.fill();
    ctx.strokeStyle = COLORS.text1;
    ctx.lineWidth = 1.25;
    ctx.stroke();
    ctx.font = `13px ${MONO}`;
    ctx.fillStyle = COLORS.text1;
    ctx.fillText(String(i + 1).padStart(2, '0'), p.x + 9, p.y - 9);
  });
}

/**
 * Lays sentences and blanks out as one flowing paragraph. Shrinks the type until it fits above `maxY`.
 * Returns the y below the last line.
 */
function drawProse(ctx: CanvasRenderingContext2D, prose: CardData['prose'], x: number, top: number, width: number, maxY: number) {
  for (let size = 26; size >= 16; size -= 2) {
    const lineHeight = Math.round(size * 1.85);
    const lines = layoutProse(ctx, prose, width, size);
    if (top + lines.length * lineHeight <= maxY || size === 16) {
      let y = top + lineHeight;
      for (const line of lines) {
        for (const token of line) {
          if (token.kind === 'gap') {
            ctx.setLineDash([3, 4]);
            ctx.strokeStyle = COLORS.lineStrong;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + token.x, y + 4);
            ctx.lineTo(x + token.x + token.w, y + 4);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            ctx.font = `300 ${size}px ${SERIF}`;
            ctx.fillStyle = token.returned ? COLORS.text2 : COLORS.text1;
            ctx.fillText(token.text, x + token.x, y);
          }
        }
        y += lineHeight;
      }
      return y;
    }
  }
  return top;
}

type Placed = { kind: 'word'; text: string; x: number; returned?: boolean } | { kind: 'gap'; x: number; w: number };

function layoutProse(ctx: CanvasRenderingContext2D, prose: CardData['prose'], width: number, size: number): Placed[][] {
  ctx.font = `300 ${size}px ${SERIF}`;
  const space = ctx.measureText(' ').width;
  const lines: Placed[][] = [[]];
  let cursor = 0;
  const place = (w: number, make: (x: number) => Placed) => {
    if (cursor > 0 && cursor + w > width) {
      lines.push([]);
      cursor = 0;
    }
    lines[lines.length - 1].push(make(cursor));
    cursor += w + space;
  };
  for (const part of prose) {
    if (part.kind === 'gap') {
      const w = Math.min(part.length * size * 0.95, width);
      place(w, (x) => ({ kind: 'gap', x, w }));
    } else {
      // A returned sentence carries the same ↺ mark it has on the page.
      const words = part.returned ? ['↺', ...part.text.split(' ')] : part.text.split(' ');
      for (const word of words) {
        place(ctx.measureText(word).width, (x) => ({ kind: 'word', text: word, x, returned: part.returned }));
      }
    }
  }
  return lines;
}

function wrapWords(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  if (ctx.measureText(text).width <= width) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > width) t = t.slice(0, -1);
  return `${t}…`;
}
