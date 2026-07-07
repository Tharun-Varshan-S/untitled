import { Request, Response } from 'express';
import { config } from '../../config/env';
import { getGoogleUserInfo, getGithubUserInfo, handleOAuthLogin } from './oauth.service';
import { logger } from '../../utils/logger';

// Gets the frontend URL. Used for redirecting with ?token=...
const getFrontendUrl = () => {
  return config.nodeEnv === 'production' ? (process.env.FRONTEND_URL || 'https://your-production-url.com') : 'http://localhost:3000';
};

// Gets the backend URL. Used as redirect URI for OAuth providers.
const getBackendUrl = () => {
  return config.nodeEnv === 'production' ? (process.env.BACKEND_URL || 'https://api.your-production-url.com') : 'http://localhost:5000';
};

export const googleLogin = (req: Request, res: Response) => {
  const redirectUri = `${getBackendUrl()}/api/v1/auth/google/callback`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email profile`;
  res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.redirect(`${getFrontendUrl()}/login?error=GoogleAuthFailed`);
    }

    const userInfo = await getGoogleUserInfo(code) as any;
    
    // User info includes: email, name, id, picture
    const loginResult = await handleOAuthLogin(
      userInfo.email,
      userInfo.name || userInfo.email.split('@')[0],
      'google',
      userInfo.id,
      userInfo.picture
    );

    res.redirect(`${getFrontendUrl()}/login?token=${loginResult.token}`);
  } catch (error) {
    logger.error('Google OAuth Error: ' + (error instanceof Error ? error.message : String(error)));
    res.redirect(`${getFrontendUrl()}/login?error=GoogleAuthFailed`);
  }
};

export const githubLogin = (req: Request, res: Response) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email`;
  res.redirect(url);
};

export const githubCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.redirect(`${getFrontendUrl()}/login?error=GithubAuthFailed`);
    }

    const userInfo = await getGithubUserInfo(code) as any;
    
    // User info includes: email, login (name fallback), id, avatar_url
    const loginResult = await handleOAuthLogin(
      userInfo.email,
      userInfo.name || userInfo.login,
      'github',
      userInfo.id.toString(),
      userInfo.avatar_url
    );

    res.redirect(`${getFrontendUrl()}/login?token=${loginResult.token}`);
  } catch (error) {
    logger.error('GitHub OAuth Error: ' + (error instanceof Error ? error.message : String(error)));
    res.redirect(`${getFrontendUrl()}/login?error=GithubAuthFailed`);
  }
};
