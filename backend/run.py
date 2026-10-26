import os
from app import create_app

# Instantiate app with active environment (defaults to development)
app = create_app(os.environ.get('FLASK_ENV', 'development'))

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '127.0.0.1')
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1')

    print(f"[*] Starting KANSEI AI Backend on http://{host}:{port} (Debug: {debug})")
    app.run(host=host, port=port, debug=debug)
