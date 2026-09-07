import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import LogModel from '../models/Log';
import { config } from '../config/env';
import axios from 'axios';

const getProjectIdFromRequest = (req: Request): string => {
  const project = (req as any).project;
  if (!project?.id) {
    throw new AppError('Project context missing', 401, 'PROJECT_CONTEXT_MISSING');
  }
  return project.id;
};

const getWorkspaceIdFromRequest = (req: Request): string => {
  const project = (req as any).project;
  if (!project?.workspaceId) {
    throw new AppError('Workspace context missing', 401, 'WORKSPACE_CONTEXT_MISSING');
  }
  return project.workspaceId.toString();
};

export const chatController = async (req: Request, res: Response) => {
  const projectId = getProjectIdFromRequest(req);
  const workspaceId = getWorkspaceIdFromRequest(req);
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.length < 3) {
    throw new AppError('A valid question (min 3 characters) is required', 400, 'INVALID_QUESTION');
  }

  // Fetch the last 50 logs as context for the AI
  const recentLogs = await LogModel.find({ projectId })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

  const formattedLogs = recentLogs.map(log => 
    `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()} [${log.service}] ${log.message}`
  );

  try {
    // Forward the request to the FastAPI AI Service
    const aiResponse = await axios.post(
      `${config.aiServiceUrl}/chat`,
      {
        workspaceId,
        projectId,
        question,
        logs: formattedLogs
      },
      {
        headers: {
          'X-Service-Key': config.serviceKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    return res.status(200).json(aiResponse.data);
  } catch (error: any) {
    console.error('AI Service Error:', error.response?.data || error.message);
    
    // Pass along FastAPI errors if they exist, otherwise throw a generic 503
    if (error.response && error.response.status === 401) {
      throw new AppError('Internal AI Service Authentication Failed', 500, 'AI_AUTH_FAILED');
    }
    
    if (error.response && error.response.status === 422) {
      throw new AppError('Invalid payload sent to AI Service', 500, 'AI_VALIDATION_ERROR');
    }
    
    throw new AppError(
      'The AI Service is temporarily unavailable or unreachable. Please try again later.',
      503,
      'AI_SERVICE_UNAVAILABLE'
    );
  }
};
