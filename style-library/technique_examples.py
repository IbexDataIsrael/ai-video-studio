"""Shared source-backed example validation for registration and final approval."""
import math
import re
from pathlib import Path
import project_index as index
import prepare_assets
from security import registered_file


def register_examples(catalog, entry, plan, evidence_records, root):
    """Attach verified examples to one video, keeping existing links and user visibility."""
    if not isinstance(plan, list) or not entry.get('media_path'):
        raise ValueError('Provide a list of technique examples for a playable video.')
    source_file = registered_file(root, entry['media_path'], {'.mp4', '.mov', '.webm', '.m4v'})
    digest = index.digest(source_file)
    families = {t['id']: t for t in catalog.setdefault('techniques', [])}
    existing = {(t['id'], x['id']): x for t in families.values() for x in t['examples'] if x['style_id'] == entry['id']}
    checked = set()
    duration = entry.get('duration')
    if isinstance(duration, bool) or not isinstance(duration, (int, float)) or not math.isfinite(duration) or duration <= 0:
        raise ValueError('A technique source needs a measured video duration.')
    snapshot = {'source_version': entry['version'], 'source_path': entry['media_path'], 'source_sha256': digest}
    if any(x['source_path'] == entry['media_path'] and x['source_sha256'] != digest for x in existing.values()):
        raise ValueError('Keep the previous media and use a new path for changed video bytes.')
    fresh_posters = []
    for row in plan:
        if not isinstance(row, dict) or set(row) != {'family', 'example'}:
            raise ValueError('Each technique needs a family and an example.')
        family, example = row['family'], row['example']
        family_id, example_id = family['id'], example['id']
        if not re.fullmatch(r'tech-[a-z0-9]+(?:-[a-z0-9]+)*', family_id) or not index.TOKEN.fullmatch(example_id):
            raise ValueError('Use stable lowercase technique and example IDs.')
        if set(example) != {'id', 'label', 'start', 'end', 'poster_at', 'poster', 'evidence'}:
            raise ValueError('Include a label, range, poster and evidence for each example.')
        if any(not isinstance(example[k], str) or not example[k].strip() for k in ('label', 'evidence')):
            raise ValueError('Describe what was verified in each example.')
        start, end, at = (example[k] for k in ('start', 'end', 'poster_at'))
        if any(type(v) not in (int, float) or not math.isfinite(v) for v in (start, end, at)) or not 0 <= start <= at < end <= duration:
            raise ValueError('Choose a playable example window and poster frame.')
        poster_path = Path(example['poster'])
        assets = root / 'style-library/dist'
        if (poster_path.parts[:2] != ('assets', 'techniques') or
                not (assets / poster_path).resolve().is_relative_to(assets / 'assets/techniques') or
                poster_path.suffix.lower() not in {'.jpg', '.png', '.webp'}):
            raise ValueError('Use a versioned poster under assets/techniques.')
        key = (family_id, example_id)
        if key in checked:
            raise ValueError('Include each example once in the analysis.')
        checked.add(key)
        if family_id not in families:
            if set(family) != {'id', 'title', 'category', 'summary', 'direction', 'aliases', 'keep', 'avoid', 'evidence'}:
                raise ValueError('Give a new family a title, category, direction and evidence.')
            if (any(not isinstance(family[k], str) or not family[k].strip()
                    for k in ('title', 'category', 'summary', 'direction', 'evidence')) or
                any(not isinstance(family[k], list) or any(not isinstance(v, str) for v in family[k])
                    for k in ('aliases', 'keep', 'avoid'))):
                raise ValueError('Describe the new technique family.')
            families[family_id] = dict(family, default_example=example_id, examples=[])
            catalog['techniques'].append(families[family_id])
        examples = families[family_id]['examples']
        prior = next((x for x in examples if x['id'] == example_id), None)
        if prior is not None and prior['style_id'] != entry['id']:
            raise ValueError('This example ID belongs to another reference.')
        if prior and all(prior.get(k) == v for k, v in snapshot.items()):
            # Existing example links and notes point to the original range.
            continue
        if prior and prior['poster'] == example['poster']:
            raise ValueError('Give a changed source a fresh versioned poster.')
        if not prior and any(
            x['style_id'] == entry['id'] and all(x.get(k) == v for k, v in snapshot.items())
            and abs(x['start'] - start) <= .25 and abs(x['end'] - end) <= .25
            for x in examples
        ):
            continue
        saved = dict(example, style_id=entry['id'], **snapshot)
        if prior:
            examples[examples.index(prior)] = saved
        else:
            examples.append(saved)
        fresh_posters.append((poster_path.as_posix(), at))
    if any(key not in checked and any(x.get(k) != v for k, v in snapshot.items()) for key, x in existing.items()):
        raise ValueError('Recheck every existing example when changing its video source.')
    for path, at in fresh_posters:
        prepare_assets.poster(source_file, path, at)
    entry['source_sha256'] = digest
    evidence_records[:] = [r for r in evidence_records if r['id'] != entry['id']]
    evidence_records.append({'id': entry['id'], 'source': entry['media_path'], 'version': entry['version'], 'source_sha256': digest})
    return source_file, digest

