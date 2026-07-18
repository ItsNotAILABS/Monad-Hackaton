import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  RefreshControl,
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

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    retry: 2,
    staleTime: 15_000,
  });

  const handlePress = useCallback((id: number) => {
    router.push(`/project/${id}`);
  }, [router]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingTop: 16,
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
      paddingBottom: 16,
      ...(Platform.OS === 'web' ? { paddingTop: 67 } : {}),
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
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
  });

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

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}>
          <Feather name="layers" size={24} color={colors.mutedForeground} />
        </View>
        <Text style={styles.emptyTitle}>No dApps yet</Text>
        <Text style={styles.emptySubtitle}>
          Build your first Monad dApp using the web builder, then come back to browse it here.
        </Text>
      </View>
    );
  }

  const published = data.filter(p => p.status === 'published').length;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <ProjectCard project={item} onPress={() => handlePress(item.id)} />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>My dApps</Text>
            <Text style={styles.headerSubtitle}>MonadBuilder+ — Chain ID 143</Text>
            <View style={styles.countBadge}>
              <Feather name="zap" size={12} color={colors.primary} />
              <Text style={styles.countText}>
                {data.length} project{data.length !== 1 ? 's' : ''} · {published} live
              </Text>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={data.length > 0}
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
