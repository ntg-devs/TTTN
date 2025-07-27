const db = require('../models');

const handleAffiliateAttribution = async (req, res, next) => {
  try {
    // Read affiliate parameters from query string
    const { aff, kol, product } = req.query;
    
    if (aff && kol) {
      // Enhanced attribution data structure for multi-product support
      const attributionData = {
        affiliateId: aff,
        kolId: kol,
        productId: product || null, // null means attribute all products in order
        timestamp: new Date(),
        attributionType: product ? 'specific' : 'general' // specific product or general order attribution
      };
      
      // Save affiliate attribution to session
      req.session.affiliateAttribution = attributionData;
      
      // Also save to cookie as backup (if not using session)
      res.cookie('affiliate_attribution', JSON.stringify(attributionData), { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true 
      });
      
      console.log('Multi-product affiliate attribution saved:', {
        affiliateId: aff,
        kolId: kol,
        productId: product || 'ALL_PRODUCTS',
        attributionType: attributionData.attributionType
      });
    }
    
    next();
  } catch (error) {
    console.error('Error handling affiliate attribution:', error);
    next();
  }
};

const getAffiliateAttribution = (req) => {
  // Ưu tiên lấy từ session, sau đó từ cookie
  if (req.session && req.session.affiliateAttribution) {
    return req.session.affiliateAttribution;
  }
  
  if (req.cookies && req.cookies.affiliate_attribution) {
    try {
      return JSON.parse(req.cookies.affiliate_attribution);
    } catch (e) {
      return null;
    }
  }
  
  return null;
};

const clearAffiliateAttribution = (req, res) => {
  if (req.session && req.session.affiliateAttribution) {
    delete req.session.affiliateAttribution;
  }
  
  res.clearCookie('affiliate_attribution');
};

module.exports = {
  handleAffiliateAttribution,
  getAffiliateAttribution,
  clearAffiliateAttribution
}; 