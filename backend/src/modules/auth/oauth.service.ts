import { config } from '../../config/env';
import UserModel from '../../models/User';
import { signJwt } from '../../utils/jwt';
import { AuthPayload } from './auth.types';
import { logger } from '../../utils/logger';

export const handleOAuthLogin = async (
  email: string,
  name: string,
  provider: 'google' | 'github',
  providerId: string,
  avatarUrl?: string
) => {
  let user = await UserModel.findOne({ email });

  if (user) {
    // If user exists but used local auth, we can just link the provider or log them in
    if (user.authProvider !== provider) {
      // Opt to update the provider or just allow them in. For simplicity, we just log them in
      // and maybe update the providerId if missing.
      if (!user.providerId) {
        user.authProvider = provider;
        user.providerId = providerId;
        if (avatarUrl) user.avatarUrl = avatarUrl;
        await user.save();
      }
    }
  } else {
    // Create new user without a password
    const createPayload: any = {
      email,
      name,
      authProvider: provider,
      providerId
    };
    if (avatarUrl) createPayload.avatarUrl = avatarUrl;

    user = await UserModel.create(createPayload);
    logger.info(`New user registered via ${provider} OAuth: ${email}`);
  }

  // Generate tokens
  const token = signJwt({ userId: user._id.toString() } as AuthPayload);

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      authProvider: user.authProvider,
      avatarUrl: user.avatarUrl
    },
    token
  };
};

export const getGoogleUserInfo = async (code: string) => {
  const backendUrl = config.nodeEnv === 'production' ? process.env.BACKEND_URL : 'http://localhost:5000';
  const redirectUri = `${backendUrl}/api/v1/auth/google/callback`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to fetch Google access token');
  }

  const tokenData = await tokenResponse.json() as any;
  const access_token = tokenData.access_token;

  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` }
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  return userResponse.json();
};

export const getGithubUserInfo = async (code: string) => {
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      client_secret: process.env.GITHUB_CLIENT_SECRET || '',
      code
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to fetch GitHub access token');
  }

  const tokenData = await tokenResponse.json() as any;
  const access_token = tokenData.access_token;

  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: 'application/json'
    }
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch GitHub user info');
  }

  const userData = await userResponse.json() as any;

  // GitHub email might be null or private, we may need to fetch emails
  if (!userData.email) {
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json'
      }
    });
    const emails = await emailResponse.json() as any[];
    const primaryEmail = emails.find((e: any) => e.primary && e.verified);
    userData.email = primaryEmail ? primaryEmail.email : emails[0]?.email;
  }

  return userData;
};
