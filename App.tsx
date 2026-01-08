// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LandingScreen from './screens/LandingScreen';
import RecordingScreen from './screens/RecordingScreen';

export type RootStackParamList = {
  Landing: undefined;
  RecordingScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen
          name="RecordingScreen"
          component={RecordingScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
