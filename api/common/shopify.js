const fetch = require("node-fetch");

/**
 * Check to see if a product variant is sold out
 *
 * @param {string} variantId
 * @returns
 */
const isVariantSoldOut = async (variantId) => {
  const { variant } = await fetch(
    `https://panopticon-industries.myshopify.com/admin/api/2021-07/variants/${variantId}.json`,
    {
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN
      }
    }
  ).then(resp => resp.json());

  if (!variant) {
    return {
      exists: false
    }
  }

  return {
    exists: true,
    soldOut: variant.inventory_quantity === 0
  };
};

module.exports = {isVariantSoldOut};
