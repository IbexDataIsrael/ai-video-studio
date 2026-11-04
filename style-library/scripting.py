"""Optional script briefs and private writing memory. No AI calls or approval changes."""
from datetime import datetime, timezone
import hashlib
import json
import re
import uuid
import project_index as index
import project_script
import review_actions as storage
from feedback import project_for, FeedbackError


def text(value, limit):
    if not isinstance(value, str) or len(value) > limit:
        raise FeedbackError('Use a shorter text value.', 400)
    return value.strip()


def token(value):
    try:
        if str(uuid.UUID(value)) != value: raise ValueError()
    except (ValueError, TypeError, AttributeError):
        raise FeedbackError('Use a new request identity.', 400)


def fingerprint(value):
    return hashlib.sha256(storage.json_bytes(value)).hexdigest()


def read(path, empty):
    if path.resolve() != path.absolute() or not path.resolve().is_relative_to(index.STUDIO.resolve()):
        raise FeedbackError('Writing files need safe local paths. Existing files are preserved.', 503)
    if not path.exists():
        data = {'schema_version': 1, 'current': None, 'versions': []}
        return data, empty, fingerprint(None)
    if not path.is_file() or path.stat().st_size > 8_000_000:
        raise FeedbackError('Writing history needs attention in chat. It is preserved.', 503)
    raw = path.read_bytes()
    data = json.loads(raw)
    if not isinstance(data, dict) or data.get('schema_version') != 1 or not isinstance(data.get('versions'), list):
        raise FeedbackError('Writing history needs repair. It is preserved.', 503)
    ids = set()
    for version in data['versions']:
        if (not isinstance(version, dict) or version.get('id') != fingerprint(version.get('value')) or
                version['id'] in ids or not isinstance(version.get('request_ids'), list) or
                any(not isinstance(v, str) for v in version['request_ids'])):
            raise FeedbackError('Writing history needs repair. It is preserved.', 503)
        ids.add(version['id'])
    current = next((v for v in data['versions'] if v['id'] == data.get('current')), None)
    if current is None:
        raise FeedbackError('The current writing version is unavailable. Existing history is preserved.', 503)
    return data, current['value'], hashlib.sha256(raw).hexdigest()


def write(path, data, value, revision, request_id, expected=None):
    token(request_id)
    if not isinstance(revision, str) or not re.fullmatch('[a-f0-9]{64}', revision):
        raise FeedbackError('Reload the writing context before saving.', 400)
    for version in data['versions']:
        if request_id in version['request_ids']:
            if value != version['value']: raise FeedbackError('This request was already used for different writing context.')
            return
    actual = index.digest(path) if path.exists() else fingerprint(None)
    if actual != revision:
        raise FeedbackError('This writing context changed elsewhere. Reload it; your draft is kept.')
    storage.check_storage()
    for journal in storage.JOURNALS.glob('*/transaction.json'):
        if json.loads(journal.read_text()).get('state') == 'prepared':
            raise FeedbackError('An earlier save needs recovery before continuing.', 503)
    if len(data['versions']) >= 400:
        raise FeedbackError('Writing history is full. Ask your editing chat to archive it safely.', 503)
    identity = fingerprint(value)
    version = next((v for v in data['versions'] if v['id'] == identity), None)
    if version is None:
        version = {'id': identity, 'value': value, 'at': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'request_ids': []}
        data['versions'].append(version)
    version['request_ids'].append(request_id)
    data['current'] = identity
    expected = {**(expected or {}), path: None if actual == fingerprint(None) else actual}
    storage.commit({path: storage.json_bytes(data)}, {'request_id': request_id, 'operation': 'save-writing-context'}, expected)


def brief_context(project_id):
    project = project_for(project_id)
    if project.get('format', 'video') != 'video': raise FeedbackError('Scripts belong to video projects.', 400)
    path = storage.write_target(project, 'script-brief.json')
    data, value, revision = read(path, {'idea': '', 'references': '', 'ready_script': None})
    if (not isinstance(value, dict) or set(value) != {'idea', 'references', 'ready_script'} or
            not all(isinstance(value[k], str) and len(value[k]) <= 10000 for k in ['idea', 'references']) or
            value['ready_script'] is not None and not re.fullmatch('[a-f0-9]{64}', str(value['ready_script']))):
        raise FeedbackError('The script brief needs repair. It is preserved.', 503)
    return path, data, value, revision


def brief_current(project_id):
    with index.STATE_LOCK:
        _, data, value, revision = brief_context(project_id)
        script = project_script.current(project_id)
        return {'project_id': project_id, 'revision': revision, **value,
                'ready': bool(value['ready_script'] and value['ready_script'] == script['version_id']),
                'version_count': len(data['versions'])}


def brief_save(body):
    if not isinstance(body, dict) or set(body) != {'project_id', 'revision', 'request_id', 'idea', 'references', 'ready_script'}:
        raise FeedbackError('Use a valid script brief request.', 400)
    with index.STATE_LOCK:
        path, data, _, _ = brief_context(body['project_id'])
        script = project_script.current(body['project_id'])
        ready = body['ready_script']
        if ready is not None and (not isinstance(ready, str) or not script['version_id'] or ready != script['version_id']):
            raise FeedbackError('The script changed. Save and reload the current script before marking it ready.')
        value = {'idea': text(body['idea'], 10000), 'references': text(body['references'], 10000), 'ready_script': ready}
        original = index.REGISTRY.resolve()
        script_path = storage.write_target(project_for(body['project_id']), 'script-state.json')
        expected = {original: index.digest(original), script_path: index.digest(script_path) if script_path.exists() else None}
        write(path, data, value, body['revision'], body['request_id'], expected)
        return brief_current(body['project_id'])


def script_ready(body):
    required = {'project_id', 'revision', 'request_id', 'script_version', 'script_revision', 'ready'}
    if (not isinstance(body, dict) or set(body) != required or type(body['ready']) is not bool or
            not all(isinstance(body[key], str) for key in required - {'ready'}) or
            not re.fullmatch(r'[a-f0-9]{64}', body['script_version'])):
        raise FeedbackError('Use a valid script approval request.', 400)
    with index.STATE_LOCK:
        project_id = body['project_id']
        path, data, value, _ = brief_context(project_id)
        _, _, script, _, _, expected, revision = project_script.context(project_id)
        if script['current'] != body['script_version'] or revision != body['script_revision']:
            raise FeedbackError('The saved script changed. Reopen Script to review the current version.')
        ready = body['script_version'] if body['ready'] else None
        if not body['ready'] and value['ready_script'] not in (None, body['script_version']):
            raise FeedbackError('The script approval changed. Reopen Script to review it.')
        write(path, data, {**value, 'ready_script': ready}, body['revision'], body['request_id'], expected)
        return brief_current(project_id)


def voice_context():
    path = storage.BASE / 'writing-voice.json'
    data, value, revision = read(path, [])
    validate_preferences(value)
    return path, data, value, revision


def validate_preferences(preferences):
    if not isinstance(preferences, list) or len(preferences) > 40:
        raise FeedbackError('Keep up to 40 useful writing preferences.', 400)
    ids = set()
    for item in preferences:
        if not isinstance(item, dict) or set(item) != {'id', 'text', 'source'}:
            raise FeedbackError('Use a valid writing preference.', 400)
        token(item['id'])
        if item['id'] in ids or not text(item['text'], 1000) or not text(item['source'], 2000):
            raise FeedbackError('Each preference needs its own identity, wording and source.', 400)
        ids.add(item['id'])


def voice_current():
    with index.STATE_LOCK:
        _, data, value, revision = voice_context()
        return {'revision': revision, 'preferences': value, 'version_count': len(data['versions'])}


def voice_save(body):
    if not isinstance(body, dict) or set(body) != {'revision', 'request_id', 'preferences'}:
        raise FeedbackError('Use a valid writing preference request.', 400)
    with index.STATE_LOCK:
        path, data, _, _ = voice_context()
        validate_preferences(body['preferences'])
        value = [{'id': p['id'], 'text': p['text'].strip(), 'source': p['source'].strip()} for p in body['preferences']]
        write(path, data, value, body['revision'], body['request_id'])
        return voice_current()


# Optional opening sets are tied to immutable scripts. No choices are inferred from prose.
def hooks_context(project_id):
    project = project_for(project_id)
    if project.get('format', 'video') != 'video':
        raise FeedbackError('Openings belong to video scripts.', 400)
    path = storage.write_target(project, 'script-hooks.json')
    data, _, revision = read(path, None)
    return path, data, revision


def hook_set(project_id, value):
    if not isinstance(value, dict) or set(value) != {'script_version', 'prefix', 'options'}:
        raise FeedbackError('Use a valid opening set.', 400)
    if not isinstance(value['script_version'], str) or not re.fullmatch('[a-f0-9]{64}', value['script_version']):
        raise FeedbackError('Choose an exact saved script for these openings.', 400)
    base = project_script.current(project_id, value['script_version'])
    prefix = text(value['prefix'], 8000)
    if not prefix or not base['text'].startswith(prefix) or (len(prefix) < len(base['text']) and not base['text'][len(prefix):].startswith('\n')):
        raise FeedbackError('The opening must match complete paragraphs at the start of this exact script.', 400)
    options = value['options']
    if not isinstance(options, list) or not 2 <= len(options) <= 6:
        raise FeedbackError('Save two to six complete opening options.', 400)
    ids, openings, result = set(), set(), []
    for option in options:
        if not isinstance(option, dict) or set(option) != {'id', 'opening'}:
            raise FeedbackError('Use a valid opening option.', 400)
        token(option['id'])
        opening = text(option['opening'], 8000)
        if not opening or opening in openings or option['id'] in ids:
            raise FeedbackError('Each opening needs distinct text and its own identity.', 400)
        ids.add(option['id']); openings.add(opening)
        script = (opening + base['text'][len(prefix):]).strip()
        if len(script) > project_script.LIMIT:
            raise FeedbackError('Use a shorter opening.', 400)
        result.append({'id': option['id'], 'opening': opening, 'script_version': hashlib.sha256(script.encode()).hexdigest(), 'text': script})
    if prefix not in openings:
        raise FeedbackError('Keep the original opening among the options.', 400)
    return result


def hooks_current(project_id, version=None):
    with index.STATE_LOCK:
        script = project_script.current(project_id, version)
        _, data, revision = hooks_context(project_id)
        for entry in reversed(data['versions']):
            choices = hook_set(project_id, entry['value'])
            selected = next((choice for choice in choices if choice['script_version'] == script['version_id'] or
                             entry['value']['script_version'] == script['version_id'] and choice['opening'] == entry['value']['prefix']), None)
            if selected:
                return {'project_id': project_id, 'revision': revision, 'script_version': script['version_id'],
                        'selected_id': selected['id'], 'options': [{k: v for k, v in choice.items() if k != 'text'} for choice in choices]}
        return {'project_id': project_id, 'revision': revision, 'script_version': script['version_id'], 'selected_id': None, 'options': []}


def hooks_save(body):
    if not isinstance(body, dict) or set(body) != {'project_id', 'revision', 'request_id', 'script_version', 'prefix', 'options'}:
        raise FeedbackError('Use a valid opening save request.', 400)
    with index.STATE_LOCK:
        value = {key: body[key] for key in ['script_version', 'prefix', 'options']}
        hook_set(body['project_id'], value)
        path, data, _ = hooks_context(body['project_id'])
        _, _, _, _, _, expected, _ = project_script.context(body['project_id'])
        write(path, data, value, body['revision'], body['request_id'], expected)
        return hooks_current(body['project_id'], body['script_version'])


def hook_apply(body):
    required = {'project_id', 'revision', 'request_id', 'script_version', 'hook_revision', 'option_id'}
    if not isinstance(body, dict) or set(body) != required:
        raise FeedbackError('Use a valid opening choice.', 400)
    with index.STATE_LOCK:
        # Resolve the exact set, including on an idempotent retry after another save.
        project_script.current(body['project_id'], body['script_version'])
        path, data, revision = hooks_context(body['project_id'])
        choice = None
        for entry in reversed(data['versions']):
            options = hook_set(body['project_id'], entry['value'])
            if entry['value']['script_version'] == body['script_version'] or any(option['script_version'] == body['script_version'] for option in options):
                choice = next((option for option in options if option['id'] == body['option_id']), None)
                if choice is not None: break
        if choice is None:
            raise FeedbackError('That opening is unavailable. Reload the options; your script is kept.')
        _, _, scripts, _, _, _, _ = project_script.context(body['project_id'])
        duplicate = any(body['request_id'] in v['request_ids'] for v in scripts['versions'])
        current = project_script.current(body['project_id'])
        if not duplicate and (revision != body['hook_revision'] or current['version_id'] != body['script_version']):
            raise FeedbackError('The script or openings changed. Reload before choosing; your draft is kept.')
        result = project_script.save({'project_id': body['project_id'], 'revision': body['revision'],
                                     'request_id': body['request_id'], 'text': choice['text']}, {path: revision})
        return {**result, 'hooks': hooks_current(body['project_id'], result['version_id'])}


# Copied feedback is an immutable local handoff, separate from review approvals.
def feedback_revision(project_id, row):
    return fingerprint({'project_id': project_id, **{key: row[key] for key in ['id', 'script_version', 'feedback', 'references']}})


def feedback_context(project_id):
    project = project_for(project_id)
    if project.get('format', 'video') != 'video':
        raise FeedbackError('This feedback belongs to a video script.', 400)
    path = storage.write_target(project, 'script-feedback.json')
    if not path.exists():
        return path, {'schema_version': 1, 'project_id': project_id, 'requests': []}
    if not path.is_file() or path.stat().st_size > 8_000_000:
        raise FeedbackError('Script feedback needs attention in chat. It is preserved.', 503)
    data = json.loads(path.read_bytes())
    if (not isinstance(data, dict) or data.get('schema_version') != 1 or data.get('project_id') != project_id or
            not isinstance(data.get('requests'), list)):
        raise FeedbackError('Script feedback needs repair. It is preserved.', 503)
    seen = set()
    for row in data['requests']:
        if (not isinstance(row, dict) or not isinstance(row.get('id'), str) or row['id'] in seen or
                not isinstance(row.get('script_version'), str) or not re.fullmatch('[a-f0-9]{64}', row['script_version']) or
                not all(isinstance(row.get(key), str) and len(row[key]) <= 10000 for key in ['feedback', 'references'])):
            raise FeedbackError('Script feedback needs repair. It is preserved.', 503)
        token(row['id']); seen.add(row['id'])
        if row.get('content_revision') != feedback_revision(project_id, row):
            raise FeedbackError('Saved script feedback changed. Its earlier records are preserved; ask your editing chat to reconcile it.', 503)
    return path, data


def feedback_current(project_id, request_id=None, content_revision=None):
    with index.STATE_LOCK:
        _, data = feedback_context(project_id)
        if request_id is None:
            return {'project_id': project_id, 'requests': data['requests']}
        token(request_id)
        row = next((r for r in data['requests'] if r['id'] == request_id), None)
        if row is None:
            raise FeedbackError('That copied feedback is unavailable. Copy it again from the studio.', 404)
        if content_revision is not None and content_revision != row['content_revision']:
            raise FeedbackError('That copied feedback no longer matches. Copy it again from the studio.')
        project_script.current(project_id, row['script_version'])
        return {'project_id': project_id, **row}


def feedback_save(body):
    if not isinstance(body, dict) or set(body) != {'project_id', 'script_version', 'request_id', 'feedback', 'references'}:
        raise FeedbackError('Use a valid script feedback request.', 400)
    token(body['request_id'])
    value = {key: text(body[key], 10000) for key in ['feedback', 'references']}
    if not any(value.values()):
        raise FeedbackError('Add feedback or a reference first.', 400)
    with index.STATE_LOCK:
        project_script.current(body['project_id'], body['script_version'])
        path, data = feedback_context(body['project_id'])
        for row in data['requests']:
            if row['id'] == body['request_id']:
                if row['script_version'] != body['script_version'] or any(row[key] != value[key] for key in value):
                    raise FeedbackError('This feedback request was already used for different text. Your draft is kept.')
                return feedback_current(body['project_id'], body['request_id'])
        if len(data['requests']) >= 200:
            raise FeedbackError('Script feedback history is full. Ask your editing chat to archive it safely.', 503)
        _, _, _, _, _, expected, _ = project_script.context(body['project_id'])
        expected[path] = index.digest(path) if path.exists() else None
        row = {'id': body['request_id'], 'script_version': body['script_version'], **value,
               'at': datetime.now(timezone.utc).isoformat(timespec='seconds')}
        row['content_revision'] = feedback_revision(body['project_id'], row)
        data['requests'].append(row)
        storage.check_storage()
        for journal in storage.JOURNALS.glob('*/transaction.json'):
            if json.loads(journal.read_text()).get('state') == 'prepared':
                raise FeedbackError('An earlier save needs recovery first.', 503)
        storage.commit({path: storage.json_bytes(data)}, {'request_id': body['request_id'], 'operation': 'copy-script-feedback'}, expected)
        return feedback_current(body['project_id'], body['request_id'])
