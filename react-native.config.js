/**
 * Minimal React Native CLI config to ensure platforms are discovered.
 * Workaround for environments where the RN package config fails to load.
 */

const ios = require('@react-native-community/cli-platform-ios');
const android = require('@react-native-community/cli-platform-android');

const commands = [];
if (ios && ios.commands) commands.push(...ios.commands);
if (android && android.commands) commands.push(...android.commands);

// Lazily proxy start/bundle to the community CLI plugin to avoid resolution issues at config load time
const lazyCommand = (name) => ({
  name,
  // defer loading until execution
  func: (...args) => {
    const plugin = require('@react-native/community-cli-plugin');
    const cmd = name === 'start' ? plugin.startCommand : plugin.bundleCommand;
    return cmd.func(...args);
  },
});

commands.push(lazyCommand('start'));
commands.push(lazyCommand('bundle'));

module.exports = {
  commands,
  platforms: {
    ios: {
      projectConfig: ios.projectConfig,
      dependencyConfig: ios.dependencyConfig,
    },
    android: {
      projectConfig: android.projectConfig,
      dependencyConfig: android.dependencyConfig,
    },
  },
};
