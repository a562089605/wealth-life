"""Read the separate handoff package; never overwrite game code or saves."""
import argparse, collections, hashlib, json
from pathlib import Path
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('package', type=Path)
args = p.parse_args()
root = Path(__file__).resolve().parents[1]
source = json.loads((args.package / 'CANDIDATE_ART_MANIFEST.json').read_text())
manifest_path = root / 'art-integration-manifest.json'
manifest = json.loads(manifest_path.read_text())
selected = {
    52: ('shift-promotion-pending', '咖啡师晋升主管：已确认次月生效', '仅经理与员工庆祝场景；排除旧日期、薪资及奖励'),
    53: ('shift-promotion-preview', '咖啡师晋升主管：资格与薪资预览', '仅经理递主管帽与咖啡师场景；排除旧经验、状态与薪资'),
    79: ('coffee-course', '饮品制作基础课程预览', '仅咖啡杯、磨豆机和书本；排除旧25XP与次数限制'),
    0: ('barista-portrait', '咖啡师背景预览及当前咖啡师工作页', '人物明确确认；完整人物图，无静态金额'),
    305: ('pet-time-shortage', '到期宠物照护：已选耗时大于可用时间', '仅时钟及护理物品区域，排除旧3h/7h/4h'),
    306: ('pet-funds-shortage', '到期宠物照护：已选费用大于现金', '仅钱包及护理物品区域，排除旧金额及按钮'),
    310: ('pet-crocodile-care', '只有一只鳄鱼时的宠物照护页', '仅鳄鱼插画，排除旧名字、已完成标记、费用'),
    340: ('bank-application', '银行/学生贷款表单', '仅合同与硬币区域，排除旧金额/利率/期限'),
    341: ('bank-payment', '我的贷款：本月还款确认页', '仅湖边书桌顶部场景，排除旧贷款与金额')
}
groups = collections.defaultdict(list)
for f in source['files']:
    groups[f['original_sha256']].append(f['library_file_id'])
existing_sources = {str(e['source'].get('libraryId') or '').removeprefix('libfile_'): e['id'] for e in manifest['entries']}
previous_candidates={r['index']:r for r in manifest.get('candidateEntries',[])}
records, bad = [], []
for index, f in enumerate(source['files']):
    path = (args.package / f['path']).resolve()
    if not path.is_relative_to(args.package.resolve()):
        raise ValueError('Unsafe candidate path')
    error = None
    data = path.read_bytes()
    try:
        with Image.open(path) as im:
            if im.size != (f['width'], f['height']):
                raise ValueError('Dimension mismatch')
            im.load()
        if len(data) != f['bytes']:
            raise ValueError('Byte count mismatch')
    except Exception as exc:
        error = str(exc)
        bad.append(f['library_file_id'])
    original = existing_sources.get(f['library_file_id'].removeprefix('libfile_'))
    mapping = selected.get(index)
    status = 'invalid-empty-or-undecodable' if error else 'existing-integration' if original else 'candidate-not-visually-reviewed'
    if mapping:
        if error:
            raise ValueError('Selected invalid image')
        status = 'new-integration'
        resource = 'assets/career/' + mapping[0] + '.webp'
        if (root / resource).read_bytes() != data:
            raise ValueError('Production image differs from supplied candidate')
        entry = {
            'id': mapping[0], 'source': {'originalName': f['original_name'], 'libraryId': f['library_file_id'], 'evidence': ['CANDIDATE_ART_MANIFEST.json', 'docs/reference/wealth-life-artwork-index-2026-10-24.md (private handoff)']},
            'resourcePath': resource,
            'gitBlobSha': hashlib.sha1(('blob ' + str(len(data)) + '\0').encode() + data).hexdigest(),
            'pageOrEvent': mapping[1], 'integrationStatus': 'new-integration', 'addedInExistingPR': False,
            'duplicateOrOldDraft': 'scene-only; historical UI excluded',
            'verification': {'bytes': 'exact-supplied-WebP', 'visualReview': mapping[2], 'browser': next((e['verification']['browser'] for e in manifest['entries'] if e['id']==mapping[0]), 'pending')},
            'rules': '真实数据及原动作保持权威；不复制图片静态数值'
        }
        manifest['entries'] = [e for e in manifest['entries'] if e['id'] != mapping[0]] + [entry]
    elif original:
        resource = next(e['resourcePath'] for e in manifest['entries'] if e['id'] == original)
    else:
        resource = None
    records.append({
        'index': index, 'libraryId': f['library_file_id'], 'originalName': f['original_name'],
        'packagePath': f['path'], 'productionResourcePath': resource,
        'repositoryResourcePath': f['path'],
        'repositoryBytesVerified': (root/f['path']).is_file() and (root/f['path']).read_bytes()==data,
        'dimensions': [f['width'], f['height']], 'actualBytes': len(data),
        'webpSha256': hashlib.sha256(data).hexdigest(), 'originalPngSha256': f['original_sha256'],
        'exactOriginalDuplicateGroup': groups[f['original_sha256']] if len(groups[f['original_sha256']]) > 1 else [],
        'status': status, 'validationError': error,
        'oldDraftReview': 'visually-reviewed-scene-only' if mapping else 'pending-visual-and-rule-review'
    })
for record in records:
    prior=previous_candidates.get(record['index'])
    if prior and prior['status']=='reviewed-deferred' and record['status']=='candidate-not-visually-reviewed':
        record['status']=prior['status'];record['oldDraftReview']=prior['oldDraftReview']
manifest['scope'] = f"{len(manifest['entries'])} production illustrations; 459 candidate records remain separate from integration counts."
manifest['candidatePackage'] = {
    'status': 'downloaded-and-audited', 'expectedCount': source['count'], 'actualRecords': len(records),
    'readableImages': len(records) - len(bad), 'invalidImages': len(bad),
    'uniqueReadableWebpHashes': len({r['webpSha256'] for r in records if not r['validationError']}),
    'duplicateReadableWebpRows': len(records)-len(bad)-len({r['webpSha256'] for r in records if not r['validationError']}),
    'uniqueOriginalPngHashes': len(groups), 'exactOriginalDuplicateRows': sum(len(v)-1 for v in groups.values()),
    'note': 'Original PNG hashes are provenance only; supplied WebPs are lossy conversions. All supplied candidate files are archived under assets/candidates/ and excluded from deployment; only selected production images are integrated. Private references are not published.'
}
manifest['candidateEntries'] = records
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(manifest['candidatePackage'], ensure_ascii=False))
