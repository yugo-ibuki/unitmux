# Image Attachment

## Overview

Send images to Claude CLI directly from unitmux. Images are sent using the terminal's bracketed paste protocol, which Claude CLI recognizes as image file paths.

## Attaching Images

**Button**: Click the "+" button in the footer to open a file picker. Select one or more image files.

**Drag & Drop**: Drag image files from Finder directly onto the unitmux window.

Supported formats: PNG, JPG, JPEG, GIF, WebP, SVG, BMP

## Preview

Attached images appear as thumbnails above the input area. Hover to reveal the remove (×) button.

## Sending

Images are sent separately from your text message using bracketed paste sequences. Claude CLI detects the image file paths and processes them as image attachments.

- With text: images are sent first, then the text message
- Without text: images alone can be sent by pressing Send

## How It Works

When you send images through unitmux, the file paths are wrapped in terminal bracketed paste sequences (`ESC[200~` ... `ESC[201~`). Claude CLI's paste handler detects file paths ending in image extensions and reads the files as images. This is the same mechanism used when you drag a file into the terminal directly.
