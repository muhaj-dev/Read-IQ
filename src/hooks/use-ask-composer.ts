// Ask composer state: the draft text, attached images, voice dictation, and the
// transient notice line. Keeps the Ask screen thin (screens compose, hooks think).

import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import { useVoiceDictation } from '@/hooks/use-voice-dictation';
import type { ChatAttachment } from '@/types/chat';

/** How many images may ride along with one question. */
const MAX_ATTACHMENTS = 4;

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type SubmitFn = (question: string, attachments: ChatAttachment[]) => void;

export function useAskComposer(onSubmit: SubmitFn) {
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const addImage = useCallback((uri: string) => {
    setAttachments((now) =>
      now.length >= MAX_ATTACHMENTS ? now : [...now, { id: createId(), uri }],
    );
  }, []);

  // Dictation appends to whatever's already typed, then leaves it for review.
  const voice = useVoiceDictation({
    onResult: (text) => setDraft((d) => (d.trim() ? `${d.trim()} ${text}` : text)),
    onError: (message) => setNotice(message),
  });

  const addFromLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) addImage(result.assets[0].uri);
  }, [addImage]);

  const addFromCamera = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setNotice('Camera access is off. Enable it in Settings to snap a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) addImage(result.assets[0].uri);
  }, [addImage]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((now) => now.filter((a) => a.id !== id));
  }, []);

  const submit = useCallback(() => {
    const question = draft.trim();
    if (!question && attachments.length === 0) return;
    onSubmit(question, attachments);
    setDraft('');
    setAttachments([]);
    setNotice(null);
  }, [draft, attachments, onSubmit]);

  const canSend = draft.trim().length > 0 || attachments.length > 0;

  return {
    draft,
    setDraft,
    attachments,
    removeAttachment,
    addFromLibrary,
    addFromCamera,
    voice,
    notice,
    clearNotice: () => setNotice(null),
    submit,
    canSend,
  };
}
