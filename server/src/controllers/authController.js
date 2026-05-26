const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const asyncHandler = require("../utils/asyncHandler");
const env = require("../config/env");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokens");
const { sendResetEmail } = require("../services/emailService");

const googleClient = new OAuth2Client(env.googleClientId || undefined);

const { getSubscriptionSnapshot } = require("../utils/subscription");

const serializeUser = (user) => {
  const base = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    skills: user.skills,
    headline: user.headline,
    provider: user.provider,
    emailNotifications: user.emailNotifications,
    marketingEmails: user.marketingEmails,
  };

  // include subscription snapshot so clients have plan/status immediately on login
  try {
    const snap = getSubscriptionSnapshot(user);
    return { ...base, ...snap };
  } catch (e) {
    return base;
  }
};

const issueAuthPayload = (user) => {
  const basePayload = {
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
  };
  return {
    accessToken: signAccessToken(basePayload),
    refreshToken: signRefreshToken(basePayload),
    user: serializeUser(user),
  };
};

const setRefreshCookie = (res, token) => {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // default 7 days
  // For cross-site requests (frontend hosted on a different origin
  // such as Vercel previews), the refresh cookie must be set with
  // SameSite=None and Secure=true so the browser will include it on
  // XHR/fetch requests with credentials. In development use lax to
  // simplify local testing.
  const sameSite = env.nodeEnv === "production" ? "none" : "lax";
  const secure = env.nodeEnv === "production";

  res.cookie("sra_refresh_token", token, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge,
  });
};

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email already in use" });

  const user = await User.create({ name, email, password, provider: "local" });
  const payload = issueAuthPayload(user);
  // persist refresh token for revocation/rotation support
  try {
    await RefreshToken.create({
      token: payload.refreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  } catch (e) {
    // don't fail signup if token persistence fails
    console.warn("Could not persist refresh token", e?.message || e);
  }
  setRefreshCookie(res, payload.refreshToken);
  return res.status(201).json(payload);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  // Development convenience: if running in development and the account does
  // not exist, auto-provision an admin with the requested credentials so
  // local testing is easier. This code path is disabled in production.
  if (!user) {
    if (process.env.NODE_ENV === "development") {
      const newUser = await User.create({
        name: "Dev Admin",
        email,
        password,
        role: email === "admin@example.com" ? "admin" : "user",
        provider: "local",
      });
      // reload with password selected for comparison just in case
      const reloaded = await User.findById(newUser._id).select("+password");
      if (!(await reloaded.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      return res.json(issueAuthPayload(reloaded));
    }
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const payload = issueAuthPayload(user);
  try {
    await RefreshToken.create({
      token: payload.refreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  } catch (e) {
    console.warn("Could not persist refresh token", e?.message || e);
  }
  setRefreshCookie(res, payload.refreshToken);
  return res.json(payload);
});

const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!env.googleClientId) {
    return res
      .status(400)
      .json({ message: "Google OAuth is not configured on server" });
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    return res.status(400).json({ message: "Invalid Google token payload" });
  }

  let user = await User.findOne({ email: payload.email });
  if (!user) {
    user = await User.create({
      name: payload.name || "Google User",
      email: payload.email,
      avatarUrl: payload.picture || "",
      provider: "google",
    });
  }

  const data = issueAuthPayload(user);
  try {
    await RefreshToken.create({
      token: data.refreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  } catch (e) {
    console.warn("Could not persist refresh token", e?.message || e);
  }
  setRefreshCookie(res, data.refreshToken);
  return res.json(data);
});

const refresh = asyncHandler(async (req, res) => {
  const incoming = req.cookies?.sra_refresh_token || req.body?.refreshToken;
  if (!incoming)
    return res.status(401).json({ message: "Missing refresh token" });

  try {
    const decoded = verifyRefreshToken(incoming);
    const tokenDoc = await RefreshToken.findOne({
      token: incoming,
      user: decoded.sub,
      revoked: false,
    });
    if (!tokenDoc)
      return res.status(401).json({ message: "Invalid refresh token" });

    const user = await User.findById(decoded.sub);
    if (!user) return res.status(401).json({ message: "Invalid user" });

    // revoke the old token and issue a new one (rotation)
    tokenDoc.revoked = true;
    await tokenDoc.save();

    const payload = issueAuthPayload(user);
    await RefreshToken.create({
      token: payload.refreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    setRefreshCookie(res, payload.refreshToken);
    return res.json(payload);
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
});

const logout = asyncHandler(async (req, res) => {
  const incoming = req.cookies?.sra_refresh_token || req.body?.refreshToken;
  if (incoming) {
    await RefreshToken.updateMany({ token: incoming }, { revoked: true });
  }
  // clear cookie - include cookie options to ensure it is removed in
  // cross-site contexts (must match how it was set)
  const clearOptions = {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
  };
  res.clearCookie("sra_refresh_token", clearOptions);
  return res.json({ loggedOut: true });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.json({
      message: "If the account exists, reset instructions were sent.",
    });

  const token = crypto.randomBytes(24).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetLink = `${env.clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  await sendResetEmail({ to: email, resetLink });

  const payload = {
    message: "If the account exists, reset instructions were sent.",
  };

  if (env.nodeEnv !== "production") {
    payload.resetLink = resetLink;
  }

  return res.json(payload);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    email,
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+password");

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  user.password = newPassword;
  user.resetPasswordToken = "";
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.json({ message: "Password reset successful" });
});

const me = asyncHandler(async (req, res) => {
  return res.json({ user: req.user });
});

module.exports = {
  signup,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  me,
  refresh,
  logout,
};
