import { Locales, type IntlayerConfig } from "intlayer";

const config: IntlayerConfig = {
  internationalization: {
    locales: [Locales.CHINESE_SIMPLIFIED_CHINA, Locales.ENGLISH],
    defaultLocale: Locales.CHINESE_SIMPLIFIED_CHINA,
  },
  routing: {
    enableProxy: true,
    mode: "prefix-all",
  },
};

export default config;
