(function () {
  const listEl = document.getElementById("contributors-list");
  if (!listEl) return;

  const owner = "moorecoin-bhs";
  const repo = "Moorecoin";
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`;

  // Helper: create a chip <li> for a contributor
  const makeChip = (c) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = c.html_url;
    a.textContent = `@${c.login}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    li.appendChild(a);
    return li;
  };

  // Replace fallback content with a loading indicator
  listEl.innerHTML = "";
  const loading = document.createElement("li");
  loading.textContent = "Loading contributors…";
  loading.className = "muted";
  listEl.appendChild(loading);

  fetch(apiUrl, {
    headers: {
      // Hint to avoid abuse detection; also allows conditional requests later
      Accept: "application/vnd.github+json",
    },
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    })
    .then((contributors) => {
      // Filter out bots and sort by login alphabetically
      const humans = contributors
        .filter(
          (c) => c && typeof c.login === "string" && !/\[bot\]$/.test(c.login),
        )
        .sort((a, b) => a.login.localeCompare(b.login));

      listEl.innerHTML = "";

      if (humans.length === 0) {
        const none = document.createElement("li");
        none.textContent = "No contributors found yet.";
        none.className = "muted";
        listEl.appendChild(none);
        return;
      }

      // Render chips
      const frag = document.createDocumentFragment();
      humans.forEach((c) => frag.appendChild(makeChip(c)));
      listEl.appendChild(frag);
    })
    .catch((err) => {
      // Graceful fallback: keep existing static list item and show a note
      console.error("Failed to load contributors:", err);
      listEl.innerHTML = "";
      const fallback = document.createElement("li");
      fallback.textContent = "@halleyscommet";
      const note = document.createElement("li");
      note.textContent = "(Could not load full list)";
      note.className = "muted";
      listEl.appendChild(fallback);
      listEl.appendChild(note);
    });
})();
