import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface Component {
  id: string;
  type: string;
  props: Record<string, unknown>;
  order: number;
}

interface Project {
  id: number;
  name: string;
  description: string;
  components: Component[];
  status: 'draft' | 'published';
  updatedAt: string;
}

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
}

const COMPONENT_TYPE_COLORS: Record<string, string> = {
  'wallet-connect': '#836EF9',
  'token-swap': '#22C55E',
  'nft-gallery': '#F59E0B',
  'dao-vote': '#6366F1',
  'stats-bar': '#3B82F6',
  'price-chart': '#10B981',
  'token-balance': '#F97316',
  'gas-price': '#EF4444',
  'recent-transactions': '#8B5CF6',
  'hero-section': '#EC4899',
  'button': '#64748B',
  'text-block': '#94A3B8',
  'image-block': '#F59E0B',
};

const COMPONENT_LABELS: Record<string, string> = {
  'wallet-connect': 'Wallet',
  'token-swap': 'Swap',
  'nft-gallery': 'NFT',
  'dao-vote': 'DAO',
  'stats-bar': 'Stats',
  'price-chart': 'Chart',
  'token-balance': 'Balance',
  'gas-price': 'Gas',
  'recent-transactions': 'Txns',
  'hero-section': 'Hero',
  'button': 'Button',
  'text-block': 'Text',
  'image-block': 'Image',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const colors = useColors();
  const isPublished = project.status === 'published';
  const topComponents = project.components.slice(0, 4);
  const overflow = project.components.length - topComponents.length;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 4,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 16,
      marginBottom: 12,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#836EF9',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
    accentBar: {
      height: 2,
      backgroundColor: colors.primary,
      opacity: isPublished ? 1 : 0.3,
    },
    body: {
      padding: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    nameContainer: {
      flex: 1,
      marginRight: 8,
    },
    name: {
      fontSize: 17,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
      lineHeight: 22,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
      gap: 4,
    },
    statusDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: isPublished ? '#22C55E' : '#64748B',
    },
    statusText: {
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
      color: isPublished ? '#22C55E' : '#64748B',
    },
    description: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      lineHeight: 18,
      marginBottom: 12,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
      gap: 4,
    },
    chipDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    chipText: {
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    overflowChip: {
      backgroundColor: colors.muted,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    overflowText: {
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    chevron: {
      opacity: 0.5,
    },
  });

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} testID={`project-card-${project.id}`}>
      <View style={styles.card}>
        <View style={styles.accentBar} />
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {project.name}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {isPublished ? 'Live' : 'Draft'}
              </Text>
            </View>
          </View>

          {project.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {project.description}
            </Text>
          ) : null}

          {project.components.length > 0 && (
            <View style={styles.chipsRow}>
              {topComponents.map((c, i) => (
                <View key={i} style={styles.chip}>
                  <View
                    style={[
                      styles.chipDot,
                      { backgroundColor: COMPONENT_TYPE_COLORS[c.type] ?? '#64748B' },
                    ]}
                  />
                  <Text style={styles.chipText}>
                    {COMPONENT_LABELS[c.type] ?? c.type}
                  </Text>
                </View>
              ))}
              {overflow > 0 && (
                <View style={styles.overflowChip}>
                  <Text style={styles.overflowText}>+{overflow}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.meta}>
              <Feather name="clock" size={11} color={colors.mutedForeground} />
              <Text style={styles.metaText}>{timeAgo(project.updatedAt)}</Text>
            </View>
            <Feather
              name="chevron-right"
              size={16}
              color={colors.mutedForeground}
              style={styles.chevron}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
