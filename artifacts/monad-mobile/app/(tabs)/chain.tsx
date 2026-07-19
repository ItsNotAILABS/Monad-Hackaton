import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';

interface GasData {
  blockNumber: number | null;
  gasPriceWei: number | null;
  gasPriceGwei: number | null;
}

async function fetchChainData(): Promise<GasData> {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const res = await fetch(`https://${domain}/api/chain/gas`);
  if (!res.ok) throw new Error('RPC timeout');
  return res.json();
}

const RPC_ENDPOINTS = [
  'rpc.monad.xyz',
  'rpc1.monad.xyz',
  'rpc2.monad.xyz',
  'rpc3.monad.xyz',
];

const NETWORK_STATS = [
  { label: 'Chain ID', value: '143', icon: 'hash' as const },
  { label: 'TPS', value: '10,000+', icon: 'zap' as const },
  { label: 'Block Time', value: '400ms', icon: 'clock' as const },
  { label: 'Finality', value: '800ms', icon: 'check-circle' as const },
  { label: 'EVM Fork', value: 'Fusaka', icon: 'cpu' as const },
  { label: 'MON Token', value: '0x3bd3…33A', icon: 'circle' as const },
];

function StatCard({ label, value, icon, colors }: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  colors: ReturnType<typeof useColors>;
}) {
  const styles = StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: colors.radius + 2,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      minWidth: 140,
    },
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    label: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    value: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.iconRow}>
        <Feather name={icon} size={13} color={colors.primary} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function ChainScreen() {
  const colors = useColors();
  const prevBlock = useRef<number | null>(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  const { data, isLoading, isError, refetch } = useQuery<GasData>({
    queryKey: ['chain-gas'],
    queryFn: fetchChainData,
    refetchInterval: 4000,
    retry: 1,
  });

  // Flash animation on new block
  useEffect(() => {
    if (data?.blockNumber && data.blockNumber !== prevBlock.current) {
      prevBlock.current = data.blockNumber;
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]).start();
    }
  }, [data?.blockNumber, flashAnim]);

  const flashColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.card, '#22C55E22'],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: Platform.OS === 'web' ? 100 : 40,
      ...(Platform.OS === 'web' ? { paddingTop: 83 } : {}),
    },
    pageTitle: {
      fontSize: 28,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      marginBottom: 4,
    },
    pageSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginBottom: 20,
    },
    blockCard: {
      borderRadius: colors.radius + 4,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
    },
    blockLabel: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    blockNumber: {
      fontSize: 40,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      letterSpacing: -1,
    },
    blockSub: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 10,
      marginTop: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    gasCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 2,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    gasIconBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: 'rgba(239,68,68,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gasLabel: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginBottom: 2,
    },
    gasValue: {
      fontSize: 22,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    gasUnit: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    rpcCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 2,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 16,
    },
    rpcRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    rpcRowLast: {
      borderBottomWidth: 0,
    },
    rpcText: {
      flex: 1,
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      fontVariant: ['tabular-nums'],
    },
    rpcStatus: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#22C55E',
    },
    offlineContainer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    offlineText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginBottom: 12,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    retryText: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: '#FFFFFF',
    },
  });

  const blockDisplay = isLoading
    ? '...'
    : isError
    ? 'offline'
    : data?.blockNumber != null
    ? data.blockNumber.toLocaleString()
    : '—';

  const gasDisplay = isLoading
    ? '—'
    : isError
    ? '—'
    : data?.gasPriceGwei != null
    ? data.gasPriceGwei.toFixed(2)
    : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Monad Chain</Text>
      <Text style={styles.pageSubtitle}>Live network stats · Chain ID 143</Text>

      {/* Live block number */}
      <Animated.View style={[styles.blockCard, { backgroundColor: flashColor }]}>
        <Text style={styles.blockLabel}>Latest Block</Text>
        <Text style={styles.blockNumber}>{blockDisplay}</Text>
        <Text style={styles.blockSub}>Updates every 400ms · Monad Testnet</Text>
      </Animated.View>

      {/* Gas price */}
      <Text style={styles.sectionTitle}>Gas Price</Text>
      <View style={styles.gasCard}>
        <View style={styles.gasIconBox}>
          <Feather name="zap" size={18} color="#EF4444" />
        </View>
        <View>
          <Text style={styles.gasLabel}>Current Gas Price</Text>
          <Text style={styles.gasValue}>
            {gasDisplay} <Text style={styles.gasUnit}>Gwei</Text>
          </Text>
        </View>
      </View>

      {/* Network stats */}
      <Text style={styles.sectionTitle}>Network Stats</Text>
      <View style={styles.statsGrid}>
        {NETWORK_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} colors={colors} />
        ))}
      </View>

      {/* RPC endpoints */}
      <Text style={styles.sectionTitle}>RPC Endpoints</Text>
      <View style={styles.rpcCard}>
        {RPC_ENDPOINTS.map((rpc, i) => (
          <View
            key={rpc}
            style={[styles.rpcRow, i === RPC_ENDPOINTS.length - 1 && styles.rpcRowLast]}
          >
            <View style={styles.rpcStatus} />
            <Text style={styles.rpcText}>{rpc}</Text>
            <Feather name="external-link" size={13} color={colors.mutedForeground} />
          </View>
        ))}
      </View>

      {isError && (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>Could not reach Monad RPC</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Feather name="refresh-cw" size={13} color="#FFFFFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
