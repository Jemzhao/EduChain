import { t, type Dictionary } from "intlayer";

const profileContent = {
  key: "profile-page",
  content: {
    settingsEyebrow: t({ "zh-CN": "账户设置", en: "Account settings" }),
    settingsTitle: t({ "zh-CN": "公开资料", en: "Public profile" }),
    settingsDescription: t({
      "zh-CN": "维护读者在资源、评论和创作者页面中看到的信息。",
      en: "Manage the information readers see on resources, comments and your creator page.",
    }),
    identityTitle: t({ "zh-CN": "账户身份", en: "Account identity" }),
    identityDescription: t({
      "zh-CN": "邮箱和用户名是账户的稳定标识，暂不支持在此修改。",
      en: "Email and username are stable account identifiers and cannot be changed here.",
    }),
    emailLabel: t({ "zh-CN": "邮箱", en: "Email" }),
    handleLabel: t({ "zh-CN": "用户名", en: "Username" }),
    displayNameLabel: t({ "zh-CN": "显示名称", en: "Display name" }),
    bioLabel: t({ "zh-CN": "个人简介", en: "Biography" }),
    bioDescription: t({ "zh-CN": "最多 500 个字符。", en: "Up to 500 characters." }),
    educationLabel: t({ "zh-CN": "教育背景", en: "Education" }),
    educationDescription: t({ "zh-CN": "最多 160 个字符。", en: "Up to 160 characters." }),
    avatarTitle: t({ "zh-CN": "头像", en: "Profile image" }),
    avatarDescription: t({
      "zh-CN": "上传 JPG、PNG 或 WebP 图片。文件会先经过类型和签名检查。",
      en: "Upload a JPG, PNG or WebP image. The file is checked before it is used.",
    }),
    avatarAction: t({ "zh-CN": "选择头像", en: "Choose image" }),
    avatarUploading: t({ "zh-CN": "正在上传…", en: "Uploading…" }),
    avatarRemove: t({ "zh-CN": "移除头像", en: "Remove image" }),
    avatarError: t({
      "zh-CN": "头像未通过检查或上传失败。",
      en: "The image could not be accepted or uploaded.",
    }),
    locationLabel: t({ "zh-CN": "所在地区", en: "Location" }),
    locationDescription: t({
      "zh-CN": "可选，最多 120 个字符。",
      en: "Optional, up to 120 characters.",
    }),
    websiteLabel: t({ "zh-CN": "个人网站", en: "Website" }),
    websiteDescription: t({
      "zh-CN": "使用以 https:// 开头的完整地址。",
      en: "Use a complete address beginning with https://.",
    }),
    contactEmailLabel: t({ "zh-CN": "公开联系邮箱", en: "Public contact email" }),
    contactEmailDescription: t({
      "zh-CN": "可选；填写后会显示在公开创作者主页。",
      en: "Optional; when provided, it appears on your public creator profile.",
    }),
    validationLocation: t({
      "zh-CN": "所在地区不能超过 120 个字符。",
      en: "Location cannot exceed 120 characters.",
    }),
    validationWebsite: t({
      "zh-CN": "请输入以 https:// 开头的网站地址。",
      en: "Enter a website address beginning with https://.",
    }),
    validationContactEmail: t({
      "zh-CN": "请输入有效的公开联系邮箱。",
      en: "Enter a valid public contact email.",
    }),
    securityLink: t({ "zh-CN": "密码与会话", en: "Password and sessions" }),
    profileLink: t({ "zh-CN": "公开资料", en: "Public profile" }),
    securityEyebrow: t({ "zh-CN": "账户安全", en: "Account security" }),
    securityTitle: t({ "zh-CN": "密码与登录设备", en: "Password and signed-in devices" }),
    securityDescription: t({
      "zh-CN": "更新密码会撤销全部登录会话；也可以单独移除不再使用的设备。",
      en: "Changing your password revokes every session. You can also remove devices individually.",
    }),
    passwordTitle: t({ "zh-CN": "修改密码", en: "Change password" }),
    currentPasswordLabel: t({ "zh-CN": "当前密码", en: "Current password" }),
    newPasswordLabel: t({ "zh-CN": "新密码", en: "New password" }),
    confirmPasswordLabel: t({ "zh-CN": "确认新密码", en: "Confirm new password" }),
    changePasswordAction: t({
      "zh-CN": "更新密码并退出全部设备",
      en: "Change password and sign out everywhere",
    }),
    changingPassword: t({ "zh-CN": "正在更新…", en: "Changing…" }),
    passwordMismatch: t({
      "zh-CN": "两次输入的新密码不一致。",
      en: "The new passwords do not match.",
    }),
    passwordInvalid: t({ "zh-CN": "当前密码不正确。", en: "The current password is incorrect." }),
    passwordReuse: t({
      "zh-CN": "新密码不能与当前密码相同。",
      en: "The new password must be different.",
    }),
    passwordChangeError: t({
      "zh-CN": "暂时无法更新密码。",
      en: "The password could not be changed.",
    }),
    sessionsTitle: t({ "zh-CN": "登录设备", en: "Signed-in devices" }),
    sessionsDescription: t({
      "zh-CN": "只保留你认识并仍在使用的会话。",
      en: "Keep only sessions you recognize and still use.",
    }),
    currentSession: t({ "zh-CN": "当前设备", en: "Current device" }),
    sessionCreated: t({ "zh-CN": "登录于", en: "Signed in" }),
    sessionExpires: t({ "zh-CN": "到期于", en: "Expires" }),
    revokeSession: t({ "zh-CN": "移除设备", en: "Remove device" }),
    revokingSession: t({ "zh-CN": "正在移除…", en: "Removing…" }),
    sessionsError: t({
      "zh-CN": "暂时无法读取登录设备。",
      en: "Signed-in devices could not be loaded.",
    }),
    saveAction: t({ "zh-CN": "保存更改", en: "Save changes" }),
    savingAction: t({ "zh-CN": "正在保存…", en: "Saving…" }),
    savedMessage: t({ "zh-CN": "资料已保存。", en: "Profile saved." }),
    signOutAction: t({ "zh-CN": "退出登录", en: "Sign out" }),
    signingOutAction: t({ "zh-CN": "正在退出…", en: "Signing out…" }),
    loading: t({ "zh-CN": "正在读取资料…", en: "Loading profile…" }),
    authenticationRequiredTitle: t({ "zh-CN": "请先登录", en: "Sign in required" }),
    authenticationRequiredDescription: t({
      "zh-CN": "登录后即可编辑公开资料。",
      en: "Sign in to edit your public profile.",
    }),
    signInAction: t({ "zh-CN": "前往登录", en: "Go to sign in" }),
    validationDisplayName: t({ "zh-CN": "请输入显示名称。", en: "Enter a display name." }),
    validationBio: t({
      "zh-CN": "个人简介不能超过 500 个字符。",
      en: "Biography cannot exceed 500 characters.",
    }),
    validationEducation: t({
      "zh-CN": "教育背景不能超过 160 个字符。",
      en: "Education cannot exceed 160 characters.",
    }),
    versionConflict: t({
      "zh-CN": "资料已在其他位置更新，请刷新后再编辑。",
      en: "This profile changed elsewhere. Refresh before editing again.",
    }),
    loadError: t({ "zh-CN": "暂时无法读取资料。", en: "The profile could not be loaded." }),
    saveError: t({
      "zh-CN": "暂时无法保存资料，请稍后重试。",
      en: "The profile could not be saved. Try again shortly.",
    }),
    publicProfileEyebrow: t({ "zh-CN": "创作者资料", en: "Creator profile" }),
    educationEmpty: t({ "zh-CN": "暂未填写教育背景", en: "No education details yet" }),
    bioEmpty: t({
      "zh-CN": "这位创作者暂未填写个人简介。",
      en: "This creator has not added a biography yet.",
    }),
    publishedResources: t({ "zh-CN": "公开资源", en: "Published resources" }),
    followers: t({ "zh-CN": "关注者", en: "Followers" }),
    following: t({ "zh-CN": "正在关注", en: "Following" }),
    loadingConnections: t({
      "zh-CN": "正在读取关注关系…",
      en: "Loading connections…",
    }),
    connectionsEmpty: t({
      "zh-CN": "这里还没有内容。",
      en: "Nothing here yet.",
    }),
    connectionsError: t({
      "zh-CN": "暂时无法读取关注关系。",
      en: "Connections could not be loaded.",
    }),
    notFound: t({ "zh-CN": "没有找到这位创作者。", en: "This creator could not be found." }),
  },
} satisfies Dictionary;

export default profileContent;
