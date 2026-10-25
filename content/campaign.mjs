// The producer's politics hold (Oct 22-24): it covers CAMPAIGNING only. Charter amendments on the ballot, ballot measures,
// election administration and board nominations are public government business and are published like any other.
// This is the same rule Pipeline applies on its side (campaign-hold.js); keep the two in step.
const CAMPAIGN_RE = new RegExp([
  String.raw`\bcandidacy\b`,
  String.raw`\bendors\w* [^.]{0,40}\b(?:candidates?|for mayor|for council|campaigns?)\b`,
  String.raw`\b(?:candidates?|campaigns?|mayoral|council candidates?)[^.]{0,30}\bendors\w*`,
  String.raw`\bcampaign(?:ing|ed)\b`,
  String.raw`\b(?:political|election|electoral|mayoral|council|reelection|re-election) campaigns?\b`,
  String.raw`\bcampaign (?:finance|financing|contributions?|donations?|spending|funds?|signs?|trail|events?|rall(?:y|ies)|ads?|advertis\w*|committees?|season|manager|promises?|platform)\b`,
  String.raw`\bre-?elect(?:ion|ed|ing)?\b`,
  String.raw`\bvote for (?:me|him|her|them)\b`,
  String.raw`\b(?:running|ran|run|runs) for (?:mayor|council|office|the council|county council|re-?election|governor|the (?:state )?(?:house|senate)|state (?:house|senate)|congress)\b`,
  String.raw`\b(?:mayoral|council|county council|legislative|gubernatorial|congressional|political) (?:candidates?|race|races|forums?|debates?)\b`,
  String.raw`\bcandidates? (?:for|running for|seeking) (?:mayor|council|office|the council|county council|governor|the (?:state )?(?:house|senate)|state (?:house|senate)|congress|seat)\b`,
  String.raw`\bcandidates? (?:forums?|debates?|nights?|statements?|questionnaires?)\b`,
].join('|'), 'i');

// A board or commission choosing its own chair or officers is how it runs, not a campaign.
const OFFICER_ELECTION = /\b(?:re-?elect\w*|elect(?:ed|ion|s)?|nominat\w*)\b[^.]{0,50}\b(?:chair|chairs|vice[- ]chair|chairperson|officers?|president|secretary|treasurer)\b|\b(?:chair|vice[- ]chair|chairperson|officers?)\b[^.]{0,30}\b(?:re-?elect\w*|elect(?:ed|ion)?)\b/i;

/** The campaign wording found in a text, or null. */
export function campaignHit(text) {
  const s = String(text ?? '');
  if (!CAMPAIGN_RE.test(s)) return null;
  const other = s.replace(new RegExp(OFFICER_ELECTION.source, 'gi'), ' ');
  const m = CAMPAIGN_RE.exec(other);
  return m ? m[0] : null;
}
