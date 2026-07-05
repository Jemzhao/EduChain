import { t, type Dictionary } from "intlayer";

const authContent = {
  key: "auth-page",
  content: {
    signInEyebrow: t({ "zh-CN": "欢迎回来", en: "Welcome back" }),
    signInTitle: t({ "zh-CN": "继续你的知识工作", en: "Continue your knowledge work" }),
    signInDescription: t({
      "zh-CN": "登录后管理创作、收藏与可核验的原创记录。",
      en: "Sign in to manage your work, collections and verifiable authorship records.",
    }),
    signUpEyebrow: t({ "zh-CN": "创建账户", en: "Create an account" }),
    signUpTitle: t({ "zh-CN": "从一份可信资料开始", en: "Start with a trustworthy profile" }),
    signUpDescription: t({
      "zh-CN": "建立清晰身份，为后续发布、协作与存证做好准备。",
      en: "Establish a clear identity for publishing, collaboration and evidence.",
    }),
    identifierLabel: t({ "zh-CN": "邮箱或用户名", en: "Email or username" }),
    emailLabel: t({ "zh-CN": "邮箱", en: "Email" }),
    handleLabel: t({ "zh-CN": "用户名", en: "Username" }),
    handleDescription: t({
      "zh-CN": "使用小写字母开头，可包含数字、下划线和连字符。",
      en: "Start with a lowercase letter; numbers, underscores and hyphens are allowed.",
    }),
    displayNameLabel: t({ "zh-CN": "显示名称", en: "Display name" }),
    passwordLabel: t({ "zh-CN": "密码", en: "Password" }),
    passwordDescription: t({
      "zh-CN": "至少 12 个字符，建议组合多种字符类型。",
      en: "Use at least 12 characters and combine different character types.",
    }),
    showPassword: t({ "zh-CN": "显示密码", en: "Show password" }),
    hidePassword: t({ "zh-CN": "隐藏密码", en: "Hide password" }),
    signInAction: t({ "zh-CN": "登录", en: "Sign in" }),
    signingInAction: t({ "zh-CN": "正在登录…", en: "Signing in…" }),
    signUpAction: t({ "zh-CN": "创建账户", en: "Create account" }),
    signingUpAction: t({ "zh-CN": "正在创建…", en: "Creating account…" }),
    noAccount: t({ "zh-CN": "还没有账户？", en: "New to EduChain?" }),
    haveAccount: t({ "zh-CN": "已经有账户？", en: "Already have an account?" }),
    goToSignUp: t({ "zh-CN": "立即创建", en: "Create one" }),
    goToSignIn: t({ "zh-CN": "返回登录", en: "Return to sign in" }),
    forgotPassword: t({ "zh-CN": "忘记密码？", en: "Forgot password?" }),
    resetRequestEyebrow: t({ "zh-CN": "账户恢复", en: "Account recovery" }),
    resetRequestTitle: t({ "zh-CN": "重置你的密码", en: "Reset your password" }),
    resetRequestDescription: t({
      "zh-CN": "输入注册邮箱。无论账户是否存在，系统都会返回相同结果。",
      en: "Enter your account email. The result is the same whether or not an account exists.",
    }),
    resetRequestAction: t({ "zh-CN": "发送重置方式", en: "Send reset instructions" }),
    resetRequestPending: t({ "zh-CN": "正在提交…", en: "Submitting…" }),
    resetRequestAccepted: t({
      "zh-CN": "如果该邮箱关联账户，重置方式已发送。",
      en: "If the email belongs to an account, reset instructions have been sent.",
    }),
    localResetTitle: t({ "zh-CN": "本地演示凭据", en: "Local preview credential" }),
    localResetDescription: t({
      "zh-CN": "仅本地模式显示。打开重置页面时会自动带入。",
      en: "Shown only in local mode and carried into the reset page automatically.",
    }),
    continueReset: t({ "zh-CN": "继续重置", en: "Continue reset" }),
    resetEyebrow: t({ "zh-CN": "设置新密码", en: "Set a new password" }),
    resetTitle: t({ "zh-CN": "建立新的登录凭据", en: "Create a new sign-in credential" }),
    resetDescription: t({
      "zh-CN": "凭据只能使用一次。完成后，原有登录设备会全部退出。",
      en: "The credential works once. Completing the reset signs out every existing device.",
    }),
    resetTokenLabel: t({ "zh-CN": "重置凭据", en: "Reset credential" }),
    newPasswordLabel: t({ "zh-CN": "新密码", en: "New password" }),
    confirmPasswordLabel: t({ "zh-CN": "确认新密码", en: "Confirm new password" }),
    resetAction: t({ "zh-CN": "更新密码", en: "Update password" }),
    resettingAction: t({ "zh-CN": "正在更新…", en: "Updating…" }),
    resetComplete: t({
      "zh-CN": "密码已更新，请重新登录。",
      en: "Password updated. Sign in again.",
    }),
    resetTokenInvalid: t({
      "zh-CN": "重置凭据无效或已过期。",
      en: "The reset credential is invalid or expired.",
    }),
    passwordMismatch: t({ "zh-CN": "两次输入的密码不一致。", en: "The passwords do not match." }),
    demoTitle: t({ "zh-CN": "管理员端演示", en: "Admin workspace demo" }),
    demoHint: t({
      "zh-CN": "一键自动填入演示凭据并进入管理后台。仅在 Mock 模式提供。",
      en: "Fill the demo credentials and enter the admin workspace in one step. Mock mode only.",
    }),
    demoDescription: t({
      "zh-CN": "邮箱 demo@educhain.local，密码 Trustworthy!Demo",
      en: "Email demo@educhain.local, password Trustworthy!Demo",
    }),
    demoAdminAction: t({ "zh-CN": "一键进入管理员端", en: "Enter admin workspace" }),
    demoAdminPending: t({ "zh-CN": "正在进入管理员端…", en: "Opening admin workspace…" }),
    trustTitle: t({
      "zh-CN": "你的身份，是可信内容的起点。",
      en: "Your identity is where trusted content begins.",
    }),
    trustDescription: t({
      "zh-CN": "账户、内容版本和存证记录使用稳定标识关联，同时将敏感凭据保持在安全边界内。",
      en: "Stable identifiers connect accounts, content versions and evidence while credentials stay inside the security boundary.",
    }),
    trustIdentity: t({ "zh-CN": "明确的创作者身份", en: "A clear creator identity" }),
    trustSession: t({ "zh-CN": "可撤销的安全会话", en: "Revocable secure sessions" }),
    trustRecovery: t({
      "zh-CN": "可理解的错误与恢复路径",
      en: "Understandable errors and recovery paths",
    }),
    validationIdentifier: t({
      "zh-CN": "请输入邮箱或用户名。",
      en: "Enter your email or username.",
    }),
    validationEmail: t({ "zh-CN": "请输入有效的邮箱地址。", en: "Enter a valid email address." }),
    validationHandle: t({
      "zh-CN": "请输入符合规则的用户名。",
      en: "Enter a username that follows the rules.",
    }),
    validationDisplayName: t({ "zh-CN": "请输入显示名称。", en: "Enter a display name." }),
    validationPassword: t({
      "zh-CN": "密码至少需要 12 个字符。",
      en: "Password must contain at least 12 characters.",
    }),
    errorInvalidCredentials: t({
      "zh-CN": "邮箱、用户名或密码不正确。",
      en: "The email, username or password is incorrect.",
    }),
    errorIdentifierTaken: t({
      "zh-CN": "该邮箱或用户名已被使用。",
      en: "That email or username is already in use.",
    }),
    errorRestricted: t({
      "zh-CN": "该账户当前受到限制。",
      en: "This account is currently restricted.",
    }),
    errorDisabled: t({ "zh-CN": "该账户已停用。", en: "This account has been disabled." }),
    errorValidation: t({ "zh-CN": "请检查填写内容后重试。", en: "Review the form and try again." }),
    errorGeneric: t({
      "zh-CN": "暂时无法完成请求，请稍后重试。",
      en: "The request could not be completed. Try again shortly.",
    }),
    requestReference: t({ "zh-CN": "请求编号", en: "Request reference" }),
  },
} satisfies Dictionary;

export default authContent;
