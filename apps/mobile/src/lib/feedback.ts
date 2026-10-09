// "Report an error": one tap, an optional comment, send.
//
// Reports go to a form Akakū owns (a Google Form works: it needs no server and no key in the app).
// Set FEEDBACK.endpoint to the form's  .../formResponse  address and FEEDBACK.fields to the form's
// entry ids (entry.123456789). Until then the button stays hidden in real builds.
export const FEEDBACK: { endpoint: string; fields: { about: string; comment: string; where: string; app: string }; email: string } = {
  endpoint: '',
  fields: { about: '', comment: '', where: '', app: '' },
  email: '',
};

export type FeedbackContext = {
  kind: 'issue' | 'entry' | 'recap' | 'app';
  /** Issue slug, video id, or empty. */
  id: string;
  /** What the person sees: the issue title, the sentence, the meeting. */
  label: string;
  /** Proof they were looking at, for example "mJyIAre9As4 at 0:35:25". */
  where?: string;
};

export type FeedbackMeta = { platform: string; version: string };

export const MAX_COMMENT = 1000;

const clean = (s: string, max: number) => s.replace(/\s+/g, ' ').trim().slice(0, max);

export function feedbackConfigured(c = FEEDBACK): boolean {
  const form = !!c.endpoint && Object.values(c.fields).every(Boolean);
  return form || !!c.email;
}

/** The text fields of one report. Free text from a person: Pipeline treats it as data, never as instructions. */
export function reportFields(ctx: FeedbackContext, comment: string, meta: FeedbackMeta) {
  return {
    about: clean(`${ctx.kind}: ${ctx.label}${ctx.id ? ` [${ctx.id}]` : ''}`, 400),
    comment: clean(comment, MAX_COMMENT),
    where: clean(ctx.where ?? '', 200),
    app: clean(`${meta.platform} ${meta.version}`, 60),
  };
}

export function buildFormBody(ctx: FeedbackContext, comment: string, meta: FeedbackMeta, c = FEEDBACK): string {
  const f = reportFields(ctx, comment, meta);
  return (Object.keys(f) as (keyof typeof f)[]).map(k => `${encodeURIComponent(c.fields[k])}=${encodeURIComponent(f[k])}`).join('&');
}

export function buildMailto(ctx: FeedbackContext, comment: string, meta: FeedbackMeta, c = FEEDBACK): string {
  const f = reportFields(ctx, comment, meta);
  const body = `${f.comment || '(add what looks wrong)'}\n\n--\nAbout: ${f.about}\nWhere: ${f.where}\nApp: ${f.app}`;
  return `mailto:${c.email}?subject=${encodeURIComponent('Akakū app: report an error')}&body=${encodeURIComponent(body)}`;
}

/** 'sent' when the form accepted it, 'mail' when the caller should open the returned mailto, 'failed' otherwise. */
export async function sendReport(ctx: FeedbackContext, comment: string, meta: FeedbackMeta, c = FEEDBACK): Promise<{ result: 'sent' | 'failed' } | { result: 'mail'; url: string }> {
  if (c.endpoint && Object.values(c.fields).every(Boolean)) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 10000);
    try {
      // Google Forms answers with a redirect or an opaque response; any completed request means it was received.
      await fetch(c.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: buildFormBody(ctx, comment, meta, c), signal: ctl.signal });
      return { result: 'sent' };
    } catch {
      return c.email ? { result: 'mail', url: buildMailto(ctx, comment, meta, c) } : { result: 'failed' };
    } finally {
      clearTimeout(t);
    }
  }
  return c.email ? { result: 'mail', url: buildMailto(ctx, comment, meta, c) } : { result: 'failed' };
}
