import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { RecurrenceConfig as RecurrenceConfigType, RecurrencePattern, RecurrenceEndType } from "../../types/recurringTask";
import { PatternSelector, DaysOfWeekSelector, NumberInput, DatePickerButton } from "./FormComponents";
import { styles } from "./TaskStyles";

interface RecurrenceConfigProps {
  value: RecurrenceConfigType;
  onChange: (config: RecurrenceConfigType) => void;
}

export const RecurrenceConfig: React.FC<RecurrenceConfigProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

  const updateConfig = (updates: Partial<RecurrenceConfigType>) => {
    onChange({ ...value, ...updates });
  };

  const handlePatternChange = (pattern: RecurrencePattern) => {
    const updates: Partial<RecurrenceConfigType> = { pattern };

    // Reset pattern-specific fields when pattern changes
    if (pattern === "daily") {
      updates.days_of_week = undefined;
      updates.day_of_month = undefined;
    } else if (pattern === "weekly") {
      updates.day_of_month = undefined;
      if (!value.days_of_week || value.days_of_week.length === 0) {
        updates.days_of_week = [1]; // Default to Monday
      }
    } else if (pattern === "monthly") {
      updates.days_of_week = undefined;
      if (!value.day_of_month) {
        updates.day_of_month = 1; // Default to 1st day of month
      }
    }

    updateConfig(updates);
  };

  const handleEndTypeChange = (endType: RecurrenceEndType) => {
    const updates: Partial<RecurrenceConfigType> = { end_type: endType };

    // Reset end-type-specific fields
    if (endType === "never") {
      updates.end_date = undefined;
      updates.end_count = undefined;
    } else if (endType === "after_count") {
      updates.end_date = undefined;
      if (!value.end_count) {
        updates.end_count = 10; // Default to 10 occurrences
      }
    } else if (endType === "on_date") {
      updates.end_count = undefined;
    }

    updateConfig(updates);
  };

  const handleEndDateConfirm = (date: Date) => {
    updateConfig({ end_date: date.toISOString() });
    setEndDatePickerVisible(false);
  };

  return (
    <View>
      {/* Pattern Selector */}
      <Text style={styles.inputLabel}>{t('recurring.patterns.daily')}</Text>
      <PatternSelector value={value.pattern} onChange={handlePatternChange} />

      {/* Interval */}
      <Text style={styles.inputLabel}>{t('recurring.interval.label')}</Text>
      <NumberInput
        value={value.interval || 1}
        onChange={(interval) => updateConfig({ interval })}
        min={1}
        max={365}
      />

      {/* Days of Week (for weekly pattern) */}
      {value.pattern === "weekly" && (
        <>
          <Text style={styles.inputLabel}>{t('recurring.daysOfWeek.label')}</Text>
          <DaysOfWeekSelector
            value={value.days_of_week || []}
            onChange={(days_of_week) => updateConfig({ days_of_week })}
          />
        </>
      )}

      {/* Day of Month (for monthly pattern) */}
      {value.pattern === "monthly" && (
        <>
          <Text style={styles.inputLabel}>{t('recurring.dayOfMonth.label')}</Text>
          <NumberInput
            value={value.day_of_month || 1}
            onChange={(day_of_month) => updateConfig({ day_of_month })}
            min={1}
            max={31}
            placeholder={t('recurring.dayOfMonth.placeholder')}
          />
        </>
      )}

      {/* End Type Selector */}
      <Text style={styles.inputLabel}>{t('recurring.endType.label')}</Text>
      <View style={styles.priorityContainer}>
        <TouchableOpacity
          style={[
            styles.priorityButton,
            styles.priorityButtonLow,
            value.end_type === "never" && styles.priorityButtonActive
          ]}
          onPress={() => handleEndTypeChange("never")}
        >
          <Text style={[
            styles.priorityButtonText,
            value.end_type === "never" && styles.priorityButtonTextActive
          ]}>{t('recurring.endType.never')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.priorityButton,
            styles.priorityButtonMedium,
            value.end_type === "after_count" && styles.priorityButtonActive
          ]}
          onPress={() => handleEndTypeChange("after_count")}
        >
          <Text style={[
            styles.priorityButtonText,
            value.end_type === "after_count" && styles.priorityButtonTextActive
          ]}>{t('recurring.endType.after_count')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.priorityButton,
            styles.priorityButtonHigh,
            value.end_type === "on_date" && styles.priorityButtonActive
          ]}
          onPress={() => handleEndTypeChange("on_date")}
        >
          <Text style={[
            styles.priorityButtonText,
            value.end_type === "on_date" && styles.priorityButtonTextActive
          ]}>{t('recurring.endType.on_date')}</Text>
        </TouchableOpacity>
      </View>

      {/* End Count (if end_type is after_count) */}
      {value.end_type === "after_count" && (
        <>
          <Text style={styles.inputLabel}>{t('recurring.endCount.label')}</Text>
          <NumberInput
            value={value.end_count || 10}
            onChange={(end_count) => updateConfig({ end_count })}
            min={1}
            max={1000}
            placeholder={t('recurring.endCount.placeholder')}
          />
        </>
      )}

      {/* End Date (if end_type is on_date) */}
      {value.end_type === "on_date" && (
        <>
          <Text style={styles.inputLabel}>{t('recurring.endDate.label')}</Text>
          <DatePickerButton
            value={value.end_date}
            onPress={() => setEndDatePickerVisible(true)}
            placeholder={t('recurring.endDate.placeholder')}
          />
          <DateTimePickerModal
            isVisible={isEndDatePickerVisible}
            mode="date"
            onConfirm={handleEndDateConfirm}
            onCancel={() => setEndDatePickerVisible(false)}
            minimumDate={new Date()}
          />
        </>
      )}
    </View>
  );
};

export default RecurrenceConfig;
