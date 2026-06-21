#!/bin/bash
# Launch browser in background after 1s delay
(sleep 1 && open http://localhost:3000) &
# Start Python 3 web server on port 3000
python3 -m http.server 3000