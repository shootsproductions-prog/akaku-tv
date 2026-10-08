import { View } from 'react-native';

import { isHeatingUp, whyRanked, type CatalogIssue } from '../data/catalog.ts';
import { useApp } from '../state/AppState';
import { useCatalog } from '../state/Catalog';
import { BLUE, BLUE_WASH } from '../theme';
import { Icon } from './Icon';
import { ICON } from './icons';
import { Txt } from './Txt';
import { Press, Tag } from './ui';

/** Shown wherever sample issues appear, so they are never mistaken for real ones. */
export function SampleTag() {
  const { sample } = useCatalog();
  return sample ? <Tag label="Sample data" tone="wash" /> : null;
}

export function IssueTags({ issue }: { issue: CatalogIssue }) {
  const heating = issue.status !== 'resolved' && isHeatingUp(issue.signals);
  if (!heating && issue.status === 'active') return null;
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {heating ? <Tag label="Heating up" tone="blue" /> : null}
      {issue.status === 'quiet' ? <Tag label="Quiet lately" tone="wash" /> : null}
      {issue.status === 'resolved' ? <Tag label="Resolved" tone="wash" /> : null}
    </View>
  );
}

export function FollowToggle({ slug, compact }: { slug: string; compact?: boolean }) {
  const { colors } = useApp();
  const { isFollowing, toggle } = useCatalog();
  const on = isFollowing(slug);
  return (
    <Press
      onPress={() => toggle(slug)}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={on ? 'Following' : 'Follow'}
      style={{
        height: 36,
        minWidth: compact ? 36 : undefined,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: compact ? 0 : 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: on ? BLUE : colors.border,
        backgroundColor: on ? BLUE : 'transparent',
      }}
    >
      <Icon d={ICON.bell} size={15} color={on ? '#fff' : colors.text} strokeWidth={2.2} />
      {compact ? null : <Txt style={{ fontSize: 13, fontWeight: '700', color: on ? '#fff' : colors.text }}>{on ? 'Following' : 'Follow'}</Txt>}
    </Press>
  );
}

/** One issue in a list: title, why it ranks where it does, and a follow switch. */
export function IssueRow({ issue, onOpen }: { issue: CatalogIssue; onOpen?: () => void }) {
  const { colors } = useApp();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Press onPress={onOpen} disabled={!onOpen} style={{ flex: 1, minWidth: 0, gap: 3 }} accessibilityRole={onOpen ? 'button' : undefined}>
        <Txt style={{ fontSize: 16, fontWeight: '700', lineHeight: 20 }}>{issue.title}</Txt>
        <Txt style={{ fontSize: 13, lineHeight: 18, color: colors.mist }}>{whyRanked(issue)}</Txt>
        <IssueTags issue={issue} />
      </Press>
      <FollowToggle slug={issue.slug} />
    </View>
  );
}

/** The whole pool, ranked. Used by the welcome sheet and the follow sheet. */
export function IssuePool({ onOpen }: { onOpen?: (slug: string) => void }) {
  const { catalog } = useCatalog();
  return (
    <View>
      {(catalog?.list ?? []).map(i => (
        <IssueRow key={i.slug} issue={i} onOpen={onOpen ? () => onOpen(i.slug) : undefined} />
      ))}
    </View>
  );
}

export { BLUE_WASH, BLUE };
