// ==UserScript==
// @name           new-tab-in-folder
// @description    Zen Browser: a tab opened from the URL bar (Ctrl+T or the "new tab" button)
//                 lands in the same folder/subfolder as the active tab.
// @include        main
// ==/UserScript==

(() => {
  "use strict";

  if (location.href !== "chrome://browser/content/browser.xhtml") return;
  if (window.__newTabInFolder) return; // already loaded in this window

  const LOG = "[new-tab-in-folder]";
  const DEBUG = false; // set to true to see logs in the Browser Console (Ctrl+Shift+J)
  const STARTUP_GRACE_MS = 5000; // ignore tabs created during startup / session restore
  const INTENT_TTL_MS = 120000;
  const NEWTAB_SELECTOR = "#tabs-newtab-button, #vertical-tabs-newtab-button, #new-tab-button";
  const STARTUP_TOPIC = "browser-delayed-startup-finished";

  const log = (...a) => DEBUG && console.log(LOG, ...a);
  const lbl = (g) => (g ? g.label || "(unnamed)" : null);

  const attach = () => {
    const gB = window.gBrowser;
    const doc = window.document;

    let current = gB.selectedTab;
    let previous = null;
    let intent = null;

    // Remember the active tab's folder at the moment the user starts a new tab,
    // since the tab itself is only created later, when they press Enter.
    const setIntent = (source) => {
      const tab = gB.selectedTab;
      intent = { folder: tab?.group || null, tab, time: Date.now(), source };
      log("intent from", source, "| active tab's folder:", lbl(intent.folder));
    };

    const onSelect = () => {
      if (gB.selectedTab !== current) {
        previous = current;
        current = gB.selectedTab;
      }
      intent = null;
    };

    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === "t" || e.key === "T")) {
        setIntent("Ctrl+T");
      }
    };

    const onPointerDown = (e) => {
      const btn = e.target?.closest?.(NEWTAB_SELECTOR);
      if (btn) setIntent("new tab button (" + (btn.id || "?") + ")");
    };

    const isUsableFolder = (f) =>
      f && f.isZenFolder && !f.isLiveFolder && !f.hasAttribute("split-view-group");

    const onTabOpen = (event) => {
      try {
        const tab = event.target;

        log("TabOpen", {
          selectedIsNewTab: gB.selectedTab === tab,
          selectedGroup: lbl(gB.selectedTab?.group),
          currentGroup: lbl(current?.group),
          previousGroup: lbl(previous?.group),
          intentSource: intent?.source || null,
          intentFolder: lbl(intent?.folder),
          hasOwner: !!tab.owner,
          pinned: tab.pinned,
          pending: tab.hasAttribute("pending"),
        });

        if (tab.group) return log("skip: already in a group", lbl(tab.group));
        if (tab.pinned) return log("skip: pinned");
        if (tab.hasAttribute("zen-essential")) return log("skip: essential");
        if (tab.hasAttribute("pending")) return log("skip: pending (session restore?)");
        // Tabs opened from a link in another tab are handled by Zen
        // (zen.folders.owned-tabs-in-folder).
        if (tab.owner) return log("skip: has an owner (opened from another tab)");

        let folder = null;
        let from = null;
        if (intent && Date.now() - intent.time < INTENT_TTL_MS && intent.folder) {
          folder = intent.folder;
          from = "intent";
        }
        if (!folder) {
          let anchor = gB.selectedTab;
          if (anchor === tab) anchor = current !== tab ? current : previous;
          folder = anchor?.group || null;
          from = "active tab";
        }
        intent = null;

        if (!folder) return log("skip: no folder found");
        if (!isUsableFolder(folder)) return log("skip: unsupported group (not a Zen folder / live folder / split view)");

        folder.addTabs([tab]);
        log("tab moved into", lbl(folder), "(from " + from + ") | group ok:", tab.group === folder);
      } catch (e) {
        console.error(LOG, "error", e);
      }
    };

    gB.tabContainer.addEventListener("TabSelect", onSelect);
    gB.tabContainer.addEventListener("TabOpen", onTabOpen);
    doc.addEventListener("keydown", onKeyDown, true);
    doc.addEventListener("mousedown", onPointerDown, true);

    window.__newTabInFolder = {
      destroy() {
        gB.tabContainer.removeEventListener("TabSelect", onSelect);
        gB.tabContainer.removeEventListener("TabOpen", onTabOpen);
        doc.removeEventListener("keydown", onKeyDown, true);
        doc.removeEventListener("mousedown", onPointerDown, true);
        delete window.__newTabInFolder;
      },
    };
    log("active");
  };

  const whenReady = (cb) => {
    if (window.gBrowserInit?.delayedStartupFinished) return cb();
    const obs = {
      observe(subject) {
        if (subject === window) {
          Services.obs.removeObserver(obs, STARTUP_TOPIC);
          cb();
        }
      },
    };
    Services.obs.addObserver(obs, STARTUP_TOPIC);
  };

  whenReady(() => window.setTimeout(attach, STARTUP_GRACE_MS));
})();
