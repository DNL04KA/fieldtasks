import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { attachmentExists } from '../services/attachmentService';
import type { Attachment } from '../types';

interface AttachmentGalleryProps {
  attachments: Attachment[];
  onRemove?: (attachmentId: string) => void;
}

function AttachmentItem({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove?: (id: string) => void;
}) {
  const { colors } = useTheme();
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    attachmentExists(attachment.uri).then((exists) => {
      if (!cancelled) setAvailable(exists);
    });
    return () => {
      cancelled = true;
    };
  }, [attachment.uri]);

  const isImage = attachment.mimeType.startsWith('image/') && available;

  return (
    <View style={[styles.item, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      {isImage ? (
        <Image
          source={{ uri: attachment.uri }}
          style={styles.thumbnail}
          accessibilityLabel={`Attachment ${attachment.name}`}
        />
      ) : (
        <View style={styles.filePlaceholder}>
          <Text style={styles.fileIcon}>{available === false ? '❌' : '📄'}</Text>
          <Text style={[styles.fileNote, { color: colors.textSecondary }]}>
            {available === false ? 'File unavailable' : attachment.mimeType.split('/')[1] ?? 'file'}
          </Text>
        </View>
      )}
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {attachment.name}
      </Text>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove attachment ${attachment.name}`}
          onPress={() => onRemove(attachment.id)}
          style={[styles.removeButton, { backgroundColor: colors.danger }]}
        >
          <Text style={styles.removeLabel}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function AttachmentGallery({ attachments, onRemove }: AttachmentGalleryProps) {
  const { colors } = useTheme();

  if (attachments.length === 0) {
    return <Text style={[styles.empty, { color: colors.textSecondary }]}>No attachments yet</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {attachments.map((a) => (
        <AttachmentItem key={a.id} attachment={a} onRemove={onRemove} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 12, paddingVertical: 8 },
  item: { width: 120, borderWidth: 1, borderRadius: 12, padding: 8 },
  thumbnail: { width: '100%', height: 84, borderRadius: 8 },
  filePlaceholder: { height: 84, alignItems: 'center', justifyContent: 'center' },
  fileIcon: { fontSize: 28 },
  fileNote: { fontSize: 11, marginTop: 4 },
  name: { fontSize: 12, marginTop: 6 },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { fontSize: 14, paddingVertical: 8 },
});
