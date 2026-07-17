import { RichText, useEditorBridge, useEditorContent } from '@10play/tentap-editor';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { RichToolbar } from '@/components/note/rich-toolbar';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import { pickInlineImageDataUri } from '@/lib/files';

type Props = {
  /** HTML the editor opens with — captured once by the parent, never fed back. */
  initialHtml: string;
  /** Fires on every edit with the current HTML (parent keeps it for Save). */
  onChangeHtml: (html: string) => void;
};

// Fixed height so content scrolls inside the editor, keeping controls reachable.
const EDITOR_HEIGHT = 500;

/** WYSIWYG note editor (TenTap/WebView); content stays HTML, form derives plain text. */
export function RichContentEditor({ initialHtml, onChangeHtml }: Props) {
  const colors = useTheme();
  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: initialHtml,
  });

  // Push live HTML up; onChangeHtml is a stable setter, so this can't loop.
  const html = useEditorContent(editor, { type: 'html' });
  useEffect(() => {
    if (html != null) onChangeHtml(html);
  }, [html, onChangeHtml]);

  const insertImage = async () => {
    const dataUri = await pickInlineImageDataUri();
    if (dataUri) editor.setImage(dataUri);
  };

  return (
    <View
      style={[
        styles.box,
        {
          height: EDITOR_HEIGHT,
          backgroundColor: colors.surfaceLowest,
          borderColor: withAlpha(colors.outlineVariant, 0.6),
        },
      ]}>
      <RichToolbar editor={editor} onInsertImage={insertImage} />
      <RichText editor={editor} style={styles.editor} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  editor: {
    flex: 1,
  },
});
