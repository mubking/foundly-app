import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/Onboarding/SplashScreen";
import OnboardingScreen from "../screens/Onboarding/OnboardingScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/Auth/ResetPasswordScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import SearchScreen from "../screens/Search/SearchScreen";
import SavedSearchesScreen from "../screens/Search/SavedSearchesScreen";
import ItemDetailsScreen from "../screens/Details/ItemDetailsScreen";
import EditListingScreen from "../screens/Details/EditListingScreen";
import ReportLostScreen from "../screens/Lost/ReportLostScreen";
import ReportFoundScreen from "../screens/Found/ReportFoundScreen";
import ClaimVerificationScreen from "../screens/Claim/ClaimVerificationScreen";
import OwnerClaimsScreen from "../screens/Claim/OwnerClaimsScreen";
import ClaimDetailsScreen from "../screens/Claim/ClaimDetailsScreen";
import NotificationsScreen from "../screens/Notifications/NotificationsScreen";
import ConversationsScreen from "../screens/Chat/ConversationsScreen";
import ChatScreen from "../screens/Chat/ChatScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import EditProfileScreen from "../screens/Profile/EditProfileScreen";
import ChangePasswordScreen from "../screens/Profile/ChangePasswordScreen";
import DeleteAccountScreen from "../screens/Profile/DeleteAccountScreen";
import MyLostScreen from "../screens/Lost/MyLostScreen";
import MyFoundScreen from "../screens/Found/MyFoundScreen";
import RewardsScreen from "../screens/Rewards/RewardsScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import LegalScreen from "../screens/Legal/LegalScreen";
import BlockedUsersScreen from "../screens/Settings/BlockedUsersScreen";
import MatchesScreen from "../screens/Matches/MatchesScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
      />

      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
      />

      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />

      <Stack.Screen
        name="Signup"
        component={RegisterScreen}
      />

      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />

      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
      />

      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />

      <Stack.Screen
        name="Search"
        component={SearchScreen}
      />

      <Stack.Screen
        name="SavedSearches"
        component={SavedSearchesScreen}
      />

      <Stack.Screen
        name="ItemDetails"
        component={ItemDetailsScreen}
      />

      <Stack.Screen
        name="EditListing"
        component={EditListingScreen}
      />

      <Stack.Screen
        name="ReportLost"
        component={ReportLostScreen}
      />

      <Stack.Screen
        name="UploadFound"
        component={ReportFoundScreen}
      />

      <Stack.Screen
        name="ClaimVerification"
        component={ClaimVerificationScreen}
      />

      <Stack.Screen
        name="OwnerClaims"
        component={OwnerClaimsScreen}
      />

      <Stack.Screen
        name="ClaimDetails"
        component={ClaimDetailsScreen}
      />

      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />

      <Stack.Screen
        name="Chat"
        component={ConversationsScreen}
      />

      <Stack.Screen
        name="ChatThread"
        component={ChatScreen}
      />

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
      />

      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
      />

      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
      />

      <Stack.Screen
        name="Legal"
        component={LegalScreen}
      />

      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
      />

      <Stack.Screen
        name="MyLostItems"
        component={MyLostScreen}
      />

      <Stack.Screen
        name="MyFoundItems"
        component={MyFoundScreen}
      />

      <Stack.Screen
        name="RewardHistory"
        component={RewardsScreen}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
      />

      <Stack.Screen
        name="Matches"
        component={MatchesScreen}
      />
    </Stack.Navigator>
  );
}