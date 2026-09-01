"""
Solution Recommendation Subsystem (Phase 4)
Generates structured candidate solutions mapped to actual Saadhyam capabilities,
strategy types, risk levels, and empirical evidence.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.problem_engine import (
    Problem,
    ProblemRootCause,
    ProblemSolution,
    ProblemStatus,
    ProblemCategory,
    StrategyType,
    RiskLevel,
)

logger = logging.getLogger(__name__)


class SolutionGenerator:
    """Service to synthesize and recommend actionable solutions for diagnosed problems."""

    @classmethod
    async def generate_solutions(
        cls, db: AsyncSession, user_id: int, problem_id: int
    ) -> List[ProblemSolution]:
        """
        Synthesizes candidate solutions for a diagnosed problem.
        Maps issues to existing Saadhyam plugins/agents/voice capabilities.
        """
        stmt = (
            select(Problem)
            .where(
                and_(
                    Problem.id == problem_id,
                    Problem.user_id == user_id,
                )
            )
            .options(
                selectinload(Problem.observations),
                selectinload(Problem.evidence_items),
                selectinload(Problem.root_causes),
                selectinload(Problem.solutions),
            )
        )
        res = await db.execute(stmt)
        problem = res.scalar_one_or_none()

        if not problem:
            raise ValueError(f"Problem #{problem_id} not found for user #{user_id}")

        candidates_data: List[Dict[str, Any]] = []

        if problem.category == ProblemCategory.REVENUE_LEAKAGE:
            # Solution 1: Automated Payment Recovery Notification (Recommended)
            recovery_target = problem.estimated_impact_inr or 0.0
            candidates_data.append({
                "title": "Automated WhatsApp & Email Cart Recovery Sequence",
                "description": "Dispatch instant payment link reminders via WhatsApp & Email within 15 minutes of checkout payment failure.",
                "strategy_type": StrategyType.AUTOMATION,
                "risk_level": RiskLevel.LOW,
                "expected_impact": "HIGH",
                "estimated_cost_inr": 250.0,
                "expected_roi_multiplier": round(max(2.0, (recovery_target * 0.45) / max(250.0, 1.0)), 1),
                "implementation_time_hours": 0.5,
                "confidence": 0.92,
                "required_plugin_keys": ["sales_order_management", "whatsapp"],
                "required_agent_ids": ["sales_recovery_bot"],
                "required_voice_usage": False,
                "is_recommended": True,
            })
            # Solution 2: Outbound Voice AI Agent Payment Assistance
            candidates_data.append({
                "title": "Voice AI Payment Assistance Concierge",
                "description": "Deploy voice AI agent to proactively call customers with high-value failed orders (> ₹10,000) to assist with checkout.",
                "strategy_type": StrategyType.VOICE_AI,
                "risk_level": RiskLevel.MEDIUM,
                "expected_impact": "HIGH",
                "estimated_cost_inr": 750.0,
                "expected_roi_multiplier": round(max(1.5, (recovery_target * 0.60) / max(750.0, 1.0)), 1),
                "implementation_time_hours": 1.0,
                "confidence": 0.85,
                "required_plugin_keys": ["sales_order_management"],
                "required_agent_ids": ["outbound_voice_agent"],
                "required_voice_usage": True,
                "is_recommended": False,
            })

        elif problem.category == ProblemCategory.ANOMALY:
            # Anomaly resolution
            candidates_data.append({
                "title": "Telephony Gateway Auto-Failover & Health Polling",
                "description": "Enable automated health checks on SIP trunk lines with automatic failover to secondary WebRTC provider upon packet loss.",
                "strategy_type": StrategyType.AUTOMATION,
                "risk_level": RiskLevel.LOW,
                "expected_impact": "HIGH",
                "estimated_cost_inr": 0.0,
                "expected_roi_multiplier": 3.0,
                "implementation_time_hours": 0.25,
                "confidence": 0.90,
                "required_plugin_keys": [],
                "required_agent_ids": [],
                "required_voice_usage": True,
                "is_recommended": True,
            })

        elif problem.category == ProblemCategory.CUSTOMER_CHURN:
            # Lead re-engagement
            candidates_data.append({
                "title": "Multi-Channel AI Lead Re-Engagement Campaign",
                "description": "Trigger personalized multi-touch follow-up sequence offering customized consultation time for lost prospects.",
                "strategy_type": StrategyType.AI_AGENT,
                "risk_level": RiskLevel.LOW,
                "expected_impact": "HIGH",
                "estimated_cost_inr": 500.0,
                "expected_roi_multiplier": 4.5,
                "implementation_time_hours": 1.0,
                "confidence": 0.88,
                "required_plugin_keys": ["sales_email_marketing", "whatsapp"],
                "required_agent_ids": ["lead_nurturing_agent"],
                "required_voice_usage": False,
                "is_recommended": True,
            })

        elif problem.category == ProblemCategory.BOTTLENECK:
            # HR Interview Scheduler sequence
            candidates_data.append({
                "title": "Automated WhatsApp & Calendar Interview Reminder Sequence",
                "description": "Send automated interview confirmation with Google Meet link via WhatsApp at 24 hours and 1 hour before scheduled time.",
                "strategy_type": StrategyType.AUTOMATION,
                "risk_level": RiskLevel.LOW,
                "expected_impact": "HIGH",
                "estimated_cost_inr": 100.0,
                "expected_roi_multiplier": 5.0,
                "implementation_time_hours": 0.5,
                "confidence": 0.94,
                "required_plugin_keys": ["hr_interview_scheduler", "whatsapp"],
                "required_agent_ids": ["interview_scheduler_bot"],
                "required_voice_usage": False,
                "is_recommended": True,
            })

        elif problem.category == ProblemCategory.PRODUCTIVITY:
            # Daily task automation
            candidates_data.append({
                "title": "AI Task Prioritization & Recurring Workflow Automation",
                "description": "Auto-schedule recurring marketing and sales tasks with AI-assisted drafting to reduce manual employee burden.",
                "strategy_type": StrategyType.WORKFLOW_CHANGE,
                "risk_level": RiskLevel.LOW,
                "expected_impact": "MEDIUM",
                "estimated_cost_inr": 0.0,
                "expected_roi_multiplier": 3.5,
                "implementation_time_hours": 1.5,
                "confidence": 0.86,
                "required_plugin_keys": ["ai_productivity_email_assistant"],
                "required_agent_ids": ["task_manager_agent"],
                "required_voice_usage": False,
                "is_recommended": True,
            })

        elif problem.category == ProblemCategory.GOAL_DEVIATION:
            candidates_data.append({
                "title": "Workload Rebalancing & Milestone Sprint Realignment",
                "description": "Rebalance operational quotas across active team members and establish high-impact 3-day sprint milestones.",
                "strategy_type": StrategyType.WORKFLOW_CHANGE,
                "risk_level": RiskLevel.MEDIUM,
                "expected_impact": "HIGH",
                "estimated_cost_inr": 0.0,
                "expected_roi_multiplier": 2.5,
                "implementation_time_hours": 2.0,
                "confidence": 0.82,
                "required_plugin_keys": [],
                "required_agent_ids": [],
                "required_voice_usage": False,
                "is_recommended": True,
            })

        elif problem.category == ProblemCategory.RISK:
            candidates_data.append({
                "title": "WABA Template Health Check & Token Auto-Refresh",
                "description": "Validate WhatsApp message template approval status and establish automated OAuth token refresh before batch sending.",
                "strategy_type": StrategyType.AUTOMATION,
                "risk_level": RiskLevel.LOW,
                "expected_impact": "HIGH",
                "estimated_cost_inr": 0.0,
                "expected_roi_multiplier": 4.0,
                "implementation_time_hours": 0.5,
                "confidence": 0.91,
                "required_plugin_keys": ["whatsapp"],
                "required_agent_ids": [],
                "required_voice_usage": False,
                "is_recommended": True,
            })

        else:
            candidates_data.append({
                "title": "Operational Process Review & Standard Operating Procedure Update",
                "description": "Conduct administrative review of workflow steps and update standard operational guidelines.",
                "strategy_type": StrategyType.WORKFLOW_CHANGE,
                "risk_level": RiskLevel.LOW,
                "expected_impact": "MEDIUM",
                "estimated_cost_inr": 0.0,
                "expected_roi_multiplier": 1.5,
                "implementation_time_hours": 1.0,
                "confidence": 0.75,
                "required_plugin_keys": [],
                "required_agent_ids": [],
                "required_voice_usage": False,
                "is_recommended": True,
            })

        persisted_solutions = []
        for s_item in candidates_data:
            existing_sol = next((s for s in problem.solutions if s.title == s_item["title"]), None)
            if existing_sol:
                existing_sol.description = s_item["description"]
                existing_sol.strategy_type = s_item["strategy_type"]
                existing_sol.risk_level = s_item["risk_level"]
                existing_sol.expected_impact = s_item["expected_impact"]
                existing_sol.estimated_cost_inr = s_item["estimated_cost_inr"]
                existing_sol.expected_roi_multiplier = s_item["expected_roi_multiplier"]
                existing_sol.implementation_time_hours = s_item["implementation_time_hours"]
                existing_sol.confidence = s_item["confidence"]
                existing_sol.required_plugin_keys = s_item["required_plugin_keys"]
                existing_sol.required_agent_ids = s_item["required_agent_ids"]
                existing_sol.required_voice_usage = s_item["required_voice_usage"]
                existing_sol.is_recommended = s_item["is_recommended"]
                persisted_solutions.append(existing_sol)
            else:
                sol = ProblemSolution(
                    problem_id=problem.id,
                    title=s_item["title"],
                    description=s_item["description"],
                    strategy_type=s_item["strategy_type"],
                    risk_level=s_item["risk_level"],
                    expected_impact=s_item["expected_impact"],
                    estimated_cost_inr=s_item["estimated_cost_inr"],
                    expected_roi_multiplier=s_item["expected_roi_multiplier"],
                    implementation_time_hours=s_item["implementation_time_hours"],
                    confidence=s_item["confidence"],
                    required_plugin_keys=s_item["required_plugin_keys"],
                    required_agent_ids=s_item["required_agent_ids"],
                    required_voice_usage=s_item["required_voice_usage"],
                    is_recommended=s_item["is_recommended"],
                    created_at=datetime.utcnow(),
                )
                db.add(sol)
                persisted_solutions.append(sol)

        # Update problem status to SOLUTION_PROPOSED if earlier in lifecycle
        if problem.status in (ProblemStatus.DETECTED, ProblemStatus.INVESTIGATING, ProblemStatus.CONFIRMED, ProblemStatus.PLANNING):
            problem.status = ProblemStatus.PLANNING
            problem.updated_at = datetime.utcnow()

        await db.commit()
        return persisted_solutions
