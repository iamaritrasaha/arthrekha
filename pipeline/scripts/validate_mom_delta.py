"""Month-on-month delta validator for CGA monthly raw JSON.

Loads the most recent prior-period raw JSON for the same FY and compares
every metric. The validator produces a structured report; it does NOT
automatically reject data solely because a delta is large, because large
month-on-month swings are expected for capital expenditure in Q3/Q4.

Every large delta is advisory. Deltas beyond WARN_PCT are flagged for review;
movements beyond SEVERE_PCT receive a prominent warning. Percentage magnitude
alone never rejects candidate data.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

WARN_PCT = 75.0        # Flag for human review in PR body
SEVERE_PCT = 500.0     # Prominent review warning; magnitude alone never rejects data

_FISCAL_MONTH_ORDER = {
    'apr': 0, 'may': 1, 'jun': 2, 'jul': 3, 'aug': 4,
    'sep': 5, 'oct': 6, 'nov': 7, 'dec': 8, 'jan': 9, 'feb': 10, 'mar': 11,
}


def _period_rank(period: str) -> int:
    return _FISCAL_MONTH_ORDER.get(period.split('-')[-1], -1)


def find_previous_period_file(current_period: str, fy: str, raw_dir: Path) -> Path | None:
    """Return the raw JSON for the most recent period before current_period."""
    current_rank = _period_rank(current_period)
    if current_rank < 0:
        return None
    candidates: list[tuple[int, Path]] = []
    for f in raw_dir.glob(f'cga_{fy}_*.json'):
        try:
            data = json.loads(f.read_text(encoding='utf-8'))
        except (json.JSONDecodeError, OSError):
            continue
        period = data.get('reporting_period', '')
        rank = _period_rank(period)
        if 0 <= rank < current_rank:
            candidates.append((rank, f))
    if not candidates:
        return None
    return max(candidates, key=lambda x: x[0])[1]


def validate_mom_delta(
    new_data: dict[str, Any],
    raw_dir: Path,
    warn_pct: float = WARN_PCT,
    severe_pct: float = SEVERE_PCT,
) -> dict[str, Any]:
    """Compare new CGA JSON values against the most recent prior period.

    Returns a structured report:
        status: 'no_previous_period' | 'ok' | 'warnings'
        current_period (str)
        previous_period (str | None)
        deltas (list[dict]):  metric, prev, new, delta_pct, flag
          flag: 'ok' | 'warning' | 'severe_warning' | 'prev_zero' | 'new_metric'
        warned_metrics (list[str])
        severe_warning_metrics (list[str])
    """
    current_period = new_data.get('reporting_period', '')
    fy = new_data.get('financial_year', '')
    new_values: dict[str, Any] = new_data.get('data', {})

    prev_file = find_previous_period_file(current_period, fy, raw_dir)
    if prev_file is None:
        return {
            'status': 'no_previous_period',
            'current_period': current_period,
            'previous_period': None,
            'deltas': [
                {'metric': m, 'prev': None, 'new': v, 'delta_pct': None, 'flag': 'no_previous_period'}
                for m, v in new_values.items()
            ],
            'warned_metrics': [],
            'severe_warning_metrics': [],
        }

    prev_data = json.loads(prev_file.read_text(encoding='utf-8'))
    prev_period = prev_data.get('reporting_period', '')
    prev_values: dict[str, Any] = prev_data.get('data', {})

    deltas = []
    warned: list[str] = []
    severe_warnings: list[str] = []

    for metric, new_val in new_values.items():
        prev_val = prev_values.get(metric)
        if prev_val is None:
            deltas.append({'metric': metric, 'prev': None, 'new': new_val, 'delta_pct': None, 'flag': 'new_metric'})
            continue
        if prev_val == 0:
            delta_pct = None
            flag = 'prev_zero'
        else:
            delta_pct = (new_val - prev_val) / abs(prev_val) * 100
            if abs(delta_pct) >= severe_pct:
                flag = 'severe_warning'
                severe_warnings.append(metric)
            elif abs(delta_pct) >= warn_pct:
                flag = 'warning'
                warned.append(metric)
            else:
                flag = 'ok'
        deltas.append({
            'metric': metric,
            'prev': prev_val,
            'new': new_val,
            'delta_pct': round(delta_pct, 2) if delta_pct is not None else None,
            'flag': flag,
        })

    if warned or severe_warnings:
        status = 'warnings'
    else:
        status = 'ok'

    return {
        'status': status,
        'current_period': current_period,
        'previous_period': prev_period,
        'deltas': deltas,
        'warned_metrics': warned,
        'severe_warning_metrics': severe_warnings,
    }


def main(argv: list[str] | None = None) -> int:
    import argparse
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--json-path', required=True, type=Path)
    p.add_argument('--report-path', type=Path)
    p.add_argument('--warn-pct', type=float, default=WARN_PCT)
    p.add_argument('--severe-pct', '--hard-limit-pct', dest='severe_pct', type=float, default=SEVERE_PCT,
                   help='Threshold for a prominent warning only; never a publication failure')
    args = p.parse_args(argv)

    data = json.loads(args.json_path.read_text(encoding='utf-8'))
    report = validate_mom_delta(data, args.json_path.parent, args.warn_pct, args.severe_pct)

    if args.report_path:
        args.report_path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')

    print(f'Delta status: {report["status"]}')
    print(f'Period: {report["current_period"]} vs {report["previous_period"]}')
    if report['warned_metrics']:
        print(f'::warning::Large month-on-month deltas (>{args.warn_pct}%): {", ".join(report["warned_metrics"])}')
    if report.get('severe_warning_metrics'):
        print(f'::warning::Severe month-on-month deltas (>{args.severe_pct}%): {", ".join(report["severe_warning_metrics"])}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
