// Jest setup: in-memory AsyncStorage (see async-storage's Jest docs).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
