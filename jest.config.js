module.exports = {
  preset: 'jest-expo/node',
  testEnvironment: 'node',

  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/(?!modules-core)|@expo-google-fonts|react-navigation|@react-navigation/.*|@shopify/flash-list|zustand)',
  ],
};
