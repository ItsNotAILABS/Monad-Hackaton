import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface ComponentChipProps {
  type: string;
  props?: Record<string, unknown>;
  index: number;
}

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface ComponentMeta {
  icon: FeatherIconName;
  color: string;
  label: string;
  description: string;
}

const COMPONENT_META: Record<string, ComponentMeta> = {
  'wallet-connect': { icon: 'link', color: '#836EF9', label: 'Wallet Connect', description: 'Connect Web3 wallet' },
  'token-swap': { icon: 'repeat', color: '#22C55E', label: 'Token Swap', description: 'MON ↔ USDC swap' },
  'nft-gallery': { icon: 'image', color: '#F59E0B', label: 'NFT Gallery', description: 'Browse NFT collection' },
  'dao-vote': { icon: 'check-square', color: '#6366F1', label: 'DAO Vote', description: 'Governance proposals' },
  'stats-bar': { icon: 'bar-chart-2', color: '#3B82F6', label: 'Stats Bar', description: 'Chain statistics' },
  'price-chart': { icon: 'trending-up', color: '#10B981', label: 'Price Chart', description: 'Token price data' },
  'token-balance': { icon: 'dollar-sign', color: '#F97316', label: 'Token Balance', description: 'Wallet balance' },
  'gas-price': { icon: 'zap', color: '#EF4444', label: 'Gas Price', description: 'Live gas cost' },
  'recent-transactions': { icon: 'clock', color: '#8B5CF6', label: 'Transactions', description: 'Recent txn feed' },
  'hero-section': { icon: 'home', color: '#EC4899', label: 'Hero Section', description: 'Landing header' },
  'button': { icon: 'square', color: '#64748B', label: 'Button', description: 'Call-to-action button' },
  'text-block': { icon: 'type', color: '#94A3B8', label: 'Text Block', description: 'Paragraph content' },
  'image-block': { icon: 'image', color: '#F59E0B', label: 'Image Block', description: 'Embedded image' },
};

const DEFAULT_META: ComponentMeta = {
  icon: 'box',
  color: '#64748B',
  label: 'Component',
  description: 'UI component',
};

export function ComponentChip({ type, props = {}, index }: ComponentChipProps) {
  const colors = useColors();
  const meta = COMPONENT_META[type] ?? DEFAULT_META;

  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      backgroundColor: `${meta.color}1A`,
    },
    textContainer: {
      flex: 1,
    },
    label: {
      fontSize: 15,
      fontFamily: 'Inter_500Medium',
      color: colors.foreground,
      marginBottom: 2,
    },
    description: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    indexBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    indexText: {
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
  });

  return (
    <View style={styles.row}>
      <View style={styles.iconContainer}>
        <Feather name={meta.icon} size={16} color={meta.color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{meta.label}</Text>
        {props?.title ? (
          <Text style={styles.description} numberOfLines={1}>
            {String(props.title)}
          </Text>
        ) : (
          <Text style={styles.description}>{meta.description}</Text>
        )}
      </View>
      <View style={styles.indexBadge}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
    </View>
  );
}
