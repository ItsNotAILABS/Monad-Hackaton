import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { ComponentChip } from '@/components/ComponentChip';

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
  theme: { primaryColor: string; backgroundColor: string; fontFamily: string };
  status: 'draft' | 'published';
  publishedSlug: string | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchProject(id: string): Promise<Project> {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const res = await fetch(`https://${domain}/api/projects/${id}`);
  if (!res.ok) throw new Error('Project not found');
  return res.json();
}

export default function ProjectDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: project, isLoading, isError, refetch } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id!),
    enabled: !!id,
  });

  const sortedComponents = project?.components
    ? [...project.components].sort((a, b) => a.order - b.order)
    : [];

  function handleAudit() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/project/${id}/audit`);
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: Platform.OS === 'web' ? 100 : 40,
      ...(Platform.OS === 'web' ? { paddingTop: 67 } : {}),
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: 32,
    },
    heroSection: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    nameBadgeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    projectName: {
      fontSize: 24,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
      flex: 1,
      marginRight: 12,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: project?.status === 'published'
        ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: project?.status === 'published' ? '#22C55E' : '#64748B',
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: project?.status === 'published' ? '#22C55E' : '#64748B',
    },
    description: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      lineHeight: 20,
      marginBottom: 16,
    },
    metaRow: {
      flexDirection: 'row',
      gap: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaText: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    sectionHeader: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 4,
    },
    sectionTitle: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    componentsList: {
      paddingHorizontal: 20,
    },
    emptyComponents: {
      paddingVertical: 24,
      alignItems: 'center',
      gap: 8,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    auditSection: {
      margin: 20,
    },
    auditButton: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius + 2,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    auditButtonDisabled: {
      opacity: 0.5,
    },
    auditButtonText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: '#FFFFFF',
    },
    auditSubtext: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
      marginTop: 8,
    },
    publishedCard: {
      marginHorizontal: 20,
      backgroundColor: 'rgba(34,197,94,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(34,197,94,0.2)',
      borderRadius: colors.radius + 2,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    publishedText: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: '#22C55E',
      flex: 1,
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
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !project) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load project</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasComponents = sortedComponents.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Dynamic header title */}
      <Stack.Screen options={{ title: project.name }} />

      {/* Hero section */}
      <View style={styles.heroSection}>
        <View style={styles.nameBadgeRow}>
          <Text style={styles.projectName}>{project.name}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {project.status === 'published' ? 'Live' : 'Draft'}
            </Text>
          </View>
        </View>

        {project.description ? (
          <Text style={styles.description}>{project.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="layers" size={12} color={colors.mutedForeground} />
            <Text style={styles.metaText}>
              {sortedComponents.length} component{sortedComponents.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="zap" size={12} color={colors.mutedForeground} />
            <Text style={styles.metaText}>Monad · Chain ID 143</Text>
          </View>
        </View>
      </View>

      {/* Published link */}
      {project.status === 'published' && project.publishedSlug && (
        <View style={styles.publishedCard}>
          <Feather name="globe" size={14} color="#22C55E" />
          <Text style={styles.publishedText}>
            Published as /{project.publishedSlug}
          </Text>
          <Feather name="external-link" size={13} color="#22C55E" />
        </View>
      )}

      {/* Components list */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Components</Text>
      </View>
      <View style={styles.componentsList}>
        {hasComponents ? (
          sortedComponents.map((component, index) => (
            <ComponentChip
              key={component.id}
              type={component.type}
              props={component.props}
              index={index}
            />
          ))
        ) : (
          <View style={styles.emptyComponents}>
            <Feather name="box" size={24} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>No components yet</Text>
          </View>
        )}
      </View>

      {/* AI Audit button */}
      <View style={styles.auditSection}>
        <TouchableOpacity
          style={[styles.auditButton, !hasComponents && styles.auditButtonDisabled]}
          onPress={handleAudit}
          disabled={!hasComponents}
          activeOpacity={0.8}
        >
          <Feather name="zap" size={16} color="#FFFFFF" />
          <Text style={styles.auditButtonText}>Run AI Audit</Text>
        </TouchableOpacity>
        <Text style={styles.auditSubtext}>
          AI analyzes your dApp against Monad best practices
        </Text>
      </View>
    </ScrollView>
  );
}
