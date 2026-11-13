"""Read-only production byte verification against this checkout."""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'design/relationship-avatars-20261113/manifest.json').read_text())
files = {row['file'] for row in manifest['runtimeResources']}
files.update(row['file'] for row in json.loads((root / 'qa/education-20261113/production-resources.json').read_text())['files'])
files.add('relationship-avatars.js')

def check(file):
    url = 'https://wealth-life.a562089605.workers.dev/' + ('' if file == 'index.html' else file)
    result = subprocess.run(['curl', '-fLsS', '--max-time', '30', url], capture_output=True)
    digest = hashlib.sha256(result.stdout).hexdigest()
    expected = hashlib.sha256((root / file).read_bytes()).hexdigest()
    return {'file': file, 'sha256': digest, 'matchesLocal': result.returncode == 0 and digest == expected, 'error': result.stderr.decode()[:200]}

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
    rows = list(executor.map(check, sorted(files)))
report = {'functionalCommit': '9d30acf', 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'files': rows, 'allMatch': all(row['matchesLocal'] for row in rows)}
destination = root / 'qa/relationship-avatars-20261113/production-resources.json'
destination.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'files': len(rows), 'allMatch': report['allMatch'], 'failures': [row['file'] for row in rows if not row['matchesLocal']]}))
raise SystemExit(0 if report['allMatch'] else 1)
