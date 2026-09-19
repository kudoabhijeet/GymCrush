// Metro config for a pnpm monorepo + NativeWind.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const swiftUiStub = path.resolve(projectRoot, 'src/lib/swiftUiStub.ts');

const config = getDefaultConfig(projectRoot);

// Let Metro resolve packages hoisted to the workspace root (pnpm).
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

// WorkoutLiveActivity imports @expo/ui/swift-ui for the widgets babel plugin, but
// the layout runs in the widget extension bundle. Stubbing in the main app keeps
// expo-ui native views from breaking NativeWind CssInterop.
const swiftUiPattern = /^@expo\/ui\/swift-ui(\/|$)/;
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (swiftUiPattern.test(moduleName)) {
    return { type: 'sourceFile', filePath: swiftUiStub };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
