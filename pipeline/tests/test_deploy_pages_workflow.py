from pathlib import Path


WORKFLOW = Path(".github/workflows/deploy-pages.yml").read_text()


def test_pages_workflow_allows_only_main_deployment_scenarios():
    assert "push:\n    branches: [main]" in WORKFLOW
    assert "workflow_dispatch:" in WORKFLOW
    assert "github.event_name != 'workflow_dispatch' || github.ref == 'refs/heads/main'" in WORKFLOW
    assert "with:\n          ref: main" in WORKFLOW
    assert "needs: build\n    if: ${{ needs.build.result == 'success' }}" in WORKFLOW

    scenarios = [
        ("push", "refs/heads/main", True),
        ("workflow_dispatch", "refs/heads/main", True),
        ("workflow_dispatch", "refs/heads/refresh/cga-2026-27-aug", False),
    ]
    for event_name, ref, expected in scenarios:
        build_allowed = event_name != "workflow_dispatch" or ref == "refs/heads/main"
        assert build_allowed is expected
