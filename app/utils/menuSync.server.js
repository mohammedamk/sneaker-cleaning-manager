const MENU_HANDLE = process.env.MENU_HANDLE;

const HANDOFF_MENU_MAP = {
  pickup_delivery: "Book Footwear Pick-Up",
  shipping: "Mail-In Footwear",
  dropoff: "Footwear Drop-Off",
};

// Order in which enabled handoff items are inserted after the "Home" nav item
const HANDOFF_INSERT_ORDER = ["shipping", "dropoff", "pickup_delivery"];

const HANDOFF_PAGE_LINKS = {
  "Book Footwear Pick-Up": "/pages/book-sneaker-pick-up",
  "Mail-In Footwear": "/pages/book-sneaker-pick-up",
  "Footwear Drop-Off": "/pages/book-sneaker-pick-up",
};

const GET_MENU_QUERY = `#graphql
  query getMenu {
    menus(first: 20) {
      nodes {
        id
        handle
        title
        items {
          id
          title
          url
          resourceId
          type
          tags
        }
      }
    }
  }
`;

const MENU_UPDATE_MUTATION = `#graphql
  mutation menuUpdate($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]!) {
    menuUpdate(id: $id, title: $title, items: $items) {
      menu {
        id
        handle
        items {
          id
          title
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

function itemToInput(item) {
  const input = { id: item.id, title: item.title, type: item.type };
  if (item.resourceId) {
    input.resourceId = item.resourceId;
  } else if (item.url) {
    input.url = item.url;
  }
  if (item.tags?.length) input.tags = item.tags;
  return input;
}

export async function syncMenuWithHandoffMethods(admin, handoffMethods) {
  const menuRes = await admin.graphql(GET_MENU_QUERY);
  const { data: menuData } = await menuRes.json();
  const menu = menuData?.menus?.nodes?.find((m) => m.handle === MENU_HANDLE);

  if (!menu) {
    console.warn(`[menuSync] Menu "${MENU_HANDLE}" not found — skipping sync.`);
    return;
  }

  const managedTitles = new Set(Object.values(HANDOFF_MENU_MAP));

  // Build enabled handoff items in the required insertion order, reusing existing item IDs when available
  const existingByTitle = new Map(menu.items.map((i) => [i.title, i]));
  const enabledHandoffItems = HANDOFF_INSERT_ORDER
    .filter((key) => handoffMethods[key] !== false)
    .map((key) => {
      const title = HANDOFF_MENU_MAP[key];
      const existing = existingByTitle.get(title);
      return existing ? itemToInput(existing) : { title, type: "HTTP", url: HANDOFF_PAGE_LINKS[title] };
    });

  // Strip all managed items, then splice enabled ones in right after "Home"
  const nonManagedItems = menu.items
    .filter((item) => !managedTitles.has(item.title))
    .map(itemToInput);

  const homeIndex = nonManagedItems.findIndex((item) => item.title?.toLowerCase() === "home");
  const insertAt = homeIndex === -1 ? 0 : homeIndex + 1;

  const newItems = [
    ...nonManagedItems.slice(0, insertAt),
    ...enabledHandoffItems,
    ...nonManagedItems.slice(insertAt),
  ];

  const updateRes = await admin.graphql(MENU_UPDATE_MUTATION, {
    variables: { id: menu.id, title: menu.title, items: newItems },
  });
  const { data: updateData } = await updateRes.json();
  const errors = updateData?.menuUpdate?.userErrors ?? [];

  if (errors.length) {
    throw new Error(`Menu update failed: ${errors.map((e) => e.message).join(", ")}`);
  }

  console.log(`[menuSync] Menu synced successfully`);
}
