"""Pruebas locales de acceso, persistencia y entrega. Sin servicios externos."""
import base64
import http.client
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
import server

class PortalTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.data = patch.object(server, 'DATA', Path(self.temp.name))
        self.data.start()
        self.code = patch.object(server, 'CODE', 'test-code')
        self.code.start()
        server.SESSIONS.clear(); server.ATTEMPTS.clear()
        self.http = server.ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
        self.port = self.http.server_port
        self.thread = threading.Thread(target=self.http.serve_forever, daemon=True)
        self.thread.start()
        self.cookie = ''

    def tearDown(self):
        self.http.shutdown(); self.http.server_close(); self.thread.join()
        self.data.stop(); self.code.stop(); self.temp.cleanup()

    def request(self, path, body=None, headers=None):
        c = http.client.HTTPConnection('127.0.0.1', self.port)
        h = {'Content-Type':'application/json', 'Cookie':self.cookie}
        h.update(headers or {})
        c.request('GET' if body is None else 'POST', path, json.dumps(body) if body is not None else None, h)
        response = c.getresponse()
        cookie = response.getheader('Set-Cookie')
        if cookie: self.cookie = cookie.split(';')[0]
        status, data = response.status, json.loads(response.read())
        c.close()
        return status, data

    def login(self):
        self.assertEqual(self.request('/api/login', {'code':'test-code'})[0], 200)

    def report(self):
        return {'pdf':base64.b64encode(b'%PDF-1.4\nexample').decode(), 'photos':[{'data':base64.b64encode(b'\xff\xd8\xffexample').decode(), 'caption':'Poste', 'camera':'cam1'}], 'metadata':{'client':'Test'}}

    def test_access_session_logout_and_origin(self):
        self.assertEqual(self.request('/api/reports', self.report())[0], 401)
        self.assertEqual(self.request('/api/login', {'code':'wrong'})[0], 401)
        self.assertEqual(self.request('/api/login', {'code':'test-code'}, {'Origin':'https://other.example'})[0],403)
        self.login()
        self.assertEqual(self.request('/api/session')[0], 200)
        self.assertEqual(self.request('/server.py')[0], 404)
        self.assertEqual(self.request('/api/logout', {})[0], 200)
        self.assertEqual(self.request('/api/session')[0], 401)

    def test_report_persistence_and_no_email_endpoint(self):
        self.login()
        status, result = self.request('/api/reports', self.report())
        self.assertEqual(status, 201)
        directory = Path(self.temp.name)/result['id']
        self.assertTrue((directory/'parte.pdf').read_bytes().startswith(b'%PDF-'))
        self.assertEqual(len(json.loads((directory/'parte.json').read_text())['photos']),1)
        self.assertTrue((directory/'foto-001.jpg').exists())
        self.assertEqual(self.request(f"/api/reports/{result['id']}/email", {'email':'test@example.com'})[0],404)
        self.assertEqual(self.request(f"/{result['id']}/parte.pdf")[0],404)

    def test_invalid_files_and_login_throttle(self):
        self.login()
        invalid = self.report(); invalid['photos'][0]['data'] = base64.b64encode(b'not a JPEG').decode()
        self.assertEqual(self.request('/api/reports', invalid)[0], 400)
        self.assertEqual(list(Path(self.temp.name).iterdir()), [])
        for _ in range(10): self.assertEqual(self.request('/api/login', {'code':'wrong'})[0],401)
        self.assertEqual(self.request('/api/login', {'code':'test-code'})[0],429)

if __name__ == '__main__': unittest.main()
