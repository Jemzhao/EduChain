import { t, type Dictionary } from "intlayer";

const taxonomyContent = {
  key: "taxonomy",
  content: {
    computerScienceName: t({ "zh-CN": "计算机科学", en: "Computer science" }),
    computerScienceDescription: t({
      "zh-CN": "软件、算法、数据与计算系统",
      en: "Software, algorithms, data and computing systems",
    }),
    mathematicsName: t({ "zh-CN": "数学", en: "Mathematics" }),
    mathematicsDescription: t({
      "zh-CN": "基础数学、应用数学与建模",
      en: "Pure mathematics, applied mathematics and modelling",
    }),
    educationName: t({ "zh-CN": "教育学", en: "Education" }),
    educationDescription: t({
      "zh-CN": "学习科学、教学设计与教育研究",
      en: "Learning science, instructional design and education research",
    }),
    engineeringName: t({ "zh-CN": "工程技术", en: "Engineering" }),
    engineeringDescription: t({
      "zh-CN": "工程方法、系统设计与实践",
      en: "Engineering methods, systems design and practice",
    }),
    humanitiesName: t({ "zh-CN": "人文社科", en: "Humanities" }),
    humanitiesDescription: t({
      "zh-CN": "人文、社会与跨学科研究",
      en: "Humanities, society and interdisciplinary studies",
    }),
  },
} satisfies Dictionary;

export default taxonomyContent;
