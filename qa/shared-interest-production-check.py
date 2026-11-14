"""Read-only verification of shared-interest resources and preserved production files."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent.parent
files = {row['path'].split('?')[0] for row in json.loads((root / 'qa/relationship-review-20261113/production-resources.json').read_text())}
files.update(row['file'] for row in json.loads((root / 'qa/hobbies-20261113/production-resources.json').read_text())['files'])
files.update(row['file'] for row in json.loads((root / 'design/hobbies-20261113/manifest.json').read_text())['sharedInterestMapCards']['runtimeResources'])
files.update(['shared-interest-card-data.js', 'shared-interest-selection.js', 'shared-interest-cards.js', 'shared-interest-pages.js', 'shared-interest-pages.css', 'index.html', 'sw.js', 'batch.js'])

def check(file):
    result = subprocess.run(['curl', '-fLsS', '--retry', '2', '--max-time', '30', 'https://wealth-life.a562089605.workers.dev/' + file], capture_output=True)
    digest = hashlib.sha256(result.stdout).hexdigest()
    return {'file': file, 'sha256': digest, 'matchesLocal': result.returncode == 0 and digest == hashlib.sha256((root / file).read_bytes()).hexdigest(), 'error': result.stderr.decode()[:200]}

with ThreadPoolExecutor(max_workers=8) as executor:
    rows = list(executor.map(check, sorted(files)))
report = {'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(), 'checkedAt': datetime.now(timezone.utc).isoformat(), 'files': rows, 'allMatch': all(row['matchesLocal'] for row in rows)}
(root / 'qa/shared-interest-20261114/production-resources.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'files': len(rows), 'allMatch': report['allMatch'], 'failures': [row['file'] for row in rows if not row['matchesLocal']]}))
raise SystemExit(0 if report['allMatch'] else 1)
