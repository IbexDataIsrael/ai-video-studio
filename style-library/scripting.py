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
    expected = {**(expected or {}), path: index.digest(path) if path.exists() else None}
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
