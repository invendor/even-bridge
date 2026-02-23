---
name: qr
description: >
  Generate a QR code PNG for the Even Bridge ngrok tunnel.
  Trigger when the user asks to make/generate/update a QR code.
user_invocable: true
---

# QR Code Generator

Generate `qr.png` in the project root with the current ngrok tunnel URL.

## Steps

1. Query the ngrok local API to get the active tunnel URL:
   ```bash
   curl -s http://localhost:4040/api/tunnels
   ```
2. Extract the `public_url` from the response (the HTTPS tunnel pointing to localhost:3000).
3. Generate the QR code using Python:
   ```bash
   python3 -c "
   import qrcode
   img = qrcode.make('<URL>')
   img.save('qr.png')
   "
   ```
4. Report the URL and confirm the file was saved.

## Notes

- If ngrok is not running, tell the user to start it first (`ngrok http 3000`).
- If the `qrcode` Python package is missing, install it: `pip3 install qrcode[pil]`.
- Always overwrite the existing `qr.png`.
