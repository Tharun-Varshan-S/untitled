"""
Log Analysis Service Layer.

Responsibility:
- Encapsulates business logic for automated log analysis (/analyze).
- Prompts LLM for structured root-cause, summary, severity, and remediation steps.
- Safely parses and validates JSON output from LLM provider.
"""

import json
import re
from typing import Optional, Dict, Any
from app.providers.base_provider import BaseProvider
from app.providers.groq_provider import GroqProvider
from app.core.prompt_builder import PromptBuilder, SYSTEM_ANALYSIS_PROMPT
from app.core.exceptions import InvalidProviderResponseException
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AnalysisService:
    """
    Log Analysis Service class.
    
    Why it exists:
    Executes automated log root cause diagnosis, handles JSON parsing resilience,
    and returns structured analysis DTO.
    """

    def __init__(self, provider: Optional[BaseProvider] = None):
        self.provider = provider or GroqProvider()

    async def analyze_logs(self, request: AnalysisRequest) -> AnalysisResponse:
        """
        Processes bulk log root-cause analysis request.
        
        Input: AnalysisRequest DTO
        Output: AnalysisResponse DTO
        """
        logger.info(f"Analyzing {len(request.logs)} logs for workspace={request.workspaceId}, project={request.projectId}")

        prompt = PromptBuilder.build_analysis_prompt(request.logs)

        response = await self.provider.generate(
            prompt=prompt,
            system_prompt=SYSTEM_ANALYSIS_PROMPT,
            temperature=0.1  # Lower temperature for deterministic JSON output
        )

        parsed_data = self._parse_json_response(response.content)

        return AnalysisResponse(
            success=True,
            summary=parsed_data.get("summary", "Log analysis complete."),
            rootCause=parsed_data.get("rootCause", "No specific root cause identified."),
            severity=parsed_data.get("severity", "medium"),
            recommendation=parsed_data.get("recommendation", "Review service logs and monitor system health."),
            provider=response.provider,
            model=response.model,
            latency=response.latency_ms,
            tokenUsage=response.token_usage
        )

    def _parse_json_response(self, raw_content: str) -> Dict[str, Any]:
        """
        Extracts and parses JSON object from LLM response text safely.
        Handles markdown backticks (```json ... ```) or conversational prefix/suffix wrapper text.
        """
        clean_content = raw_content.strip()

        # Strip markdown code block wrappers if present
        if clean_content.startswith("```"):
            clean_content = re.sub(r"^```(?:json)?\n|\n```$", "", clean_content, flags=re.IGNORECASE).strip()

        try:
            data = json.loads(clean_content)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            # Fallback regex search for JSON object inside response string
            json_match = re.search(r"\{.*\}", clean_content, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group(0))
                    if isinstance(data, dict):
                        return data
                except json.JSONDecodeError:
                    pass

        logger.warning(f"Could not parse valid JSON from AI response: {raw_content[:200]}")
        # If parsing fails entirely, raise InvalidProviderResponseException or return structured text
        return {
            "summary": "Log analysis generated unstructured response.",
            "rootCause": raw_content,
            "severity": "medium",
            "recommendation": "Inspect raw logs and system metrics."
        }
