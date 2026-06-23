const MENU_HANDLE = process.env.MENU_HANDLE;

const HANDOFF_MENU_MAP = {
  pickup_delivery: "Book Footwear Pick-Up",
  shipping: "Mail-In Footwear",
  dropoff: "Footwear Drop-Off",
};

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
  const enabledTitles = new Set(
    Object.entries(HANDOFF_MENU_MAP)
      .filter(([key]) => handoffMethods[key] !== false)
      .map(([, title]) => title)
  );

  const existingByTitle = new Map(menu.items.map((i) => [i.title, i]));

  // Keep non-managed items and any enabled managed items already in the menu
  const newItems = menu.items
    .filter((item) => !managedTitles.has(item.title) || enabledTitles.has(item.title))
    .map(itemToInput);

  // Add enabled managed items that are missing from the menu
  for (const title of enabledTitles) {
    if (!existingByTitle.has(title)) {
      newItems.push({ title, type: "HTTP", url: HANDOFF_PAGE_LINKS[title] });
    }
  }

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
