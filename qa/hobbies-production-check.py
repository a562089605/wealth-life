"""Read-only byte verification of new activities plus preserved production resources."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent.parent
files = {row['file'] for row in json.loads((root / 'qa/relationship-avatars-20261113/production-resources.json').read_text())['files']}
files.update(row['file'] for row in json.loads((root / 'design/hobbies-20261113/manifest.json').read_text())['runtimeResources'])
files.update(['hobby-learning.js', 'hobby-pages.js', 'hobby-pages.css', 'annual.js', 'batch.js'])

def check(file):
    url = 'https://wealth-life.a562089605.workers.dev/' + ('' if file == 'index.html' else file)
    result = subprocess.run(['curl', '-fLsS', '--max-time', '30', url], capture_output=True)
    digest = hashlib.sha256(result.stdout).hexdigest()
    return {'file': file, 'sha256': digest, 'matchesLocal': result.returncode == 0 and digest == hashlib.sha256((root / file).read_bytes()).hexdigest(), 'error': result.stderr.decode()[:200]}

with ThreadPoolExecutor(max_workers=6) as executor:
    rows = list(executor.map(check, sorted(files)))
report = {'functionalCommit': '4f3ab2d', 'checkedAt': datetime.now(timezone.utc).isoformat(), 'files': rows, 'allMatch': all(row['matchesLocal'] for row in rows)}
(root / 'qa/hobbies-20261113/production-resources.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'files': len(rows), 'allMatch': report['allMatch'], 'failures': [row['file'] for row in rows if not row['matchesLocal']]}))
raise SystemExit(0 if report['allMatch'] else 1)
