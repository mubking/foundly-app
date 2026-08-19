module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Must be listed last — required by react-native-reanimated v4 (used
    // via react-native-keyboard-controller for the chat keyboard fix).
    plugins: ["react-native-worklets/plugin"],
  };
};
