import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { color, font, space, TOUCH, type } from '@/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

/** Full-width action. Labels say what happens: "Send by email", not "Submit". */
export function Button({ label, onPress, variant = 'primary', disabled, style, accessibilityHint }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        pressed && (primary ? styles.primaryPressed : styles.secondaryPressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? color.paper : color.pine }]}>{label}</Text>
    </Pressable>
  );
}

/** Inline text link with a full-size touch target. */
export function TextLink({ children, onPress, style }: { children: ReactNode; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8} style={[styles.link, style]}>
      <Text style={type.link}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 14, paddingHorizontal: space.l, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: color.pine },
  primaryPressed: { backgroundColor: color.pinePressed },
  secondary: { backgroundColor: color.paper, borderWidth: 1.5, borderColor: color.pine },
  secondaryPressed: { backgroundColor: '#E4EEE9' },
  disabled: { opacity: 0.4 },
  buttonText: { fontFamily: font.bold, fontSize: 17 },
  link: { minHeight: TOUCH, justifyContent: 'center', alignSelf: 'flex-start' },
});
