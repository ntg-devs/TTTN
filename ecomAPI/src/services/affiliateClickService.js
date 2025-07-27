const db = require('../models');

const createAffiliateClick = async ({ linkId, kolId, productId, ip, userAgent, referrerUrl = null }) => {
  // Create anonymized IP (remove last octet for IPv4)
  const anonymizedIp = ip ? ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.$3.0') : null;
  
  return await db.AffiliateClick.create({
    linkId: linkId,
    kolId: kolId,
    productId: productId,
    ipAddress: anonymizedIp,
    userAgent: userAgent,
    clickedAt: new Date(),
    referrerUrl: referrerUrl,
    geoLocation: null,
    converted: false,
    conversionId: null
  });
};

module.exports = {
  createAffiliateClick
}; 