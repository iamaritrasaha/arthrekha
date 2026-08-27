#!/usr/bin/env python3
"""
Run data ingestion pipeline
"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pipeline.scripts.ingest import run_ingestion

if __name__ == "__main__":
    success = run_ingestion()
    sys.exit(0 if success else 1)
