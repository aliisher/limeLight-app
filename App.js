import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RoleProvider } from './src/Context/RoleContext';
import AuthTokenSync from './src/Components/AuthTokenSync';
import SplashView from './src/Components/SplashView';
import MainNavigation from './src/Navigations/MainNavigation';
import { persistor, store } from './src/Redux/Store';
import { MyStyling } from './src/Constants/Styling';

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider >
        <Provider store={store}>
          <PersistGate loading={<SplashView />} persistor={persistor}>
            <AuthTokenSync />
            <RoleProvider>
              <MainNavigation />
            </RoleProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
