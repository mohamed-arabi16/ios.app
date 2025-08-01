import React from 'react';
import { View, Text, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import { useSettings, useUpdateSettings, Theme } from '../hooks/useSettings';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const SettingRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <View className="flex-row justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg mb-4">
    <Text className="text-lg text-gray-900 dark:text-white">{label}</Text>
    <View>{children}</View>
  </View>
);

const ThemeSelector = ({ value, onChange }: { value: Theme, onChange: (theme: Theme) => void }) => {
  const options: Theme[] = ['light', 'dark', 'system'];
  return (
    <View className="flex-row bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          className={`px-4 py-1 rounded-md ${value === option ? 'bg-white dark:bg-gray-900' : ''}`}
        >
          <Text className={`font-semibold capitalize ${value === option ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}>{option}</Text>
        </Pressable>
      ))}
    </View>
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
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></View>;
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-6">
      <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</Text>

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
        <Text className="text-gray-500">{settings?.default_currency ?? 'USD'}</Text>
      </SettingRow>

      <Pressable
        onPress={handleSignOut}
        className="bg-red-500 rounded-lg p-4 mt-8 flex-row justify-center items-center"
      >
        <Text className="text-white text-lg font-bold">Sign Out</Text>
      </Pressable>
    </View>
  );
}
