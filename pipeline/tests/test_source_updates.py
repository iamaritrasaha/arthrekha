from pipeline.source_updates import (
    compare_release_to_dataset,
    current_dataset_period,
    latest_cga_release,
    parse_cga_releases,
    period_end_month,
    monthly_report_url,
)


INDEX_HTML = """
<html><body>
  <a href="/News/Release-of-Union-Government-Accounts-upto-June-2026.aspx">
    Release of Union Government Accounts upto June 2026
  </a>
  <a title="Release of Union Government Accounts upto July 2026"
     href="/News/Release-of-Union-Government-Accounts-upto-July-2026.aspx">Read</a>
  <a href="/News/other.aspx">Other announcement</a>
</body></html>
"""


def test_release_parser_orders_monthly_notices_and_resolves_urls():
    releases = parse_cga_releases(INDEX_HTML)

    assert len(releases) == 2
    assert releases[0].month == "july"
    assert releases[0].period == "apr-jul"
    assert releases[0].url == "https://cga.nic.in/News/Release-of-Union-Government-Accounts-upto-July-2026.aspx"
    assert monthly_report_url(releases[0], "2026-27") == "https://cga.nic.in/MonthlyReport/Published/7/2026-2027.aspx"


def test_period_helpers_are_explicit():
    assert period_end_month("apr") == 4
    assert period_end_month("apr-jun") == 6
    assert period_end_month("apr-jul") == 7
    assert period_end_month(None) is None


def test_dataset_comparison_detects_new_release_without_mutating_data():
    dataset = {"financialYear": "2026-27", "metadata": {"latestPeriod": "apr-jun"}}
    report = compare_release_to_dataset(latest_cga_release(INDEX_HTML), dataset)

    assert report["status"] == "new_release"
    assert report["currentPeriod"] == "apr-jun"
    assert report["release"]["reportingPeriod"] == "apr-jul"
    assert dataset["metadata"]["latestPeriod"] == "apr-jun"


def test_dataset_comparison_handles_current_release():
    dataset = {"financialYear": "2026-27", "metadata": {"latestPeriod": "apr-jul"}}
    report = compare_release_to_dataset(latest_cga_release(INDEX_HTML), dataset)

    assert report["status"] == "up_to_date"


def test_dataset_period_falls_back_to_observations():
    dataset = {
        "observations": [
            {"estimateType": "provisional", "period": "apr"},
            {"estimateType": "provisional", "period": "apr-jun"},
            {"estimateType": "BE", "period": None},
        ]
    }

    assert current_dataset_period(dataset) == "apr-jun"
