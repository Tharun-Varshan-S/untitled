"""
Prompt construction utility separating prompt engineering from services.

Responsibility:
- Defines system instructions for AI model persona.
- Enforces strict anti-hallucination rules.
- Formats log lines and user questions safely into prompt templates.
- Truncates oversized log arrays to preserve token budget.
"""

from typing import List, Optional

SYSTEM_CHAT_PROMPT = """You are LogLens AI, an expert DevOps, Site Reliability Engineering (SRE), and Log Analysis Assistant.

Strict Rules:
1. Ground your answer strictly in the provided log entries and technical context.
2. If the provided logs do not contain sufficient evidence to answer the question, state clearly: "Based on the provided logs, there is insufficient evidence to determine..."
3. Do NOT hallucinate error messages, stack traces, or server IPs that are not in the logs.
4. Keep answers concise, technical, and actionable. Use markdown formatting for code snippets, error codes, and recommendations.
"""

SYSTEM_ANALYSIS_PROMPT = """You are LogLens AI, an automated observability system performing root-cause log analysis.

Instructions:
1. Carefully analyze the provided set of server and application logs.
2. Identify patterns, recurring stack traces, failed service calls, and anomalies.
3. You MUST format your response as a valid JSON object matching this exact schema:
{
    "summary": "Brief 1-2 sentence executive summary of log events",
    "rootCause": "Detailed technical root cause analysis based strictly on the logs",
    "severity": "low | medium | high | critical",
    "recommendation": "Step-by-step actionable remediation steps for SREs/DevOps"
}
4. Respond ONLY with the JSON object. Do not include markdown code block backticks (`json`) or conversational prefix text.
"""


class PromptBuilder:
    """
    Prompt Builder class.
    
    Why it exists:
    Isolates prompt engineering logic from API services and AI providers.
    Ensures prompt consistency across different LLM backends.
    """

    MAX_LOG_CHARS = 15000  # Safe context window boundary for log lines

    @classmethod
    def build_chat_prompt(cls, question: str, logs: List[str]) -> str:
        """
        Builds user prompt for chat endpoint.
        
        Input: question (str), logs (List[str])
        Output: Formatted prompt string combining log context and user query.
        """
        formatted_logs = cls._format_logs(logs)
        
        prompt = (
            f"--- LOG CONTEXT START ---\n"
            f"{formatted_logs}\n"
            f"--- LOG CONTEXT END ---\n\n"
            f"USER QUESTION: {question}\n\n"
            f"Please analyze the provided logs and answer the user question."
        )
        return prompt

    @classmethod
    def build_analysis_prompt(cls, logs: List[str]) -> str:
        """
        Builds prompt for log analysis endpoint requesting JSON output.
        
        Input: logs (List[str])
        Output: Formatted prompt string for log analysis.
        """
        formatted_logs = cls._format_logs(logs)
        
        prompt = (
            f"--- LOG DATA FOR ANALYSIS ---\n"
            f"{formatted_logs}\n"
            f"--- END LOG DATA ---\n\n"
            f"Perform automated log analysis on the logs above and return the required JSON response object."
        )
        return prompt

    @classmethod
    def _format_logs(cls, logs: List[str]) -> str:
        """
        Formats and clips raw log entries to prevent token overflow.
        """
        if not logs:
            return "[No log entries provided]"

        joined_logs = "\n".join(f"[{idx + 1}] {line}" for idx, line in enumerate(logs))
        if len(joined_logs) > cls.MAX_LOG_CHARS:
            truncated = joined_logs[:cls.MAX_LOG_CHARS]
            return f"{truncated}\n... [LOGS TRUNCATED DUE TO SIZE LIMIT]"
        return joined_logs
