const config = {
  username:
    process.env.NODE_ENV === "development" ? process.env.VUE_APP_USERNAME : "",
  password:
    process.env.NODE_ENV === "development" ? process.env.VUE_APP_PASSWORD : "",
  email:
    process.env.NODE_ENV === "development" ? process.env.VUE_APP_EMAIL : "",
  phone:
    process.env.NODE_ENV === "development"
      ? process.env.VUE_APP_PHONE_NUMBER
      : "",
  dev: process.env.NODE_ENV === "development",
  version: process.env.VUE_APP_VERSION_NUMBER,
  authServer: process.env.AUTH_SERVER || "ws://localhost:8080",
  appServer: process.env.APP_SERVER || "ws://localhost:8081",
};

export default config;
