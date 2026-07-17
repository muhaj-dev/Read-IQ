import type { ReactNode } from 'react';
import { Keyboard, type StyleProp, TouchableWithoutFeedback, View, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Tap empty space to dismiss the keyboard (needed for multiline fields). */
export function DismissKeyboardView({ children, style }: Props) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={style}>{children}</View>
    </TouchableWithoutFeedback>
  );
}
