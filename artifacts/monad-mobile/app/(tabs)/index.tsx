import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  RefreshControl,
  TextInput,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { ProjectCard } from '@/components/ProjectCard';

interface Project {
  id: number;
  name: string;
  description: string;
  components: Array<{ id: string; type: string; props: Record<string, unknown>; order: number }>;
  status: 'draft' | 'published';
  updatedAt: string;
  createdAt: string;
}

async function fetchProjects(): Promise<Project[]> {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const res = await fetch(`https://${domain}/api/projects`);
  if (!res.ok) throw new Error('Failed to load projects');
  return res.json();
}

export default function ProjectsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'draft'>('all');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    retry: 2,
    staleTime: 15_000,
  });

  const handlePress = useCallback((id: number) => {
    router.push(`/project/${id}`);
  }, [router]);

  const handleOpenBuilder = useCallback(() => {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    Linking.openURL(`https://${domain}/`);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(p => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'live' && p.status === 'published') ||
        (filter === 'draft' && p.status === 'draft');
      return matchesSearch && matchesFilter;
    });
  }, [data, search, filter]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingBottom: Platform.OS === 'web' ? 100 : 32,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      backgroundColor: colors.background,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorText: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    retryText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: '#FFFFFF',
    },
    headerContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      ...(Platform.OS === 'web' ? { paddingTop: 67 } : {}),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    buildButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    buildButtonText: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: '#FFFFFF',
    },
    headerSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginBottom: 12,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      gap: 8,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      height: 38,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 4,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterChipText: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
    },
    countBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
    },
    countText: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: colors.primary,
    },
    noResultsContainer: {
      paddingVertical: 32,
      alignItems: 'center',
      gap: 8,
    },
    noResultsText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
    },
  });

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'live', label: 'Live' },
    { key: 'draft', label: 'Draft' },
  ];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Feather name="wifi-off" size={24} color={colors.mutedForeground} />
        </View>
        <Text style={styles.errorText}>Could not connect to server.{'\n'}Make sure the API is running.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const published = data?.filter(p => p.status === 'published').length ?? 0;

  const ListHeader = (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My dApps</Text>
        <TouchableOpacity style={styles.buildButton} onPress={handleOpenBuilder}>
          <Feather name="zap" size={13} color="#FFFFFF" />
          <Text style={styles.buildButtonText}>Build</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.headerSubtitle}>MonadBuilder+ · Chain ID 143</Text>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dApps…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && Platform.OS !== 'ios' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterChipText, { color: active ? '#FFFFFF' : colors.mutedForeground }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.countBadge}>
        <Feather name="zap" size={12} color={colors.primary} />
        <Text style={styles.countText}>
          {data?.length ?? 0} project{(data?.length ?? 0) !== 1 ? 's' : ''} · {published} live
        </Text>
      </View>
    </View>
  );

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        {ListHeader}
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Feather name="layers" size={24} color={colors.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>No dApps yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap Build to open the web builder,{'\n'}then come back to browse your dApps here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <ProjectCard project={item} onPress={() => handlePress(item.id)} />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.noResultsContainer}>
            <Feather name="search" size={24} color={colors.mutedForeground} />
            <Text style={styles.noResultsText}>No dApps match "{search}"</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}
