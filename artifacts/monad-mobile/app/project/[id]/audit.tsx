import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { fetch } from 'expo/fetch';
import { useQuery } from '@tanstack/react-query';
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
  components: Component[];
}

async function fetchProject(id: string): Promise<Project> {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const res = await fetch(`https://${domain}/api/projects/${id}`);
  if (!res.ok) throw new Error('Project not found');
  return res.json() as Promise<Project>;
}

type AuditState = 'idle' | 'streaming' | 'done' | 'error';

export default function AuditScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [auditText, setAuditText] = useState('');
  const [auditState, setAuditState] = useState<AuditState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: project } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const runAudit = useCallback(async () => {
    if (!project) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setAuditText('');
    setErrorMsg('');
    setAuditState('streaming');

    const sorted = [...project.components].sort((a, b) => a.order - b.order);
    const domain = process.env.EXPO_PUBLIC_DOMAIN;

    try {
      const response = await fetch(`https://${domain}/api/ai/audit-dapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          components: sorted.map(c => ({ type: c.type, props: c.props })),
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errBody = await response.json() as { error?: string };
        throw new Error(errBody.error ?? `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          // Separate JSON parsing from business logic so that server-sent
          // `error` events propagate to the outer catch instead of being
          // swallowed alongside malformed JSON.
          type SseEvent = { content?: string; done?: boolean; error?: string };
          let parsed: SseEvent | null = null;
          try {
            parsed = JSON.parse(line.slice(6)) as SseEvent;
          } catch {
            // Malformed JSON line — skip silently.
          }
          if (parsed === null) continue;

          // Server-sent error: surface to the user via the outer catch block.
          if (parsed.error) throw new Error(parsed.error);

          if (parsed.content) {
            const chunk = parsed.content;
            setAuditText(prev => prev + chunk);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 0);
          }
          if (parsed.done) {
            setAuditState('done');
          }
        }
      }

      setAuditState('done');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setErrorMsg(err instanceof Error ? err.message : 'Audit failed');
      setAuditState('error');
    }
  }, [project]);

  // Auto-run on mount once project loads
  useEffect(() => {
    if (project && auditState === 'idle') {
      runAudit();
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [project]); // eslint-disable-line react-hooks/exhaustive-deps

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      ...(Platform.OS === 'web' ? { paddingTop: 77 } : {}),
    },
    topBarTitle: {
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    topBarProject: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    rerunButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.muted,
      borderRadius: colors.radius,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    rerunText: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: colors.foreground,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: Platform.OS === 'web' ? 100 : 48,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
    },
    streamLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16,
    },
    streamDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#22C55E',
    },
    streamLabelText: {
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
      color: '#22C55E',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    auditContent: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      lineHeight: 22,
    },
    doneBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    doneText: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    errorContainer: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 12,
    },
    errorIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: 'rgba(239,68,68,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorTitle: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    errorMsg: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingHorizontal: 20,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    retryText: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: '#FFFFFF',
    },
    waitingContainer: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 12,
    },
    waitingText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
  });

  const isStreaming = auditState === 'streaming';
  const isDone = auditState === 'done';
  const isErrorState = auditState === 'error';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'AI Audit' }} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Auditing</Text>
          <Text style={styles.topBarProject}>{project?.name ?? '...'}</Text>
        </View>
        <TouchableOpacity
          style={styles.rerunButton}
          onPress={runAudit}
          disabled={isStreaming || !project}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={12} color={colors.foreground} />
          <Text style={styles.rerunText}>Re-run</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Waiting for project to load */}
        {!project && (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.waitingText}>Loading project…</Text>
          </View>
        )}

        {/* Initial streaming indicator */}
        {project && isStreaming && !auditText && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              AI is analyzing {project.name}…{'\n'}Running Monad best-practices audit
            </Text>
          </View>
        )}

        {/* Audit text (streaming or done) */}
        {auditText.length > 0 && (
          <>
            {isStreaming && (
              <View style={styles.streamLabel}>
                <View style={styles.streamDot} />
                <Text style={styles.streamLabelText}>Streaming</Text>
              </View>
            )}
            <AuditRenderer text={auditText} colors={colors} />
            {isDone && (
              <View style={styles.doneBadge}>
                <Feather name="check-circle" size={13} color={colors.mutedForeground} />
                <Text style={styles.doneText}>Audit complete · Powered by MonadBuilder+ AI</Text>
              </View>
            )}
          </>
        )}

        {/* Error state */}
        {isErrorState && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Feather name="alert-triangle" size={20} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Audit failed</Text>
            <Text style={styles.errorMsg}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={runAudit} activeOpacity={0.8}>
              <Feather name="refresh-cw" size={14} color="#FFFFFF" />
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Renders audit markdown text with styled headers, sections, and body text.
 */
function AuditRenderer({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  const styles = StyleSheet.create({
    h2: {
      fontSize: 17,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
      marginTop: 20,
      marginBottom: 8,
    },
    h3: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
      marginTop: 12,
      marginBottom: 4,
    },
    body: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      lineHeight: 22,
      marginBottom: 2,
    },
    bullet: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      lineHeight: 22,
      paddingLeft: 8,
    },
  });

  const lines = text.split('\n');

  return (
    <View>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <Text key={i} style={styles.h2}>{line.slice(3)}</Text>;
        }
        if (line.startsWith('### ')) {
          return <Text key={i} style={styles.h3}>{line.slice(4)}</Text>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <Text key={i} style={styles.bullet}>• {line.slice(2)}</Text>;
        }
        return <Text key={i} style={styles.body}>{line}</Text>;
      })}
    </View>
  );
}
