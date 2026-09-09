from pipeline.parsers.cga_html import parse_cga_monthly_report


JULY_REPORT = """
<html><body>
<p>AS AT THE END OF JULY 2026</p>
<table>
<tr><th>1</th><th>Revenue Receipts</th><th></th><th>3533150</th><th>1267573</th><th>35.9%</th></tr>
<tr><th>2</th><th>Tax Revenue (Net)</th><th></th><th>2866922</th><th>844560</th><th>29.5%</th></tr>
<tr><th>3</th><th>Non-Tax Revenue</th><th></th><th>666228</th><th>423013</th><th>63.5%</th></tr>
<tr><th>4</th><th>Non-Debt Capital Receipts</th><th></th><th>118397</th><th>39136</th><th>33.1%</th></tr>
<tr><th>7</th><th>Total Receipts (1+4)</th><th></th><th>3651547</th><th>1306709</th><th>35.8%</th></tr>
<tr><th>8</th><th>Revenue Expenditure</th><th></th><th>4125494</th><th>1311218</th><th>31.8%</th></tr>
<tr><th>9</th><th>of which Interest Payments</th><th></th><th>1403972</th><th>426566</th><th>30.4%</th></tr>
<tr><th>10</th><th>Capital Expenditure</th><th></th><th>1221821</th><th>450635</th><th>36.9%</th></tr>
<tr><th>12</th><th>Total Expenditure (8+10)</th><th></th><th>5347315</th><th>1761853</th><th>32.9%</th></tr>
<tr><th>13</th><th>Fiscal Deficit (12-7)</th><th></th><th>1695768</th><th>455144</th><th>26.8%</th></tr>
</table>
</body></html>
"""


def test_cga_html_parser_normalizes_core_july_values():
    source = parse_cga_monthly_report(
        JULY_REPORT,
        report_url="https://cga.nic.in/MonthlyReport/Published/7/2026-2027.aspx",
        retrieved_at="2026-09-09",
    )

    assert source["reporting_period"] == "apr-jul"
    assert source["data"]["revenue_receipts"] == 1267573
    assert source["data"]["non_borrowed_receipts"] == 1306709
    assert source["data"]["capital_expenditure"] == 450635
    assert source["data"]["fiscal_deficit"] == 455144
    assert source["source"]["url"].endswith("7/2026-2027.aspx")
