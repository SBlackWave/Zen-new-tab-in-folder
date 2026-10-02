# New Tab In Folder

A [Sine](https://github.com/CosmoCreeper/Sine) mod for Zen Browser. When the active tab is inside a folder (or subfolder) and you open a new tab with `Ctrl+T` or the sidebar's "new tab" button, the tab created after you press Enter in the URL bar lands in that same folder, instead of the unfolderized area.

Based on the logic of zen-browser/desktop PR #13700 (`zen.folders.new-tabs-in-folder`), which had not been merged when this mod was written.

## What it does and doesn't do

- Does: handle tabs opened from the URL bar via `Ctrl+T` or the new tab button.
- Doesn't: touch pinned or essential tabs, tabs restored by session restore, or tabs in live folders or split views.
- Doesn't: handle tabs opened from a link in another tab (middle click, "Open link in new tab"). Zen handles those with `zen.folders.owned-tabs-in-folder`.
- The new tab is added at the end of the folder, not next to the active tab.

## Installation (Sine)

1. In `about:config`, set `sine.allow-unsafe-js` to `true` (or enable "Enable installing JS from unofficial sources" in Sine's settings). Without it the mod appears installed, but its script never loads.
2. In Zen's settings, open Sine and use the field for adding an unpublished mod: `<your-github-username>/<repo-name>`.
3. Restart Zen. If the mod doesn't load: `about:support` -> "Clear Startup Cache" -> restart.

Note: the repository must be public, otherwise Sine most likely can't fetch it.

## Debugging

In `new-tab-in-folder.uc.js`, set `DEBUG = true`, then watch the `[new-tab-in-folder]` logs in the Browser Console (`Ctrl+Shift+J`).

## If a Zen update breaks it

Disable or remove the mod from Sine. `supportsUnload` is `false`, so Zen needs a restart for that to take effect.

## Status

Not tested across many Zen versions. Version 0.1.0.
