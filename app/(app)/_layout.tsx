import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        drawerStyle: {
          backgroundColor: colors.card,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text,
      }}
    >
      <Drawer.Screen
        name="index" // This is the home screen / dashboard
        options={{
          drawerLabel: 'Dashboard',
          title: 'Dashboard',
          drawerIcon: ({ size, color }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="income"
        options={{
          drawerLabel: 'Income',
          title: 'Income',
           drawerIcon: ({ size, color }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
       <Drawer.Screen
        name="expenses"
        options={{
          drawerLabel: 'Expenses',
          title: 'Expenses',
           drawerIcon: ({ size, color }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
        <Drawer.Screen
        name="debts"
        options={{
          drawerLabel: 'Debts',
          title: 'Debts',
           drawerIcon: ({ size, color }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />
         <Drawer.Screen
        name="assets"
        options={{
          drawerLabel: 'Assets',
          title: 'Assets',
           drawerIcon: ({ size, color }) => (
            <Ionicons name="server-outline" size={size} color={color} />
          ),
        }}
      />
       <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          title: 'Settings',
           drawerIcon: ({ size, color }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
