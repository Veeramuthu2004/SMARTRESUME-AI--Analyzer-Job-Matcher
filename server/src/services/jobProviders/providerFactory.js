const env = require("../../config/env");

const providers = {};

const loadProviders = () => {
  // lazy require so provider modules can reference other services/models
  providers.jsearch = require("./jsearchProvider");
  providers.adzuna = require("./adzunaProvider");
  providers.local = require("./localProvider");
};

const getProvider = (name) => {
  if (!Object.keys(providers).length) loadProviders();
  if (!name) name = env.jobsProvider || "local";
  return providers[name] || providers.local;
};

const search = async (params = {}) => {
  const providerName = params.provider || env.jobsProvider || "local";
  const provider = getProvider(providerName);
  return provider.search(params);
};

module.exports = { getProvider, search };
