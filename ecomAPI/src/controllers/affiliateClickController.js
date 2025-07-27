const affiliateClickService = require('../services/affiliateClickService');

const handleCreateAffiliateClick = async (req, res) => {
  try {
    const { linkId, kolId, productId } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await affiliateClickService.createAffiliateClick({ linkId, kolId, productId, ip, userAgent });
    return res.status(200).json({ success: true, data: result });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  handleCreateAffiliateClick
}; 