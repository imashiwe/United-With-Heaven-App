import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import SongsScreen from '../screens/SongsScreen';
import BibleScreen from '../screens/BibleScreen';
import MessagesScreen from '../screens/MessagesScreen';
import PrayerScreen from '../screens/community/PrayerScreen';
import TestimoniesScreen from '../screens/community/TestimoniesScreen';
import PropheticScreen from '../screens/PropheticScreen';
import DiaryScreen from '../screens/diary/DiaryScreen';
import CommunityFeedScreen from '../screens/community/CommunityFeedScreen';

const Tab = createBottomTabNavigator();
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ active, inactive, focused, color }: {
  active: IoniconName; inactive: IoniconName; focused: boolean; color: string;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={focused ? active : inactive} size={focused ? 24 : 22} color={color} />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFBF5',
            borderTopColor: '#E8D5B7',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 72,
            paddingBottom: Platform.OS === 'ios' ? 24 : 10,
            paddingTop: 8,
            shadowColor: '#8B5420',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 14,
          },
          tabBarActiveTintColor: '#B8722A',
          tabBarInactiveTintColor: '#C4A882',
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: 'Nunito_700Bold',
            marginTop: 1,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarIcon: ({ focused, color }) => <TabIcon active="home" inactive="home-outline" focused={focused} color={color} /> }}
        />
        <Tab.Screen
          name="Songs"
          component={SongsScreen}
          options={{ tabBarIcon: ({ focused, color }) => <TabIcon active="musical-notes" inactive="musical-notes-outline" focused={focused} color={color} /> }}
        />
        <Tab.Screen
          name="Bible"
          component={BibleScreen}
          options={{ tabBarIcon: ({ focused, color }) => <TabIcon active="book" inactive="book-outline" focused={focused} color={color} /> }}
        />
        <Tab.Screen
          name="Messages"
          component={MessagesScreen}
          options={{ tabBarIcon: ({ focused, color }) => <TabIcon active="chatbubbles" inactive="chatbubbles-outline" focused={focused} color={color} /> }}
        />
        <Tab.Screen
          name="Prayer"
          component={PrayerScreen}
          options={{ tabBarIcon: ({ focused, color }) => <TabIcon active="hand-left" inactive="hand-left-outline" focused={focused} color={color} />, tabBarLabel: 'Prayer' }}
        />
        <Tab.Screen
          name="Testimonies"
          component={TestimoniesScreen}
          options={{ tabBarIcon: ({ focused, color }) => <TabIcon active="flame" inactive="flame-outline" focused={focused} color={color} /> }}
        />
        <Tab.Screen
          name="Prophetic"
          component={PropheticScreen}
          options={{ tabBarIcon: ({ focused, color }) => <TabIcon active="flash" inactive="flash-outline" focused={focused} color={color} /> }}
        />
        <Tab.Screen
          name="Diary"
          component={DiaryScreen}
          options={{ tabBarIcon: ({ focused, color }) => <TabIcon active="document-text" inactive="document-text-outline" focused={focused} color={color} /> }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityFeedScreen}
          options={{ tabBarIcon: ({ focused, color }) => <TabIcon active="people" inactive="people-outline" focused={focused} color={color} /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(184,114,42,0.12)',
  },
});
