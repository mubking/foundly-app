import { KeyboardProvider } from "react-native-keyboard-controller";

import AppNavigator from "./navigation/AppNavigator";

export default function App() {
  return (
    <KeyboardProvider>
      <AppNavigator />
    </KeyboardProvider>
  );
}


// seems this is there code can we work with this ? and i dont know if i could pass this to claude cause ill soon exhaust my credit here and i have claude premium i dont want it to be a mess 