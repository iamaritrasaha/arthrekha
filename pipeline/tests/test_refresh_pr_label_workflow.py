import json
import os
from pathlib import Path
import subprocess
import tempfile

WORKFLOW = Path(".github/workflows/refresh.yml").read_text()


def _fake_gh(tmp_path):
    log_path = tmp_path / "gh-calls.jsonl"
    executable = tmp_path / "gh"
    executable.write_text(
        "#!/usr/bin/env python3\n"
        "import json, os, sys\n"
        "args = sys.argv[1:]\n"
        "with open(os.environ['GH_CALL_LOG'], 'a', encoding='utf-8') as stream:\n"
        "    stream.write(json.dumps(args) + '\\n')\n"
        "if args[:2] == ['pr', 'create']:\n"
        "    if os.environ.get('CREATE_FAILS') == '1':\n"
        "        print('PR create failed', file=sys.stderr); sys.exit(1)\n"
        "    print('https://github.com/example/repo/pull/42')\n"
        "elif args[:2] == ['pr', 'edit'] and '--add-label' in args:\n"
        "    if os.environ.get('LABEL_FAILS') == '1':\n"
        "        print(\"label 'data-refresh' not found\", file=sys.stderr); sys.exit(1)\n"
        "elif args[:2] == ['pr', 'edit']:\n"
        "    pass\n"
        "elif args[:2] == ['pr', 'view']:\n"
        "    print('https://github.com/example/repo/pull/42')\n"
        "else:\n"
        "    print('unexpected gh command: ' + repr(args), file=sys.stderr); sys.exit(2)\n",
        encoding="utf-8",
    )
    executable.chmod(0o755)
    return executable, log_path


def _run_step(script, executable, log_path, tmp_path, *, label_fails=False, create_fails=False):
    output_path = tmp_path / "github-output.txt"
    env = {
        **os.environ,
        "PATH": f"{executable.parent}{os.pathsep}{os.environ['PATH']}",
        "GH_CALL_LOG": str(log_path),
        "GITHUB_OUTPUT": str(output_path),
        "BRANCH": "refresh/cga-2026-27-aug",
        "EXISTING_PR": "",
        "PR_URL": "https://github.com/example/repo/pull/42",
        "REPORTING_PERIOD": "apr-aug",
        "FINANCIAL_YEAR": "2026-27",
        "LABEL_FAILS": "1" if label_fails else "0",
        "CREATE_FAILS": "1" if create_fails else "0",
    }
    result = subprocess.run(["bash", "-e", "-c", script], env=env, capture_output=True, text=True)
    return result, output_path


def _workflow_steps():
    scripts = {}
    for name in ("Create or update PR", "Apply optional data-refresh label"):
        marker = f"      - name: {name}\n"
        step_start = WORKFLOW.index(marker)
        run_marker = "        run: |\n"
        run_start = WORKFLOW.index(run_marker, step_start) + len(run_marker)
        next_step = WORKFLOW.find("\n      - name:", run_start)
        if next_step < 0:
            next_step = len(WORKFLOW)
        lines = WORKFLOW[run_start:next_step].splitlines()
        scripts[name] = "\n".join(line[10:] if line.startswith("          ") else line for line in lines)
    return scripts


def test_optional_label_keeps_pr_creation_independent_and_nonfatal():
    with tempfile.TemporaryDirectory() as directory:
        _assert_optional_label_path(Path(directory))


def _assert_optional_label_path(tmp_path):
    steps = _workflow_steps()
    create_script = steps["Create or update PR"]
    label_script = steps["Apply optional data-refresh label"]

    assert "permissions:\n  contents: write\n  pull-requests: write" in WORKFLOW
    assert "  issues:" not in WORKFLOW
    assert "--label" not in create_script
    assert "gh pr create" in create_script
    assert "--add-label data-refresh" in label_script
    assert '::warning::Could not apply optional data-refresh label' in label_script

    # Existing labels are applied after a successful PR create.
    executable, log_path = _fake_gh(tmp_path)
    created, output_path = _run_step(create_script, executable, log_path, tmp_path)
    assert created.returncode == 0, created.stderr
    pr_url = output_path.read_text().strip().split("=", 1)[1]
    labeled, _ = _run_step(
        label_script, executable, log_path, tmp_path,
        label_fails=False,
    )
    assert labeled.returncode == 0, labeled.stderr
    calls = [json.loads(line) for line in log_path.read_text().splitlines()]
    assert ["pr", "create"] == calls[0][:2]
    assert "--add-label" in calls[1]
    assert pr_url == "https://github.com/example/repo/pull/42"


def test_missing_label_warns_but_keeps_successful_pr():
    with tempfile.TemporaryDirectory() as directory:
        _assert_missing_label_path(Path(directory))


def _assert_missing_label_path(tmp_path):
    steps = _workflow_steps()
    executable, log_path = _fake_gh(tmp_path)
    created, output_path = _run_step(steps["Create or update PR"], executable, log_path, tmp_path)
    assert created.returncode == 0, created.stderr
    assert output_path.read_text().startswith("url=https://github.com/")

    label_script = steps["Apply optional data-refresh label"]
    env = {
        **os.environ,
        "PATH": f"{executable.parent}{os.pathsep}{os.environ['PATH']}",
        "GH_CALL_LOG": str(log_path),
        "GITHUB_OUTPUT": str(output_path),
        "PR_URL": "https://github.com/example/repo/pull/42",
        "LABEL_FAILS": "1",
        "CREATE_FAILS": "0",
    }
    labeled = subprocess.run(["bash", "-e", "-c", label_script], env=env, capture_output=True, text=True)
    assert labeled.returncode == 0, labeled.stderr
    assert "::warning::Could not apply optional data-refresh label" in labeled.stdout


def test_pr_creation_failure_remains_fatal():
    with tempfile.TemporaryDirectory() as directory:
        _assert_pr_creation_failure(Path(directory))


def _assert_pr_creation_failure(tmp_path):
    steps = _workflow_steps()
    executable, log_path = _fake_gh(tmp_path)
    failed, _ = _run_step(
        steps["Create or update PR"], executable, log_path, tmp_path,
        create_fails=True,
    )
    assert failed.returncode != 0
    assert "PR create failed" in failed.stderr
