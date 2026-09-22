# Social preview images

Both images come from one template, `scripts/og.html`. Render it with headless Chrome.

| Image | Size | Where it goes |
| --- | --- | --- |
| `public/og.png` | 1200 by 630 | Shipped with the site and named in the `og:image` tag |
| `docs/social-preview.png` | 1280 by 640 | Uploaded by hand under Settings, General, Social preview |

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

"$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=3000 \
  --window-size=1200,630 --screenshot=public/og.png "file://$PWD/scripts/og.html"

"$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=3000 \
  --window-size=1280,640 --screenshot=docs/social-preview.png "file://$PWD/scripts/og.html#repo"
```

The `#repo` hash swaps the footer from the site address to the repository one. GitHub does not read
the image out of the repository, so a new one has to be uploaded there by hand.

> [!IMPORTANT]
> The counts in the footer are written into the template. Update them there when the material set
> changes, then render both images again.
