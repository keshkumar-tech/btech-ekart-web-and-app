module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            // Mirror the "@/*" -> "src/*" mapping from tsconfig.json.
            "@": "./src",
          },
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      ],
      // NOTE: "react-native-reanimated/plugin" must be listed last IF reanimated
      // is installed. It is intentionally omitted because the app does not use it.
    ],
  };
};
