const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1MNtLOsdPDsazUgAomDs7dcQ-Ev5NZ-n2DZdut83SNT0/export?format=csv&usp=sharing';
const BASE_PATH = window.location.pathname.includes('/lojavirtual') ? '/lojavirtual/' : '/';

const categoryNav = document.getElementById('categoryNav');
const productsGrid = document.getElementById('productsGrid');
const highlightHost = document.getElementById('antdCarouselHost');
const searchInput = document.getElementById('searchInput');

let products = [];
let currentCategory = 'Todos';
let searchQuery = '';
let highlightIndex = 0;

function parseCSV(text) {
  const rows = [];
  const lines = text.trim().split(/\r?\n/);

  if (!lines.length) return rows;

  const headers = parseCSVLine(lines[0]);

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCSVLine(lines[i]);
    if (!values.length) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((value) => value.trim());
}

function normalizeProduct(row) {
  return {
    name: row.Produto?.trim() || 'Produto sem nome',
    price: row.Preço?.trim() || 'R$ 0,00',
    category: row.Categoria?.trim() || 'Sem categoria',
    image: row.imagem?.trim() || 'https://images.unsplash.com/...',
    link: row.link?.trim() || '#'
  };
}

function normalizeText(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getCategories() {
  const categories = [...new Set(products.map((product) => product.category))];
  return ['Todos', ...categories];
}

function renderCategoryMenu() {
  const categories = getCategories();
  categoryNav.innerHTML = categories
    .map(
      (category) => `
        <button
          type="button"
          class="category-button ${category === currentCategory ? 'active' : ''}"
          data-category="${category}"
        >
          ${category}
        </button>
      `
    )
    .join('');

  document.querySelectorAll('.category-button').forEach((button) => {
    button.addEventListener('click', () => {
      currentCategory = button.dataset.category;
      renderCategoryMenu();
      renderProducts();
    });
  });
}

function getVisibleProducts() {
  const normalizedQuery = normalizeText(searchQuery);

  const byCategory =
    currentCategory === 'Todos'
      ? products
      : products.filter((product) => product.category === currentCategory);

  if (!normalizedQuery) {
    return byCategory;
  }

  return byCategory.filter((product) => {
    const haystack = [product.name, product.category, product.price].join(' ');
    return normalizeText(haystack).includes(normalizedQuery);
  });
}

function renderHighlightCard(productList) {
  const featuredProducts = (productList || []).slice(0, 3);

  if (!highlightHost) {
    return;
  }

  if (!featuredProducts.length) {
    highlightHost.innerHTML = '<div class="empty-state">Nenhum destaque disponível no momento.</div>';
    return;
  }

  const currentProduct = featuredProducts[highlightIndex % featuredProducts.length];

  highlightHost.innerHTML = `
    <div class="highlight-card">
      <div class="highlight-media">
        <img class="highlight-image" src="${currentProduct.image}" alt="${currentProduct.name}" />
      </div>
      <div class="highlight-content">
        <span class="highlight-pill">${currentProduct.category}</span>
        <h3 class="highlight-title">${currentProduct.name}</h3>
        <p class="highlight-price">${currentProduct.price}</p>
        <a class="highlight-link" href="${currentProduct.link}" target="_blank" rel="noreferrer noopener">
          Ver produto
        </a>
      </div>
    </div>

    <div class="highlight-controls" aria-label="Paginação de destaques">
      <button type="button" class="highlight-nav" data-direction="prev" aria-label="Produto anterior">←</button>
      <div class="highlight-dots" role="tablist" aria-label="Selecionar destaque">
        ${featuredProducts
          .map(
            (product, index) => `
              <button
                type="button"
                class="highlight-dot ${index === highlightIndex ? 'active' : ''}"
                data-index="${index}"
                aria-label="Ir para ${product.name}"
              ></button>
            `
          )
          .join('')}
      </div>
      <button type="button" class="highlight-nav" data-direction="next" aria-label="Próximo produto">→</button>
    </div>
  `;

  highlightHost.querySelectorAll('.highlight-dot, .highlight-nav').forEach((control) => {
    control.addEventListener('click', () => {
      if (control.classList.contains('highlight-dot')) {
        highlightIndex = Number(control.dataset.index || 0);
      } else {
        const direction = control.dataset.direction === 'next' ? 1 : -1;
        highlightIndex = (highlightIndex + direction + featuredProducts.length) % featuredProducts.length;
      }

      renderHighlightCard(products);
    });
  });
}

window.renderAntdCarousel = function renderAntdCarousel(productList) {
  highlightIndex = 0;
  renderHighlightCard(productList);
};

function renderProducts() {
  const visibleProducts = getVisibleProducts();

  if (!visibleProducts.length) {
    productsGrid.innerHTML = '<div class="empty-state">Nenhum produto encontrado nesta categoria.</div>';
    return;
  }

  productsGrid.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-image-wrap">
            <img class="product-image" src="${product.image}" alt="${product.name}" />
          </div>
          <div class="product-body">
            <span class="product-category">${product.category}</span>
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">${product.price}</div>
            <a class="product-link" href="${product.link}" target="_blank" rel="noreferrer noopener">
              Comprar agora
            </a>
          </div>
        </article>
      `
    )
    .join('');
}

async function loadProducts() {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error('Falha na requisição');

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    products = rows.map(normalizeProduct).filter((product) => product.name && product.category);
  } catch (error) {
    products = [
      {
        name: 'Vela Aromática Lavanda',
        price: 'R$ 59,99',
        category: 'Velas',
        image: 'https://http2.mlstatic.com/D_NQ_NP_2X_769805-MLA101387492976_122025-F.webp',
        link: '#'
      },
      {
        name: 'Castiçal De Vidro Candelabro',
        price: 'R$ 28,96',
        category: 'Castiçal',
        image: 'https://http2.mlstatic.com/D_NQ_NP_2X_900177-MLA111234924943_052026-F.webp',
        link: '#'
      },
      {
        name: 'Kit 3 Velas 7 Dias Santa Rita de Cássia',
        price: 'R$ 35,79',
        category: 'Velas',
        image: 'https://http2.mlstatic.com/D_NQ_NP_2X_893236-MLB95946023878_102025-F-kit-3-velas-7-dias-santa-rita-de-cassia-votiva-260g-oracao.webp',
        link: '#'
      }
    ];
  }

  if (!products.length) {
    products = [
      {
        name: 'Vela Aromática Lavanda',
        price: 'R$ 59,99',
        category: 'Velas',
        image: 'https://http2.mlstatic.com/D_NQ_NP_2X_769805-MLA101387492976_122025-F.webp',
        link: '#'
      }
    ];
  }

  renderCategoryMenu();
  renderProducts();

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      searchQuery = event.target.value.trim();
      renderProducts();
    });
  }

  if (window.renderAntdCarousel) {
    window.renderAntdCarousel(products);
  }
}

loadProducts();
