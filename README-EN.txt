WMS Warehouse Management System - Windows Setup
=============================================

SIMPLE START:
=============
1. Run install-windows.bat (first time - comprehensive setup)
2. Run RUN.bat (every time to start)
3. Open: http://localhost:3000

ALTERNATIVE:
============
1. Run SETUP.bat (first time only)
2. Run RUN.bat (every time to start)
3. Open: http://localhost:3000

LOGIN:
======
- Boss: boss / 123456aa (full access)
- Manager: manager / 123456aa (limited access)

TROUBLESHOOTING:
================

Database Error:
"Cannot find module 'sql.js'"
Solution: Run fix-sqlite.bat (reinstall dependencies)

Port 3000 busy:
Solution: Run kill-port.bat
Or system will auto-use port 3001, 3002, etc.

Node.js not found:
Solution: Install Node.js from https://nodejs.org/

Manual setup (if scripts fail):
1. npm install
2. cd client && npm install && npm run build && cd ..
3. npm start

IMPORTANT:
==========
- Uses sql.js (pure JavaScript SQLite) for maximum Windows compatibility
- No native compilation required - works on all platforms
- Run scripts as Administrator if permission issues
- System auto-detects available ports (3000-3010)
- No build tools or Visual Studio required