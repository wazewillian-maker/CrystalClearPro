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
  icon?: string;
  label?: string;
  keyboardType?: KeyboardTypeOptions;
};

export function AppTextInput({ icon, label, multiline, style, ...inputProps }: AppTextInputProps) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, multiline && styles.textAreaWrapper, style]}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <TextInput
          multiline={multiline}
          placeholderTextColor={colors.muted}
          style={[styles.input, multiline && styles.textArea, icon && styles.inputWithIcon]}
          textAlignVertical={multiline ? "top" : "center"}
          {...inputProps}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  icon: {
    color: colors.primaryLight,
    fontSize: 15,
    fontWeight: "900",
    minWidth: 20,
    textAlign: "center",
  },
  input: {
    color: colors.white,
    flex: 1,
    fontFamily: "Inter",
    fontSize: 14,
    minHeight: 44,
    padding: 0,
  },
  inputWithIcon: {
    minWidth: 0,
  },
  inputWrapper: {
    alignItems: "center",
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderRadius: 8,
    borderCurve: "continuous",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
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
    minHeight: 84,
  },
  textAreaWrapper: {
    alignItems: "flex-start",
    minHeight: 104,
  },
});
