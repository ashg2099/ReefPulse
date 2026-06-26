import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crewai import Task
from agents.reef_agents import data_collector_agent, rag_analyst_agent, health_assessor_agent

def create_data_collection_task(snapshot: dict) -> Task:
    return Task(
        description=f"""Analyse and summarise the following real-time reef sensor data 
        collected for location lat={snapshot['location']['latitude']}, 
        lon={snapshot['location']['longitude']}:

        THERMAL STRESS:
        - Sea Surface Temperature: {snapshot['thermal_stress']['sst_celsius']}°C
        - Degree Heating Weeks: {snapshot['thermal_stress']['dhw_celsius_weeks']} °C-weeks
        - Bleaching Alert Level: {snapshot['thermal_stress']['bleaching_alert']} ({snapshot['thermal_stress']['bleaching_status']})

        MARINE CONDITIONS:
        - Wave Height: {snapshot['marine_conditions']['wave_height_m']}m
        - Swell Height: {snapshot['marine_conditions']['swell_wave_height_m']}m
        - Wave Period: {snapshot['marine_conditions']['wave_period_s']}s

        WEATHER:
        - Air Temperature: {snapshot['weather']['air_temp_celsius']}°C
        - Wind Speed: {snapshot['weather']['wind_speed_kmh']} km/h
        - Humidity: {snapshot['weather']['humidity_pct']}%

        Summarise what these readings mean for reef conditions. Flag any values 
        that are outside normal ranges.""",
        expected_output="A clear summary of current reef sensor readings with any anomalies flagged",
        agent=data_collector_agent()
    )

def create_rag_analysis_task(snapshot: dict) -> Task:
    sst = snapshot['thermal_stress']['sst_celsius']
    dhw = snapshot['thermal_stress']['dhw_celsius_weeks']
    alert = snapshot['thermal_stress']['bleaching_status']

    return Task(
        description=f"""Using your scientific knowledge of the Great Barrier Reef, 
        provide context for these current conditions:
        - SST: {sst}°C
        - DHW: {dhw} °C-weeks  
        - Bleaching Alert: {alert}

        Answer these questions:
        1. Is the current SST within or above the bleaching threshold for this region?
        2. What does the current DHW level mean for coral stress?
        3. What historical bleaching events had similar conditions?
        4. Which coral species in this region are most at risk?
        5. What are the likely outcomes if these conditions persist for another 2-4 weeks?""",
        expected_output="Scientific context answering all 5 questions with specific GBR references",
        agent=rag_analyst_agent()
    )

def create_health_assessment_task() -> Task:
    return Task(
        description="""Based on the data summary and scientific analysis provided by 
        your colleagues, produce a final reef health assessment report containing:

        1. OVERALL HEALTH SCORE: Rate current reef health from 0-100
        2. RISK LEVEL: One of [CRITICAL, HIGH, MODERATE, LOW, GOOD]
        3. KEY FINDINGS: 3 bullet points summarising the most important findings
        4. IMMEDIATE CONCERNS: Any conditions requiring urgent attention
        5. OUTLOOK: 2-4 week forecast based on current trends
        6. RECOMMENDATIONS: 2-3 actionable steps for reef managers

        Write this for a non-scientific audience — clear, direct language only.""",
        expected_output="A structured reef health report with score, risk level, findings, concerns, outlook and recommendations",
        agent=health_assessor_agent()
    )