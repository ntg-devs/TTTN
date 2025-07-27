
const db = require('../models');

const resolveAffiliateLink = async (shortCode, req) => {
  try {
    // Fix: Use proper Sequelize syntax with correct field names
    const link = await db.AffiliateLink.findOne({ 
      where: { shortCode: shortCode }
    });

    if (!link) {
      throw new Error('Affiliate link not found');
    }

    const product = await db.Product.findByPk(link.productId);

    if (!product) {
      throw new Error('Product not found');
    }
    // Extract tracking information from request
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || null;
    const referrerUrl = req.headers['referer'] || null;

    // Create anonymized IP (remove last octet for IPv4)
    const anonymizedIp = ipAddress ? ipAddress.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.$3.0') : null;

    // Record the click event
    await db.AffiliateClick.create({
      linkId: link.id, // Use link.id instead of link.Link_id
      kolId: link.kolId,
      productId: link.productId,
      ipAddress: anonymizedIp,
      userAgent: userAgent,
      clickedAt: new Date(),
      referrerUrl: referrerUrl,
      geoLocation: null,
      converted: false,
      conversionId: null
    });

    // Increment click count on the affiliateLink
    await db.AffiliateLink.update(
        { clickCount: (link.clickCount || 0) + 1 },
        { where: { id: link.id } }
    );

    // Create destination URL with tracking parameters
    const destinationUrl = `/detail-product/${product.id}?ref=${link.kolId}&aff=${link.id}&utm_source=affiliate&utm_medium=kol&utm_campaign=${shortCode}`;

    return {
      link,
      product,
      destinationUrl
    };
  } catch (error) {
    console.error('Error resolving affiliate link:', error);
    throw error;
  }
};

module.exports = {
  resolveAffiliateLink
}; 