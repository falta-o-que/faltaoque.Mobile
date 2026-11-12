module.exports = ({config}) => {
  const isDemo = process.env.EXPO_PUBLIC_APP_VARIANT === 'demo';

  return {
    ...config,
    name: isDemo ? 'FaltaOquê? Demo' : config.name,
    android: {
      ...config.android,
      package: isDemo ? 'com.faltaoque.app.demo' : config.android?.package,
    },
    ios: {
      ...config.ios,
      bundleIdentifier: isDemo ? 'com.faltaoque.app.demo' : config.ios?.bundleIdentifier,
    },
    extra: {
      ...config.extra,
      appVariant: isDemo ? 'demo' : 'production',
    },
  };
};
