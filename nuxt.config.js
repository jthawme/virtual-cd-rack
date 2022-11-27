// TODO: (Ramdane) read this from a custom config file, with environment configuration
const PROJECT_TITLE = "My CDs";
const PROJECT_SHORT_TITLE = "My CDs";
const PROJECT_DESCRIPTION = "Have a look whats on my CD Racks";
const PROJECT_KEYWORDS = "JT, Jonny Thaw"; // add more
const PROJECT_DOMAIN = "https://cds.jthaw.club";

export default {
  mode: "universal",

  server: {
    port: 3000,
    host: process.env.MOBILE ? "0.0.0.0" : "localhost"
  },
  /*
   ** Headers of the page
   */
  head: {
    htmlAttrs: {
      lang: "en"
    },
    title: PROJECT_TITLE,
    meta: [
      { charset: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0"
      },
      { name: "referrer", content: "no-referrer" },
      {
        name: "title",
        content: PROJECT_TITLE
      },
      {
        hid: "description",
        name: "description",
        content: PROJECT_DESCRIPTION
      },
      {
        name: "keywords",
        content: PROJECT_KEYWORDS
      },
      {
        name: "twitter:card",
        content: "summary_large_image"
      },
      { name: "twitter:site", content: "@jthawme" },
      {
        name: "twitter:title",
        content: PROJECT_TITLE
      },
      {
        name: "twitter:description",
        content: PROJECT_DESCRIPTION
      },
      {
        name: "twitter:image:src",
        content: `${PROJECT_DOMAIN}/social/sharecard-twitter.png`
      },
      {
        name: "og:title",
        property: "og:title",
        content: PROJECT_TITLE
      },
      { name: "og:type", property: "og:type", content: "website" },
      {
        name: "og:url",
        property: "og:url",
        content: `${PROJECT_DOMAIN}`
      },
      {
        name: "og:image",
        property: "og:image",
        content: `${PROJECT_DOMAIN}/social/sharecard-facebook.png`
      },
      {
        name: "og:description",
        property: "og:description",
        content: PROJECT_DESCRIPTION
      },
      {
        name: "og:site_name",
        property: "og:site_name",
        content: PROJECT_TITLE
      },
      { name: "author", content: "Jonny Thaw" },
      { meta: "msapplication-TileColor", content: "#ffffff" },
      { meta: "msapplication-TileImage", content: "/ms-icon-144x144.png" },
      { meta: "theme-color", content: "#ffffff" }
    ]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: "#fff" },
  /*
   ** Global CSS
   */
  css: ["normalize.css/normalize.css"],
  /*
   ** Plugins to load before mounting the App
   */
  env: {
    endpoint: process.env.LOCAL
      ? "http://localhost:3001/dev"
      : "https://w1wvlmkww4.execute-api.us-east-1.amazonaws.com/dev",
    recaptcha: process.env.RECAPTCHA_KEY,
    PROJECT_DOMAIN: process.env.LOCAL ? "http://localhost:3000" : PROJECT_DOMAIN
  },

  components: [{ path: "~/components/common", extensions: ["vue"] }],

  plugins: [
    { src: "~/plugins/vue-recaptcha.js", ssr: false },
    { src: "~plugins/vue-scroll-lock.js", ssr: false },
    { src: "~plugins/vue-resize.js", ssr: false }
  ],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: ["@nuxtjs/pwa"],
  /*
   ** Nuxt.js modules
   */
  modules: ["@nuxtjs/svg", "@nuxtjs/style-resources", "@nuxtjs/markdownit"],

  markdownit: {
    injected: true,
    html: true
  },

  styleResources: {
    scss: ["~/assets/scss/common.scss"]
  },
  /*
   ** Build configuration
   */
  build: {
    postcss: {
      preset: {
        features: {
          customProperties: false
        }
      }
    },
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {}
  },

  pwa: {
    manifest: {
      name: PROJECT_TITLE,
      short_name: PROJECT_SHORT_TITLE
    }
  }
};
