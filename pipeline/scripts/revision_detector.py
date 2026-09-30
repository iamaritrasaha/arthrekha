"""Detect whether a newly-fetched CGA period overwrites an already-committed record.

A revision is defined as: the same reporting_period + financial_year already
exists as a committed raw JSON file, and either metric values or the source
HTML hash differs. An existing period with no detected differences is unchanged.

The comparison is performed on the structured values in the JSON 'data' dict,
not on raw bytes, because whitespace formatting may change without the data changing.

When a provenance sidecar (.provenance.json) exists for both the existing and
new records, this module also reports whether the source HTML hash changed —
which is the definitive signal that CGA revised the official document.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def detect_revision(
    new_data: dict[str, Any],
    raw_dir: Path,
    new_sha256: str | None = None,
) -> dict[str, Any]:
    """Compare new_data against any existing committed JSON for the same period.

    Args:
        new_data: The freshly-parsed CGA data dict (must have reporting_period + financial_year).
        raw_dir:  The directory containing committed raw JSON files.
        new_sha256: Optional SHA-256 of the newly fetched HTML (UTF-8 encoded).
                    When provided and an existing provenance sidecar exists, the hashes
                    are compared to detect a silent CGA source revision.
                    When omitted, source_hash_changed reflects the sidecar comparison,
                    which is only meaningful if the sidecar has NOT yet been overwritten.

    Returns a revision report dict with keys:
        is_revision (bool)             — True if data values or source HTML differ
        is_new_period (bool)           — True if no existing record exists
        classification (str)           — new_period, unchanged_existing_period, or revision
        period (str)                   — reporting_period from new_data
        financial_year (str)           — financial_year from new_data
        source_hash_changed (bool|None)— True if HTML hash differs; None if unavailable
        existing_path (str|None)       — path to existing raw JSON if found
        changes (list[dict])           — list of {metric, old, new} for changed values
        new_metrics (list[str])        — metrics present in new_data but not in existing
        removed_metrics (list[str])    — metrics in existing but absent from new_data
    """
    period = new_data.get('reporting_period', '')
    fy = new_data.get('financial_year', '')
    if not period or not fy:
        raise ValueError('new_data must contain reporting_period and financial_year')

    month_end = period.split('-')[-1]
    existing_path = raw_dir / f'cga_{fy}_{month_end}.json'

    if not existing_path.exists():
        return {
            'is_revision': False,
            'is_new_period': True,
            'classification': 'new_period',
            'period': period,
            'financial_year': fy,
            'source_hash_changed': None,
            'existing_path': None,
            'changes': [],
            'new_metrics': [],
            'removed_metrics': [],
        }

    existing = json.loads(existing_path.read_text(encoding='utf-8'))
    existing_values: dict[str, Any] = existing.get('data', {})
    new_values: dict[str, Any] = new_data.get('data', {})

    changes = []
    for metric, new_val in new_values.items():
        old_val = existing_values.get(metric)
        if old_val is not None and old_val != new_val:
            changes.append({'metric': metric, 'old': old_val, 'new': new_val})

    new_metrics = [m for m in new_values if m not in existing_values]
    removed_metrics = [m for m in existing_values if m not in new_values]

    # Check provenance hashes.
    # Priority: use the caller-supplied new_sha256 (most reliable, since the
    # provenance sidecar may already have been overwritten by the refresh step).
    source_hash_changed: bool | None = None
    prov_path = existing_path.with_suffix('.provenance.json')
    if prov_path.exists():
        try:
            existing_prov = json.loads(prov_path.read_text(encoding='utf-8'))
            old_hash = existing_prov.get('sha256_html_utf8')
            if old_hash is not None:
                if new_sha256 is not None:
                    source_hash_changed = new_sha256 != old_hash
                else:
                    # Sidecar may have been overwritten; comparison against itself is False
                    source_hash_changed = False
        except (json.JSONDecodeError, KeyError):
            source_hash_changed = None

    is_revision = bool(changes or new_metrics or removed_metrics or source_hash_changed)
    classification = 'revision' if is_revision else 'unchanged_existing_period'
    return {
        'is_revision': is_revision,
        'is_new_period': False,
        'classification': classification,
        'period': period,
        'financial_year': fy,
        'source_hash_changed': source_hash_changed,
        'existing_path': str(existing_path),
        'changes': changes,
        'new_metrics': new_metrics,
        'removed_metrics': removed_metrics,
    }
