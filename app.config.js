// HTTP is enabled only for local development and the EAS development profile.
module.exports = ({config}) => {
    const profile = process.env.EAS_BUILD_PROFILE;
    const allowLocalHttp = profile === 'development' || (!profile && process.env.NODE_ENV !== 'production');
    return {
        ...config, plugins: [...(config.plugins || []), ['expo-build-properties', {
            android: {usesCleartextTraffic: allowLocalHttp},
        }]],
    };
};
