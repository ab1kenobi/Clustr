import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { colors, spacing } from "@/styles/theme";

const GENDER_OPTIONS = [
  "Woman",
  "Man",
  "Non-binary",
  "Genderfluid",
  "Agender",
  "Transgender woman",
  "Transgender man",
  "Two-spirit",
  "Questioning",
  "Prefer not to say",
];

type GenderSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export function GenderSelect({ value, onChange }: GenderSelectProps) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(
    Boolean(value) && !GENDER_OPTIONS.includes(value)
  );
  const isCustomValue = customOpen || (Boolean(value) && !GENDER_OPTIONS.includes(value));
  const displayValue = value || (isCustomValue ? "Prefer to self-describe" : "Select gender");

  const chooseOption = (option: string) => {
    setCustomOpen(false);
    onChange(option);
    setOpen(false);
  };

  const chooseCustom = () => {
    setCustomOpen(true);
    onChange("");
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Gender</Text>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen((current) => !current)}
        activeOpacity={0.75}
      >
        <Text style={[styles.triggerText, !value && !isCustomValue && styles.placeholder]}>
          {displayValue}
        </Text>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.placeholder} />
      </TouchableOpacity>

      {open ? (
        <View style={styles.menu}>
          {GENDER_OPTIONS.map((option) => {
            const selected = value === option;
            return (
              <TouchableOpacity
                key={option}
                style={styles.option}
                onPress={() => chooseOption(option)}
                activeOpacity={0.75}
              >
                <Text style={styles.optionText}>{option}</Text>
                {selected ? <Icon name="check" size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.option} onPress={chooseCustom} activeOpacity={0.75}>
            <Text style={styles.optionText}>Prefer to self-describe</Text>
            {isCustomValue ? <Icon name="check" size={18} color={colors.primary} /> : null}
          </TouchableOpacity>
        </View>
      ) : null}

      {isCustomValue ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          style={styles.input}
          placeholder="Type your gender"
          placeholderTextColor={colors.placeholder}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontWeight: "600", marginBottom: 6, color: colors.inputText },
  trigger: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: spacing.radius,
    paddingHorizontal: 12,
    backgroundColor: colors.inputBackground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  triggerText: {
    flex: 1,
    color: colors.inputText,
    fontSize: 16,
  },
  placeholder: {
    color: colors.placeholder,
  },
  menu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radius,
    backgroundColor: colors.surface,
    marginTop: 6,
    overflow: "hidden",
  },
  option: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    flex: 1,
    color: colors.inputText,
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: spacing.radius,
    padding: 10,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
    marginTop: 8,
  },
});
