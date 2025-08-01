import { supabase } from '~/lib/supabaseClient';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      Alert.alert('Sign In Error', error.message);
    }
    // The AuthProvider will handle navigation on successful sign-in
    setLoading(false);
  };

  return (
    <View className="flex-1 justify-center bg-gray-100 dark:bg-gray-900 p-8">
      <View className="mb-8">
        <Text className="text-4xl font-bold text-center text-gray-900 dark:text-white">
          Welcome Back
        </Text>
        <Text className="text-lg text-center text-gray-600 dark:text-gray-400 mt-2">
          Sign in to your account
        </Text>
      </View>

      <View className="space-y-4">
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
            <Text className="text-white text-lg font-bold">Sign In</Text>
          )}
        </Pressable>
      </View>

      <View className="mt-6">
        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <Text className="text-center text-blue-600 dark:text-blue-400 text-base">
              Don&apos;t have an account? Sign Up
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
