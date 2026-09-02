"""
Problem Engine Detection Rules Registry & Export
"""

from typing import List
from services.problem_engine.detection.base import BaseDetectionRule
from services.problem_engine.detection.rules.orders_rules import OrderPaymentFailureRule
from services.problem_engine.detection.rules.voice_lead_rules import VoiceCallFailureRule, LeadLossRateRule
from services.problem_engine.detection.rules.interview_rules import InterviewNoShowRule
from services.problem_engine.detection.rules.tasks_growth_rules import TaskExecutionBottleneckRule, GrowthMetricDropRule
from services.problem_engine.detection.rules.messaging_rules import WhatsAppCampaignFailureRule, LinkedInPublishFailureRule
from services.problem_engine.detection.rules.opportunity_rules import (
    RepeatCustomerUpsellOpportunityRule,
    AbandonedCheckoutRecoveryOpportunityRule,
    OperationalEfficiencyOpportunityRule,
)


def get_default_detection_rules() -> List[BaseDetectionRule]:
    """Returns a list of initialized default detection rules."""
    return [
        OrderPaymentFailureRule(),
        VoiceCallFailureRule(),
        LeadLossRateRule(),
        InterviewNoShowRule(),
        TaskExecutionBottleneckRule(),
        GrowthMetricDropRule(),
        WhatsAppCampaignFailureRule(),
        LinkedInPublishFailureRule(),
        RepeatCustomerUpsellOpportunityRule(),
        AbandonedCheckoutRecoveryOpportunityRule(),
        OperationalEfficiencyOpportunityRule(),
    ]


__all__ = [
    "get_default_detection_rules",
    "OrderPaymentFailureRule",
    "VoiceCallFailureRule",
    "LeadLossRateRule",
    "InterviewNoShowRule",
    "TaskExecutionBottleneckRule",
    "GrowthMetricDropRule",
    "WhatsAppCampaignFailureRule",
    "LinkedInPublishFailureRule",
    "RepeatCustomerUpsellOpportunityRule",
    "AbandonedCheckoutRecoveryOpportunityRule",
    "OperationalEfficiencyOpportunityRule",
]
