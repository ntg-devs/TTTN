const db = require('../models');

/**
 * Multi-Product Attribution Service
 * Handles attribution and commission calculation for all products in an order
 * Requirements: 6.3, 6.5 - Handle attribution for all products and calculate commissions
 */
const multiProductAttributionService = {
  /**
   * Process multi-product attribution for an entire order
   * @param {Object} orderData - Order data with product items
   * @param {Array} orderData.orderItems - Array of order items
   * @param {Object} orderData.affiliateAttribution - Affiliate attribution data
   * @param {string} orderData.orderId - Order ID
   * @returns {Promise<Object>} - Attribution processing result
   */
  processOrderAttribution: async (orderData) => {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { orderItems, affiliateAttribution, orderId } = orderData;

      console.log("orderItems",orderItems)
      console.log("affiliateAttribution",affiliateAttribution)
      console.log("orderId",orderId)
      
      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        await transaction.rollback();
        return {
          errCode: 1,
          errMessage: 'No order items provided for attribution'
        };
      }

      const attributionResults = [];
      const kolsToUpdate = new Set();
      let totalAttributedRevenue = 0;
      let totalCommissions = 0;

      // Process each order item for attribution
      for (const item of orderItems) {
        const itemResult = await multiProductAttributionService.processItemAttribution({
          item,
          affiliateAttribution,
          orderId,
          transaction
        });

        if (itemResult.errCode === 0) {
          attributionResults.push(itemResult.data);
          
          if (itemResult.data.attributed) {
            kolsToUpdate.add(itemResult.data.kolId);
            totalAttributedRevenue += itemResult.data.revenue;
            totalCommissions += itemResult.data.commission;
          }
        } else {
          console.warn(`Failed to process attribution for item ${item.productId}:`, itemResult.errMessage);
          // Continue processing other items even if one fails
          attributionResults.push({
            productId: item.productId,
            attributed: false,
            error: itemResult.errMessage
          });
        }
      }

      await transaction.commit();

      // Update KOL total sales after successful order processing
      if (kolsToUpdate.size > 0) {
        setImmediate(async () => {
          for (const kolId of kolsToUpdate) {
            try {
              // Calculate total sales for this KOL (include pending orders too)
              const totalSales = await db.AffiliateOrders.sum('revenue', {
                where: { 
                  kolId: kolId
                }
              });
              
              // Update KOL total sales
              await db.User.update(
                { total_sales: totalSales || 0 },
                { where: { id: kolId } }
              );
              
              console.log(`Updated total sales for KOL ${kolId}: ${totalSales}`);
            } catch (error) {
              console.error(`Error updating total sales for KOL ${kolId}:`, error);
            }
          }
        });
      }

      return {
        errCode: 0,
        errMessage: 'Multi-product attribution processed successfully',
        data: {
          orderId,
          totalItems: orderItems.length,
          attributedItems: attributionResults.filter(r => r.attributed).length,
          totalAttributedRevenue,
          totalCommissions,
          kolsInvolved: Array.from(kolsToUpdate),
          itemResults: attributionResults
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error processing multi-product attribution:', error);
      return {
        errCode: -1,
        errMessage: 'Error processing multi-product attribution'
      };
    }
  },

  /**
   * Process attribution for a single item in the order
   * @param {Object} params - Item processing parameters
   * @param {Object} params.item - Order item data
   * @param {Object} params.affiliateAttribution - Affiliate attribution data
   * @param {string} params.orderId - Order ID
   * @param {Object} params.transaction - Database transaction
   * @returns {Promise<Object>} - Item attribution result
   */
  processItemAttribution: async ({ item, affiliateAttribution, orderId, transaction }) => {
    try {
      const { productId, quantity, realPrice, orderDetailId, orderId: itemOrderId } = item;
      const mainOrderId = orderId || itemOrderId; // Use passed orderId or item's orderId
      const revenue = realPrice * quantity;

      // Check if this item should be attributed
      const shouldAttribute = multiProductAttributionService.shouldAttributeItem({
        item,
        affiliateAttribution
      });

      if (!shouldAttribute.attribute) {
        return {
          errCode: 0,
          data: {
            productId,
            attributed: false,
            reason: shouldAttribute.reason,
            revenue,
            commission: 0
          }
        };
      }

      const kolId = shouldAttribute.kolId;
      const linkId = shouldAttribute.linkId;

      // Get KOL information for commission calculation
      const kol = await db.User.findByPk(kolId, { transaction });
      if (!kol || !kol.is_kol) {
        return {
          errCode: 1,
          errMessage: 'Invalid KOL or user is not a KOL'
        };
      }

      // Calculate commission for this item
      const totalSales = kol.total_sales || 0;
      const commissionRate = parseFloat(kol.kol_commission_rate || 5.00) / 100; // Convert from percentage to decimal
      const commissionAmount = revenue * commissionRate;
      
      console.log('Commission calculation:', {
        revenue,
        commissionRatePercent: kol.kol_commission_rate || 5.00,
        commissionRateDecimal: commissionRate,
        commissionAmount,
        totalSales
      });

      // Create AffiliateOrders record
      const affiliateOrder = await db.AffiliateOrders.create({
        kolId: kolId,
        orderId: mainOrderId, // Use main order ID, not orderDetailId
        productId: productId,
        revenue: revenue,
        commission: commissionAmount,
        status: 'pending',
        confirmedAt: new Date()
      }, { transaction });

      // Update affiliate link statistics
      await multiProductAttributionService.updateAffiliateStats({
        linkId,
        revenue,
        commission: commissionAmount,
        transaction
      });

      // Mark click as converted
      await multiProductAttributionService.markClickConverted({
        linkId,
        kolId,
        productId,
        conversionId: orderDetailId,
        transaction
      });

      return {
        errCode: 0,
        data: {
          productId,
          attributed: true,
          kolId,
          linkId,
          revenue,
          commission: commissionAmount,
          commissionRate: commissionRate,
          affiliateOrderId: affiliateOrder.id
        }
      };
    } catch (error) {
      console.error('Error processing item attribution:', error);
      return {
        errCode: -1,
        errMessage: error.message || 'Error processing item attribution'
      };
    }
  },

  /**
   * Determine if an item should be attributed to a KOL
   * @param {Object} params - Attribution check parameters
   * @param {Object} params.item - Order item
   * @param {Object} params.affiliateAttribution - Affiliate attribution data
   * @returns {Object} - Attribution decision
   */
  shouldAttributeItem: ({ item, affiliateAttribution }) => {
    // If no affiliate attribution, no attribution
    if (!affiliateAttribution) {
      console.log('No affiliate attribution data found');
      return {
        attribute: false,
        reason: 'No affiliate attribution data'
      };
    }

    const { kolId, affiliateId, productId: attributedProductId, timestamp, expiresAt } = affiliateAttribution;

    console.log('Checking attribution for item:', {
      itemProductId: item.productId,
      attributedProductId,
      kolId,
      affiliateId,
      timestamp,
      expiresAt
    });

    // If no KOL or affiliate link, no attribution
    if (!kolId || !affiliateId) {
      console.log('Missing KOL ID or affiliate link ID:', { kolId, affiliateId });
      return {
        attribute: false,
        reason: 'Missing KOL ID or affiliate link ID'
      };
    }

    // Check if attribution has expired
    if (expiresAt && Date.now() > expiresAt) {
      console.log('Affiliate attribution has expired');
      return {
        attribute: false,
        reason: 'Affiliate attribution has expired'
      };
    }

    // For multi-product attribution, we have different strategies:
    // 1. Specific product attribution - only attribute if product matches
    // 2. General attribution - attribute all products in the order (within time window)
    
    // Check if this is a specific product attribution
    if (attributedProductId && attributedProductId !== item.productId) {
      // Check if we should allow general attribution for recent clicks
      const timeSinceClick = Date.now() - timestamp;
      const maxGeneralAttributionTime = 30 * 60 * 1000; // 30 minutes
      
      if (timeSinceClick <= maxGeneralAttributionTime) {
        // Allow general attribution for recent clicks
        console.log('Product mismatch but allowing general attribution for recent click:', {
          expected: attributedProductId,
          actual: item.productId,
          timeSinceClick: Math.round(timeSinceClick / 1000 / 60) + ' minutes'
        });
        return {
          attribute: true,
          kolId,
          linkId: affiliateId,
          reason: 'General attribution for recent click'
        };
      } else {
        // Too much time has passed, only attribute specific product
        console.log('Product mismatch and too much time passed for general attribution:', {
          expected: attributedProductId,
          actual: item.productId,
          timeSinceClick: Math.round(timeSinceClick / 1000 / 60) + ' minutes'
        });
        return {
          attribute: false,
          reason: 'Product does not match attributed product and attribution time expired'
        };
      }
    }

    // If no specific product ID, or product matches, attribute this item
    const reason = attributedProductId ? 'Product matches attributed product' : 'General order attribution';
    console.log('Attributing item:', { itemProductId: item.productId, reason });
    
    return {
      attribute: true,
      kolId,
      linkId: affiliateId,
      reason
    };
  },

  /**
   * Update affiliate link statistics
   * @param {Object} params - Update parameters
   * @returns {Promise<void>}
   */
  updateAffiliateStats: async ({ linkId, revenue, commission, transaction }) => {
    try {
      const affiliateLink = await db.AffiliateLink.findByPk(linkId, { transaction });
      if (affiliateLink) {
        // Use static update method for better compatibility
        const currentConversions = affiliateLink.conversions || 0;
        const currentRevenue = parseFloat(affiliateLink.revenue || 0);
        const currentCommission = parseFloat(affiliateLink.commission || 0);
        
        await db.AffiliateLink.update({
          conversions: currentConversions + 1,
          revenue: currentRevenue + parseFloat(revenue),
          commission: currentCommission + parseFloat(commission)
        }, { 
          where: { id: linkId },
          transaction 
        });
      }
    } catch (error) {
      console.error('Error updating affiliate stats:', error);
      // Don't throw error as this is not critical for order processing
    }
  },

  /**
   * Mark affiliate click as converted
   * @param {Object} params - Conversion parameters
   * @returns {Promise<void>}
   */
  markClickConverted: async ({ linkId, kolId, productId, conversionId, transaction }) => {
    try {
      await db.AffiliateClick.update(
        { 
          converted: true, 
          conversionId: conversionId 
        },
        { 
          where: { 
            linkId: linkId,
            kolId: kolId,
            productId: productId,
            converted: false
          },
          order: [['clickedAt', 'DESC']],
          limit: 1,
          transaction
        }
      );
    } catch (error) {
      console.error('Error marking click as converted:', error);
      // Don't throw error as this is not critical for order processing
    }
  },

  /**
   * Get attribution summary for an order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Attribution summary
   */
  getOrderAttributionSummary: async (orderId) => {
    try {
      // Get all affiliate orders for this order
      const affiliateOrders = await db.AffiliateOrders.findAll({
        where: { orderId: orderId },
        include: [
          {
            model: db.User,
            as: 'kol',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: db.Product,
            as: 'product',
            attributes: ['id', 'name']
          }
        ]
      });

      const summary = {
        orderId,
        totalCommissions: 0,
        totalAttributedRevenue: 0,
        kolsInvolved: new Set(),
        productBreakdown: []
      };

      affiliateOrders.forEach(order => {
        summary.totalCommissions += parseFloat(order.commission);
        summary.totalAttributedRevenue += parseFloat(order.revenue);
        summary.kolsInvolved.add(order.kolId);

        summary.productBreakdown.push({
          productId: order.productId,
          productName: order.product?.name,
          kolId: order.kolId,
          kolName: order.kol ? `${order.kol.firstName} ${order.kol.lastName}` : 'Unknown',
          commission: parseFloat(order.commission),
          revenue: parseFloat(order.revenue),
          status: order.status
        });
      });

      summary.kolsInvolved = Array.from(summary.kolsInvolved);

      return {
        errCode: 0,
        errMessage: 'Attribution summary retrieved successfully',
        data: summary
      };
    } catch (error) {
      console.error('Error getting order attribution summary:', error);
      return {
        errCode: -1,
        errMessage: 'Error retrieving attribution summary'
      };
    }
  },

  /**
   * Validate multi-product attribution data
   * @param {Object} attributionData - Attribution data to validate
   * @returns {Object} - Validation result
   */
  validateAttributionData: (attributionData) => {
    const { orderItems, affiliateAttribution, orderId } = attributionData;
    const errors = [];

    if (!orderId) {
      errors.push('Order ID is required');
    }

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      errors.push('Order items array is required and must not be empty');
    } else {
      orderItems.forEach((item, index) => {
        if (!item.productId) {
          errors.push(`Order item ${index}: Product ID is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Order item ${index}: Valid quantity is required`);
        }
        if (!item.realPrice || item.realPrice <= 0) {
          errors.push(`Order item ${index}: Valid price is required`);
        }
      });
    }

    if (affiliateAttribution) {
      if (!affiliateAttribution.kolId) {
        errors.push('KOL ID is required in affiliate attribution');
      }
      if (!affiliateAttribution.affiliateId) {
        errors.push('Affiliate link ID is required in affiliate attribution');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

module.exports = multiProductAttributionService;