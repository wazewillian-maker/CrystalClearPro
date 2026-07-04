import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from "react-native";

import colors from "../theme/colors";

type AppTextInputProps = TextInputProps & {
  label?: string;
  keyboardType?: KeyboardTypeOptions;
};

export function AppTextInput({ label, multiline, style, ...inputProps }: AppTextInputProps) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.textArea, style]}
        textAlignVertical={multiline ? "top" : "center"}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  input: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    color: colors.white,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  textArea: {
    minHeight: 104,
  },
});
