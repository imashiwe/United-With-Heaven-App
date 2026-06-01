import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import AppNavigator from './src/navigation/AppNavigator';
import PwaInstallPrompt from './src/components/PwaInstallPrompt';

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold_Italic,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF6F0', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#B8722A" size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
      <PwaInstallPrompt />
    </>
  );
}
