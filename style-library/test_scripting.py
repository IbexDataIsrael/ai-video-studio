"""Writing context tests use disposable owner data and real guarded HTTP routes."""
import hashlib
import http.client
import json
import threading
import unittest
import uuid
from http.server import ThreadingHTTPServer
from unittest.mock import patch
import test_project_script as fixtures
import scripting
import project_script
from feedback import FeedbackError
from serve import Handler


class ScriptingTests(unittest.TestCase):
    def setUp(self):
        self.fixture = fixtures.ScriptTests(methodName='runTest')
        self.fixture.setUp()
        self.base = self.fixture.base
        self.project = self.fixture.project

    def tearDown(self):
        self.fixture.tearDown()

    def voice(self, text='Keep transitions conversational.', state=None):
        state = state or scripting.voice_current()
        return {'revision': state['revision'], 'request_id': str(uuid.uuid4()),
                'preferences': [{'id': str(uuid.uuid4()), 'text': text, 'source': 'Explicit owner feedback on a script revision.'}]}

    def brief(self, ready=None):
        return {'project_id': 'demo', 'revision': scripting.brief_current('demo')['revision'],
                'request_id': str(uuid.uuid4()), 'idea': 'A useful idea', 'references': 'A source and what to borrow',
                'ready_script': ready}

    def test_first_read_is_empty_and_never_seeds_owner_files(self):
        before = {p: p.read_bytes() for p in self.fixture.root.rglob('*') if p.is_file()}
        self.assertEqual(scripting.voice_current()['preferences'], [])
        self.assertFalse(scripting.brief_current('demo')['ready'])
        self.assertEqual({p: p.read_bytes() for p in self.fixture.root.rglob('*') if p.is_file()}, before)

    def test_voice_is_private_versioned_and_retries_do_not_revert_a_newer_value(self):
        first_body = self.voice()
        first = scripting.voice_save(first_body)
        second_body = {'revision': first['revision'], 'request_id': str(uuid.uuid4()), 'preferences': []}
        second = scripting.voice_save(second_body)
        self.assertEqual(second['preferences'], [])
        self.assertEqual(scripting.voice_save(first_body)['revision'], second['revision'])
        history = json.loads((self.base/'writing-voice.json').read_text())
        self.assertEqual(len(history['versions']), 2)
        self.assertEqual(history['versions'][0]['value'][0]['source'], first_body['preferences'][0]['source'])

    def test_stale_voice_save_preserves_the_winning_change(self):
        stale = self.voice('A stale change')
        winner = scripting.voice_save(self.voice('Use my actual words.'))
        with self.assertRaises(FeedbackError):
            scripting.voice_save(stale)
        self.assertEqual(scripting.voice_current(), winner)

    def test_preferences_require_evidence_and_distinct_ids(self):
        body = self.voice()
        body['preferences'][0]['source'] = ''
        with self.assertRaises(FeedbackError):
            scripting.voice_save(body)
        body = self.voice()
        body['preferences'] *= 2
        with self.assertRaises(FeedbackError):
            scripting.voice_save(body)
        self.assertFalse((self.base/'writing-voice.json').exists())

    def test_ready_is_tied_to_exact_saved_script_and_never_approves_footage(self):
        registry = self.fixture.registry.read_bytes()
        original = (self.project/'script.txt').read_bytes()
        first = project_script.save(self.fixture.body('My first script.'))
        self.assertTrue(scripting.brief_save(self.brief(first['version_id']))['ready'])
        later = project_script.save(self.fixture.body('My revised script.'))
        self.assertFalse(scripting.brief_current('demo')['ready'])
        with self.assertRaises(FeedbackError):
            scripting.brief_save(self.brief(first['version_id']))
        self.assertTrue(scripting.brief_save(self.brief(later['version_id']))['ready'])
        self.assertEqual(self.fixture.registry.read_bytes(), registry)
        self.assertEqual((self.project/'script.txt').read_bytes(), original)
        self.assertEqual((self.project/'exports/assembled-script-v04.txt').read_text(), 'The selected words.')

    def test_script_history_keeps_exact_versions(self):
        first = project_script.save(self.fixture.body('First version.'))
        second = project_script.save(self.fixture.body('Second version.'))
        old = project_script.current('demo', first['version_id'])
        self.assertEqual(old['text'], 'First version.')
        self.assertEqual(old['current_version_id'], second['version_id'])
        self.assertEqual(old['versions'][0]['id'], second['version_id'])

    def test_brief_conflict_and_broken_memory_are_preserved(self):
        stale = self.brief()
        winner = scripting.brief_save(self.brief())
        stale['idea'] = 'Outdated'
        with self.assertRaises(FeedbackError):
            scripting.brief_save(stale)
        self.assertEqual(scripting.brief_current('demo'), winner)
        path = self.base/'writing-voice.json'
        path.write_text('broken owner data')
        with self.assertRaises(ValueError):
            scripting.voice_current()
        self.assertEqual(path.read_text(), 'broken owner data')

    def test_symlinked_voice_file_never_writes_outside_the_installation(self):
        target = self.fixture.root/'private.json'
        target.write_text('keep me')
        (self.base/'writing-voice.json').symlink_to(target)
        with self.assertRaises(FeedbackError):
            scripting.voice_save({'revision': '0'*64, 'request_id': str(uuid.uuid4()), 'preferences': []})
        self.assertEqual(target.read_text(), 'keep me')

    def test_http_requires_same_origin_explicit_actions_and_private_file_is_not_static(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        origin = 'http://127.0.0.1:'+str(server.server_port)
        def request(method, path, body=None, headers=None):
            c = http.client.HTTPConnection('127.0.0.1', server.server_port)
            c.request(method, path, json.dumps(body) if body is not None else None, headers or {})
            response = c.getresponse()
            result = response.status, response.read()
            c.close()
            return result
        try:
            self.assertEqual(request('GET', '/writing-voice')[0], 200)
            self.assertEqual(request('GET', '/writing-voice', headers={'Origin': 'https://example.com'})[0], 403)
            body = self.voice()
            headers = {'Content-Type': 'application/json', 'Origin': origin, 'X-Studio-Action': 'writing-voice'}
            self.assertEqual(request('POST', '/writing-voice', body)[0], 403)
            self.assertEqual(request('POST', '/writing-voice', body, headers)[0], 200)
            self.assertEqual(request('GET', '/writing-voice.json')[0], 404)
            self.assertEqual(request('GET', '/script-brief?project=demo')[0], 200)
            self.assertEqual(request('GET', '/script-brief?project=demo&project=demo')[0], 400)
            headers['X-Studio-Action'] = 'script-brief'
            self.assertEqual(request('POST', '/script-brief', self.brief(), headers)[0], 200)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == '__main__':
    unittest.main()
