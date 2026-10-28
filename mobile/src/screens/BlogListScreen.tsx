import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { blogService } from '@/services';
import { Badge } from '@/components/ui';
import { mediaUrl } from '@/lib/api';
import { colors, font, radius, spacing } from '@/theme';

export default function BlogListScreen({ navigation }: any) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['blog'],
    queryFn: () => blogService.posts({ page_size: 20 }),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Blog</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={data?.results ?? []}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.list}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="newspaper-outline" size={56} color={colors.border} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('BlogDetail', { slug: item.slug })}>
              <Image source={{ uri: mediaUrl(item.cover_image) }} style={styles.cover} />
              <View style={styles.body}>
                {item.category ? <Badge text={item.category.name} bg={colors.brandLight} fg={colors.brand} /> : null}
                <Text numberOfLines={2} style={styles.title}>
                  {item.title}
                </Text>
                <Text numberOfLines={2} style={styles.excerpt}>
                  {item.excerpt}
                </Text>
                <Text style={styles.meta}>
                  {item.read_minutes} min read · {item.views} views
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing(4), paddingVertical: spacing(4), backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.h2, fontWeight: '800', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing(20), gap: spacing(3) },
  emptyTitle: { fontSize: font.h3, fontWeight: '700', color: colors.textMuted },
  list: { padding: spacing(4), gap: spacing(3) },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  cover: { width: '100%', height: 160, backgroundColor: colors.brandLight },
  body: { padding: spacing(4), gap: spacing(2) },
  title: { fontSize: font.h3, fontWeight: '700', color: colors.text },
  excerpt: { fontSize: font.small, color: colors.textMuted, lineHeight: 20 },
  meta: { fontSize: font.tiny, color: colors.textLight, marginTop: spacing(1) },
});
