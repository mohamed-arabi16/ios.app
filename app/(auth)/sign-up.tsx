import { supabase } from '../lib/supabaseClient';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);

    // Step 1: Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      Alert.alert('Sign Up Error', authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      Alert.alert('Sign Up Error', 'Could not create user. Please try again.');
      setLoading(false);
      return;
    }

    // Step 2: Create the user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: authData.user.id, name: data.name }]);

    if (profileError) {
      // This is a critical error. The user exists in auth but not in our public tables.
      // For now, we alert the user. A more robust solution might try to clean up the auth user.
      Alert.alert('Sign Up Error', `Could not create user profile: ${profileError.message}`);
      setLoading(false);
      return;
    }

    // Step 3: Create the user settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert([{ user_id: authData.user.id }]);

    if (settingsError) {
      Alert.alert('Sign Up Error', `Could not create user settings: ${settingsError.message}`);
      setLoading(false);
      return;
    }

    // On success, Supabase sends a confirmation email. The user will be logged in
    // automatically by the onAuthStateChange listener after confirming.
    Alert.alert('Sign Up Successful', 'Please check your email to confirm your account.');
    setLoading(false);
    // The AuthProvider will handle navigation once the user is confirmed and logged in.
  };

  return (
    <View className="flex-1 justify-center bg-gray-100 dark:bg-gray-900 p-8">
      <View className="mb-8">
        <Text className="text-4xl font-bold text-center text-gray-900 dark:text-white">
          Create Account
        </Text>
        <Text className="text-lg text-center text-gray-600 dark:text-gray-400 mt-2">
          Start tracking your balance today
        </Text>
      </View>

      <View className="space-y-4">
        <Controller
          control={control}
          rules={{ required: 'Full name is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-lg rounded-lg p-4"
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              autoCapitalize="words"
            />
          )}
          name="name"
        />
        {errors.name && <Text className="text-red-500 mt-1">{errors.name.message}</Text>}

        <Controller
          control={control}
          rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-lg rounded-lg p-4"
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
          name="email"
        />
        {errors.email && <Text className="text-red-500 mt-1">{errors.email.message}</Text>}

        <Controller
          control={control}
          rules={{ required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-lg rounded-lg p-4"
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
            />
          )}
          name="password"
        />
        {errors.password && <Text className="text-red-500 mt-1">{errors.password.message}</Text>}

        <Pressable
          className="bg-blue-600 rounded-lg p-4 flex-row justify-center items-center"
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-bold">Sign Up</Text>
          )}
        </Pressable>
      </View>

      <View className="mt-6">
        <Link href="/(auth)/sign-in" asChild>
          <Pressable>
            <Text className="text-center text-blue-600 dark:text-blue-400 text-base">
              Already have an account? Sign In
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
