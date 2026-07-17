import { TouchableOpacity, View } from 'react-native';

import { DeadlineMarkers } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  selectedIndex: number;
  onSelect: (index: number) => void;
};

/** Colour swatch row; the selected swatch gets a surface gap + indigo ring. */
export function ColorRow({ selectedIndex, onSelect }: Props) {
  const colors = useTheme();

  return (
    <View className="flex-row items-center justify-between px-2">
      {DeadlineMarkers.map((marker, index) => {
        const selected = index === selectedIndex;
        return (
          <TouchableOpacity
            key={marker}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            activeOpacity={0.8}
            onPress={() => onSelect(index)}
            className="h-10 w-10 items-center justify-center rounded-pill"
            style={selected && { borderWidth: 2, borderColor: colors.primaryContainer }}>
            <View
              className="h-8 w-8 rounded-pill"
              style={[
                { backgroundColor: marker },
                selected && { borderWidth: 4, borderColor: colors.surface },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
