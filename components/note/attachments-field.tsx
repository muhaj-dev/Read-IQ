import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AttachmentCard } from '@/components/note/attachment-card';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import { pickFileAttachments, pickImageAttachments } from '@/lib/files';
import type { NoteAttachment } from '@/types/note';

type Props = {
  attachments: NoteAttachment[];
  onAdd: (added: NoteAttachment[]) => void;
  onRemove: (id: string) => void;
};

/** Attachments section: removable cards plus Add image / Add file actions. */
export function AttachmentsField({ attachments, onAdd, onRemove }: Props) {
  const colors = useTheme();

  const addImages = async () => {
    const picked = await pickImageAttachments();
    if (picked.length) onAdd(picked);
  };

  const addFiles = async () => {
    const picked = await pickFileAttachments();
    if (picked.length) onAdd(picked);
  };

  const AddButton = ({ icon, label, onPress }: { icon: AppIconName; label: string; onPress: () => void }) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-lg border py-3"
      style={{ backgroundColor: colors.surfaceLowest, borderColor: withAlpha(colors.outlineVariant, 0.5) }}>
      <AppIcon name={icon} size={18} color={colors.primary} />
      <Text style={[styles.addLabel, { color: colors.primary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="gap-2">
      {attachments.map((item) => (
        <AttachmentCard
          key={item.id}
          name={item.name}
          meta={item.meta}
          kind={item.kind}
          uri={item.uri}
          onRemove={() => onRemove(item.id)}
        />
      ))}

      <View className="flex-row gap-2">
        <AddButton icon="image" label="Add image" onPress={addImages} />
        <AddButton icon="file-upload" label="Add file" onPress={addFiles} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
