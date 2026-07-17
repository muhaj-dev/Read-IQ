import { useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FormInput } from '@/components/form/form-input';
import { GlassCard } from '@/components/profile/glass-card';
import { AppIcon } from '@/components/ui/app-icon';
import { fonts } from '@/constants/typography';
import type { ProfileForm } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import { isEmail } from '@/lib/validation';
import type { ProfileInput } from '@/types/user';

type Props = {
  initial: ProfileForm;
  onSave: (fields: ProfileInput) => Promise<void>;
  onCancel: () => void;
};

/** Inline "Edit profile" form on the indigo panel — name / course / goal, then Save. */
export function ProfileEditForm({ initial, onSave, onCancel }: Props) {
  const colors = useTheme();
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [studyingFor, setStudyingFor] = useState(initial.studyingFor);
  const [goal, setGoal] = useState(initial.goal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const save = async () => {
    if (saving) return;
    const nameBad = !name.trim();
    const emailBad = !isEmail(email);
    if (nameBad || emailBad) {
      setError(nameBad);
      setEmailError(emailBad);
      return;
    }
    setSaving(true);
    await onSave({ name, email, studyingFor, goal });
    // Parent collapses the form on the next tick; no need to reset local saving.
    onCancel();
  };

  return (
    <GlassCard className="gap-4 rounded-card p-5">
      <View className="flex-row items-center justify-between">
        <Text style={[styles.title, { color: colors.onPrimary }]}>Edit profile</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close edit profile"
          onPress={onCancel}
          hitSlop={10}
          className="h-8 w-8 items-center justify-center rounded-pill"
          style={{ backgroundColor: withAlpha(colors.onPrimary, 0.12) }}>
          <AppIcon name="close" size={16} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <Field label="Name">
        <FormInput
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (error) setError(false);
          }}
          placeholder="Your name"
          error={error}
        />
      </Field>

      <Field label="Email">
        <FormInput
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (emailError) setEmailError(false);
          }}
          placeholder="you@university.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          error={emailError}
        />
      </Field>

      <Field label="Studying for">
        <FormInput value={studyingFor} onChangeText={setStudyingFor} placeholder="e.g. Computer Science" />
      </Field>

      <Field label="Goal">
        <FormInput value={goal} onChangeText={setGoal} placeholder="e.g. Pass my finals" />
      </Field>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={save}
        disabled={saving}
        className="mt-1 h-12 flex-row items-center justify-center gap-2 rounded-inner"
        style={{ backgroundColor: colors.onPrimary }}>
        {saving ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <AppIcon name="check-circle" size={18} color={colors.primary} filled />
        )}
        <Text style={[styles.save, { color: colors.primary }]}>
          {saving ? 'Saving…' : 'Save changes'}
        </Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

/** Small white label above each field. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  const colors = useTheme();
  return (
    <View className="gap-1.5">
      <Text style={[styles.label, { color: colors.onPrimarySoft }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.headingSemibold,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.bodyMedium,
    letterSpacing: 0.3,
  },
  save: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bodySemibold,
  },
});
