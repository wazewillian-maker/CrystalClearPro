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
    borderRadius: 8,
    borderCurve: "continuous",
    borderWidth: 1,
    color: colors.white,
    fontFamily: "Inter",
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  textArea: {
    minHeight: 104,
  },
});
