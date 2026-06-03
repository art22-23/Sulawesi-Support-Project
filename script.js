const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.18 }
);

function observeReveals(scope = document) {
  const reveals = scope.querySelectorAll(".reveal:not(.is-observed)");
  reveals.forEach((element, index) => {
    element.classList.add("is-observed");
    if (!element.style.getPropertyValue("--delay")) {
      element.style.setProperty("--delay", `${Math.min(index * 45, 220)}ms`);
    }
    observer.observe(element);
  });
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function renderGoods(items) {
  const list = document.querySelector("#goods-list");
  if (!list) return;

  list.innerHTML = items
    .map((item) => {
      return `
        <article class="goods-item reveal">
          ${item.tag ? `<span class="goods-tag">${item.tag}</span>` : ""}
          <img src="${item.image}" alt="${item.name}のグッズ画像" />
          <div>
            <h3>${item.name}</h3>
            <p>${item.detail}</p>
          </div>
        </article>
      `;
    })
    .join("");

  observeReveals(list);
}

async function loadGoods() {
  try {
    const response = await fetch("goods.csv", { cache: "no-store" });
    if (!response.ok) throw new Error("goods.csv could not be loaded");
    const rows = parseCsv(await response.text());
    const [header, ...records] = rows;
    const nameIndex = header.indexOf("グッズ名");
    const imageIndex = header.indexOf("グッズ画像");
    const detailIndex = header.indexOf("詳細");
    const tagIndex = header.indexOf("タグ");
    const items = records
      .map((record) => ({
        name: record[nameIndex],
        image: record[imageIndex],
        detail: record[detailIndex],
        tag: tagIndex >= 0 ? record[tagIndex] : "",
      }))
      .filter((item) => item.name && item.image && item.detail);
    renderGoods(items);
  } catch (error) {
    renderGoods([
      {
        name: "SULAWESI",
        image: "assets/badge-sulawesi.png",
        detail: "土地の自然と、そこに生きてきた人びとの記憶を象徴するメインデザイン。",
        tag: "缶バッジ",
      },
    ]);
  }
}

observeReveals();
loadGoods();

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
