import React from 'react';
import { View, Text, Pressable, Switch, Alert } from 'react-native';
import { styled } from 'nativewind';
import { useSettings, useUpdateSettings, Theme } from '../hooks/useSettings';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator } from 'react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);

const SettingRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <StyledView className="flex-row justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg mb-4">
    <StyledText className="text-lg text-gray-900 dark:text-white">{label}</StyledText>
    <StyledView>{children}</StyledView>
  </StyledView>
);

const ThemeSelector = ({ value, onChange }: { value: Theme, onChange: (theme: Theme) => void }) => {
  const options: Theme[] = ['light', 'dark', 'system'];
  return (
    <StyledView className="flex-row bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
      {options.map((option) => (
        <StyledPressable
          key={option}
          onPress={() => onChange(option)}
          className={`px-4 py-1 rounded-md ${value === option ? 'bg-white dark:bg-gray-900' : ''}`}
        >
          <StyledText className={`font-semibold capitalize ${value === option ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}>{option}</StyledText>
        </StyledPressable>
      ))}
    </StyledView>
  );
};

export default function SettingsScreen() {
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { mutate: updateSettings, isPending: isUpdating } = useUpdateSettings();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme); // Update UI instantly
    updateSettings({ theme: newTheme }); // Save to DB
  };

  const handleDebtToggle = (value: boolean) => {
    updateSettings({ include_long_term: value });
  };

  const handleSignOut = () => {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
          {text: "Cancel", style: "cancel"},
          {text: "Sign Out", style: "destructive", onPress: () => signOut()}
      ])
  }

  if (isLoadingSettings) {
    return <StyledView className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></StyledView>;
  }

  return (
    <StyledView className="flex-1 bg-gray-50 dark:bg-gray-900 p-6">
      <StyledText className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</StyledText>

      <SettingRow label="Theme">
        <ThemeSelector value={theme} onChange={handleThemeChange} />
      </SettingRow>

      <SettingRow label="Include Long-term Debt in Balance">
        <Switch
          value={settings?.include_long_term ?? true}
          onValueChange={handleDebtToggle}
          disabled={isUpdating}
        />
      </SettingRow>

      {/* Placeholder for Currency Setting */}
      <SettingRow label="Default Currency">
        <StyledText className="text-gray-500">{settings?.default_currency ?? 'USD'}</StyledText>
      </SettingRow>

      <StyledPressable
        onPress={handleSignOut}
        className="bg-red-500 rounded-lg p-4 mt-8 flex-row justify-center items-center"
      >
        <StyledText className="text-white text-lg font-bold">Sign Out</StyledText>
      </StyledPressable>
    </StyledView>
  );
}
