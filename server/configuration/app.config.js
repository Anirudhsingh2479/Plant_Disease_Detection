const getEnv = require("../utils/get-env").getEnv;

const appConfig = () => ({
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT", "5001"),
  BASE_PATH: getEnv("BASE_PATH", "/api"),
//   MONGO_URI: getEnv("MONGO_URI", ""),
});

module.exports = {
  config: appConfig(),
};