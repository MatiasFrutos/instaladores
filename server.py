"""Portal de campo. Python 3.12+, sin dependencias externas."""
import base64
import binascii
import hmac
import json
import os
from pathlib import Path
import secrets
import threading
import time
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get('DATA_DIR', str(ROOT.parent / 'instaladores-data'))).resolve()
CODE = os.environ.get('ACCESS_CODE', 'Agro2026!')
SESSIONS, ATTEMPTS = {}, {}
LOCK = threading.Lock()
STATIC = {'index.html', 'styles.css', 'portal.js', 'app.utils.js', 'app.ui.js', 'app.pdf.js', 'logo.png', 'poste.jpg', 'vivo.jpg', 'carga.jpg', 'fij.jpg', 'senal.jpg', 'camposte.jpg'}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Do not log request bodies, codes or cookies.
        super().log_message(fmt, *args)

    def reply(self, status, data, cookie=None):
        raw = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        if cookie: self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(raw)

    def authenticated(self):
        c = SimpleCookie()
        try: c.load(self.headers.get('Cookie', ''))
        except Exception: return False
        token = c.get('agro_session')
        with LOCK:
            return bool(token and SESSIONS.get(token.value, 0) > time.time())

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/session':
            return self.reply(200 if self.authenticated() else 401, {'authenticated': self.authenticated()})
        name = 'index.html' if path == '/' else path.lstrip('/')
        if name not in STATIC: return self.reply(404, {'error': 'No encontrado.'})
        import mimetypes
        raw = (ROOT / name).read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', mimetypes.guess_type(name)[0] or 'application/octet-stream')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        origin = self.headers.get('Origin')
        expected = os.environ.get('PUBLIC_ORIGIN')
        if origin and (origin != expected if expected else urlparse(origin).netloc != self.headers.get('Host')):
            return self.reply(403, {'error': 'Origen no permitido.'})
        if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            return self.reply(415, {'error': 'Se requiere JSON.'})
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 32 * 1024 * 1024: return self.reply(413, {'error': 'El parte supera el límite de 32 MB.'})
            body = json.loads(self.rfile.read(size))
            if not isinstance(body, dict): raise ValueError()
        except (ValueError, UnicodeError): return self.reply(400, {'error': 'Solicitud inválida.'})
        secure = '; Secure' if os.environ.get('COOKIE_SECURE') == '1' else ''
        path = urlparse(self.path).path
        if path == '/api/login':
            now = time.time()
            key = self.client_address[0]
            with LOCK:
                recent = [t for t in ATTEMPTS.get(key, []) if now-t < 300]
                ATTEMPTS[key] = recent
                if len(recent) >= 10: return self.reply(429, {'error': 'Demasiados intentos. Esperá 5 minutos.'})
                if not hmac.compare_digest(str(body.get('code', '')), CODE):
                    recent.append(now)
                    return self.reply(401, {'error': 'Código incorrecto. Volvé a intentar.'})
                ATTEMPTS.pop(key, None)
                for token, expiry in list(SESSIONS.items()):
                    if expiry < now: SESSIONS.pop(token, None)
                token = secrets.token_urlsafe(32)
                SESSIONS[token] = now + 12*3600
            return self.reply(200, {'ok': True}, f'agro_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200{secure}')
        if not self.authenticated(): return self.reply(401, {'error': 'Tu sesión venció. Ingresá nuevamente.'})
        if path == '/api/logout':
            c = SimpleCookie(self.headers.get('Cookie', ''))
            with LOCK: SESSIONS.pop(c['agro_session'].value, None)
            return self.reply(200, {'ok': True}, f'agro_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0{secure}')
        if path == '/api/reports':
            return self.save_report(body)
        return self.reply(404, {'error': 'No encontrado.'})

    def save_report(self, body):
        try:
            pdf = base64.b64decode(body['pdf'], validate=True)
            if not pdf.startswith(b'%PDF-'): raise ValueError()
            photos = body.get('photos', [])
            if not isinstance(photos, list) or len(photos) > 120: raise ValueError()
            decoded = []
            for photo in photos:
                raw = base64.b64decode(photo['data'], validate=True)
                if not raw.startswith(b'\xff\xd8\xff') or len(raw) > 5*1024*1024: raise ValueError()
                decoded.append((photo, raw))
            metadata = body.get('metadata', {})
            if not isinstance(metadata, dict): raise ValueError()
        except (KeyError, TypeError, ValueError, binascii.Error):
            return self.reply(400, {'error': 'PDF o fotos inválidos. Usá fotos JPEG.'})
        report_id = secrets.token_hex(16)
        target = DATA / report_id
        try:
            target.mkdir(parents=True, mode=0o700)
            (target / 'parte.pdf').write_bytes(pdf)
            records = []
            for i, (photo, raw) in enumerate(decoded):
                filename = f'foto-{i+1:03}.jpg'
                (target / filename).write_bytes(raw)
                records.append({'file': filename, 'caption': str(photo.get('caption', ''))[:200], 'camera': str(photo.get('camera', ''))[:100]})
            (target / 'parte.json').write_text(json.dumps({'created_at': time.time(), 'metadata': metadata, 'photos': records}, ensure_ascii=False))
        except OSError:
            import shutil
            if target.exists(): shutil.rmtree(target)
            return self.reply(507, {'error': 'No se pudo guardar. Revisá el espacio y permisos del servidor.'})
        return self.reply(201, {'id': report_id, 'photos': len(decoded)})

if __name__ == '__main__':
    os.umask(0o077)
    server = ThreadingHTTPServer((os.environ.get('HOST', '127.0.0.1'), int(os.environ.get('PORT', '8001'))), Handler)
    print(f'Portal activo en el puerto {server.server_port}', flush=True)
    server.serve_forever()
