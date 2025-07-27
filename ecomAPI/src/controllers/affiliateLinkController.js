const affiliateLinkService = require('../services/affiliateLinkService');

const handleRedirectAffiliateLink = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    // Resolve the affiliate link and get destination URL with tracking parameters
    const result = await affiliateLinkService.resolveAffiliateLink(shortCode, req);
    
    // Return JSON response instead of redirecting
    // Frontend will handle the redirect and attribution
    return res.status(200).json({
      errCode: 0,
      errMessage: 'Affiliate link resolved successfully',
      data: {
        product: {
          id: result.link.productId,
          name: result.product?.name || 'Product'
        },
        affiliateData: {
          kolId: result.link.kolId,
          affiliateId: result.link.id,
          shortCode: shortCode
        },
        redirectUrl: result.destinationUrl
      }
    });
  } catch (error) {
    console.error('Error handling affiliate link redirect:', error);
    return res.status(404).json({
      errCode: 1,
      errMessage: 'Affiliate link not found'
    });
  }
};

module.exports = {
  handleRedirectAffiliateLink
}; 