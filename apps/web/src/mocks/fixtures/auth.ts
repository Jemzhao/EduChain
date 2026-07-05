import type { components } from "@educhain/api-contract";

export type MockCurrentUser = components["schemas"]["CurrentUserResponse"];

export const demoPassword = "Trustworthy!Demo";

export const demoUser: MockCurrentUser = {
  user: {
    id: "65d0903a-68b4-4f4d-9daa-a3f4985758c7",
    handle: "demo_creator",
    displayName: "EduChain Creator",
    avatarUrl: null,
    status: "ACTIVE",
    version: 0,
  },
  email: "demo@educhain.local",
  roles: ["USER", "ADMINISTRATOR"],
  profile: {
    bio: "",
    education: "",
    location: "",
    websiteUrl: "",
    contactEmail: "",
  },
};

export const mayaUser: MockCurrentUser = {
  user: {
    id: "65d0903a-68b4-4f4d-9daa-a3f4985758c8",
    handle: "maya_chen",
    displayName: "Maya Chen",
    avatarUrl: null,
    status: "ACTIVE",
    version: 0,
  },
  email: "maya@educhain.local",
  roles: ["USER"],
  profile: {
    bio: "关注可解释检索、学习设计与可信数字内容。",
    education: "Learning Sciences",
    location: "天津",
    websiteUrl: "https://example.com/maya",
    contactEmail: "maya.public@example.com",
  },
};

const additionalUserProfiles = [
  ["lin_zhiyuan", "林知远", "lin@educhain.local", "分布式系统与可信计算", "软件工程", "南京"],
  ["zhou_yuan", "周予安", "zhou@educhain.local", "开放教育资源与知识组织", "教育技术学", "杭州"],
  ["alex_wu", "吴承宇", "alex@educhain.local", "Java 后端与领域建模", "计算机科学", "上海"],
  ["sophia_li", "李思涵", "sophia@educhain.local", "无障碍设计与学习体验", "交互设计", "北京"],
  ["chen_mo", "陈默", "chen@educhain.local", "信息检索、排序与评测", "人工智能", "武汉"],
  ["tang_yi", "唐一", "tang@educhain.local", "数据库、审计与数据治理", "网络空间安全", "成都"],
  ["nora_xu", "许诺", "nora@educhain.local", "课程设计与数字人文", "数字媒体", "西安"],
  ["he_jing", "何静", "he@educhain.local", "工程数学与可视化表达", "应用数学", "广州"],
  ["sun_qi", "孙启", "sun@educhain.local", "区块链工程与密码学实践", "信息安全", "深圳"],
  ["gao_ran", "高然", "gao@educhain.local", "前端架构与国际化", "软件工程", "苏州"],
] as const;

export const additionalUsers: MockCurrentUser[] = additionalUserProfiles.map(
  ([handle, displayName, email, bio, education, location], index) => ({
    user: {
      id: `65d0903a-68b4-4f4d-9daa-${String(index + 100).padStart(12, "0")}`,
      handle,
      displayName,
      avatarUrl: null,
      status: index === 9 ? "RESTRICTED" : "ACTIVE",
      version: 0,
    },
    email,
    roles: ["USER"],
    profile: { bio, education, location, websiteUrl: "", contactEmail: "" },
  }),
);

export const mockUsers = [demoUser, mayaUser, ...additionalUsers];
