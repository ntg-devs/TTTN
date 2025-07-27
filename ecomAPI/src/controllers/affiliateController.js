import db from "../models/index";
import { nanoid } from 'nanoid';
import multiProductAttributionService from '../services/multiProductAttributionService';

/**
 * Affiliate Controller
 * Handles API endpoints for affiliate link operations and tracking
 */
const affiliateController = {
    /**
     * Generate a new affiliate link
     * POST /api/affiliate/links
     */
    generateAffiliateLink: async (req, res) => {
        try {
            // Get data from request body
            const { productId, platform } = req.body;

            // Get KOL ID from JWT token (set by middleware)
            const kolId = req.user.id;

            if (!kolId) {
                return res.status(401).json({
                    errCode: 1,
                    errMessage: 'User not authenticated'
                });
            }

            // Validate required fields
            if (!productId) {
                return res.status(400).json({
                    errCode: 2,
                    errMessage: 'Product ID is required'
                });
            }

            // Check if user is an approved KOL
            const user = await db.User.findOne({
                where: {
                    id: kolId,
                    is_kol: true,
                    kol_status: 'approved'
                }
            });

            if (!user) {
                return res.status(403).json({
                    errCode: 3,
                    errMessage: 'User is not an approved KOL'
                });
            }

            // Check if product exists
            const product = await db.Product.findOne({
                where: { id: productId }
            });

            if (!product) {
                return res.status(404).json({
                    errCode: 4,
                    errMessage: 'Product not found'
                });
            }

            // Generate short code using nanoid (8 characters)
            const shortCode = nanoid(8);

            // Create original URL with tracking parameters
            const baseUrl = process.env.URL_REACT || 'http://localhost:5000';
            const originalUrl = `${baseUrl}/detail-product/${productId}?ref=${kolId}`;

            // Create short URL
            const shortUrl = `${baseUrl}/a/${shortCode}`;

            // Create new affiliate link
            const newAffiliateLink = await db.AffiliateLink.create({
                kolId: kolId,
                productId: productId,
                originalUrl: originalUrl,
                shortUrl: shortUrl,
                shortCode: shortCode,
                createdAt: new Date(),
                platform: platform || null,
                clickCount: 0,
                conversions: 0,
                revenue: 0
            });

            return res.status(201).json({
                errCode: 0,
                errMessage: 'Affiliate link generated successfully',
                data: {
                    id: newAffiliateLink.id,
                    originalUrl: newAffiliateLink.originalUrl,
                    shortUrl: newAffiliateLink.shortUrl,
                    createdAt: newAffiliateLink.createdAt,
                    platform: newAffiliateLink.platform
                }
            });
        } catch (error) {
            console.error('Error generating affiliate link:', error);
            return res.status(500).json({
                errCode: -1,
                errMessage: 'Error from server'
            });
        }
    },

    /**
     * Get all affiliate links for a KOL
     * GET /api/affiliate/links
     */
    getAffiliateLinks: async (req, res) => {
        try {
            // Get KOL ID from JWT token
            const kolId = req.user.id;

            if (!kolId) {
                return res.status(401).json({
                    errCode: 1,
                    errMessage: 'User not authenticated'
                });
            }

            // Get query parameters for filtering and pagination
            const {
                productId,
                platform,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = req.query;

            // Check if user is an approved KOL
            const user = await db.User.findOne({
                where: {
                    id: kolId,
                    is_kol: true,
                    kol_status: 'approved'
                }
            });

            if (!user) {
                return res.status(403).json({
                    errCode: 3,
                    errMessage: 'User is not an approved KOL'
                });
            }

            // Build where clause for filtering
            const whereClause = { kolId: kolId };

            if (productId) {
                whereClause.productId = productId;
            }

            if (platform) {
                whereClause.platform = platform;
            }

            // Calculate offset for pagination
            const offset = (page - 1) * limit;

            // Validate sort parameters
            const validSortFields = ['createdAt', 'clickCount', 'conversions', 'revenue'];
            const validSortOrders = ['ASC', 'DESC'];

            const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
            const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

            // Get total count for pagination
            const totalCount = await db.AffiliateLink.count({
                where: whereClause
            });

            // Get affiliate links without any includes - completely separate
            const affiliateLinks = await db.AffiliateLink.findAll({
                where: whereClause,
                limit: parseInt(limit),
                offset: offset,
                order: [[finalSortBy, finalSortOrder]]
            });

            // Get unique product IDs from affiliate links
            const productIds = [...new Set(
                affiliateLinks
                    .map(link => link.productId)
                    .filter(id => id !== null && id !== undefined)
            )];

            // Create a map to store product information
            const productMap = {};

            if (productIds.length > 0) {
                // Step 1: Get all products
                const products = await db.Product.findAll({
                    where: { id: productIds },
                    attributes: ['id', 'name']
                });

                // Step 2: Get all product details for these products
                const productDetails = await db.ProductDetail.findAll({
                    where: { productId: productIds },
                    attributes: ['id', 'productId', 'originalPrice', 'discountPrice']
                });

                // Step 3: Get product detail IDs to fetch images
                const productDetailIds = productDetails.map(detail => detail.id);

                // Step 4: Get product images for these details
                const productImages = productDetailIds.length > 0 ? await db.ProductImage.findAll({
                    where: { productdetailId: productDetailIds },
                    attributes: ['id', 'productdetailId', 'image']
                }) : [];

                // Create maps for quick lookup
                const productDetailMap = {};
                productDetails.forEach(detail => {
                    if (!productDetailMap[detail.productId]) {
                        productDetailMap[detail.productId] = [];
                    }
                    productDetailMap[detail.productId].push(detail);
                });

                const productImageMap = {};
                productImages.forEach(image => {
                    if (!productImageMap[image.productdetailId]) {
                        productImageMap[image.productdetailId] = [];
                    }
                    productImageMap[image.productdetailId].push(image);
                });

                // Combine all product information
                products.forEach(product => {
                    const details = productDetailMap[product.id] || [];
                    const firstDetail = details[0]; // Get first product detail

                    let image = null;
                    if (firstDetail) {
                        const images = productImageMap[firstDetail.id] || [];
                        const firstImage = images[0]; // Get first image
                        image = firstImage ? new Buffer(firstImage.image, 'base64').toString('binary') : null;
                    }

                    const price = firstDetail ?
                        (firstDetail.discountPrice || firstDetail.originalPrice || 0) : 0;

                    productMap[product.id] = {
                        id: product.id,
                        name: product.name,
                        image: image,
                        price: parseFloat(price)
                    };
                });
            }

            // Format response data
            const formattedLinks = affiliateLinks.map(link => {
                return {
                    id: link.id,
                    originalUrl: link.originalUrl,
                    shortUrl: link.shortUrl,
                    clickCount: link.clickCount || 0,
                    conversions: link.conversions || 0,
                    revenue: parseFloat(link.revenue || 0),
                    commission: parseFloat(link.commission || 0),
                    createdAt: link.createdAt,
                    platform: link.platform,
                    product: productMap[link.productId] || null
                };
            });

            // Calculate pagination info
            const totalPages = Math.ceil(totalCount / limit);

            return res.status(200).json({
                errCode: 0,
                errMessage: 'Affiliate links retrieved successfully',
                data: {
                    links: formattedLinks,
                    pagination: {
                        totalItems: totalCount,
                        totalPages: totalPages,
                        currentPage: parseInt(page),
                        limit: parseInt(limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error getting affiliate links:', error);
            console.error('Error stack:', error.stack);
            return res.status(500).json({
                errCode: -1,
                errMessage: 'Error from server'
            });
        }
    },

    /**
     * Track a click on an affiliate link
     * POST /api/affiliate/track
     */
    trackAffiliateClick: async (req, res) => {
        try {
            // Get data from request body
            const { shortCode } = req.body;

            if (!shortCode) {
                return res.status(400).json({
                    errCode: 1,
                    errMessage: 'Short code is required'
                });
            }

            // Get the base URL for constructing the short URL
            const baseUrl = process.env.URL_REACT || 'http://localhost:5000';
            const shortUrl = `${baseUrl}/a/${shortCode}`;

            // Find the affiliate link by short URL
            const affiliateLink = await db.AffiliateLink.findOne({
                where: { shortUrl: shortUrl }
            });

            if (!affiliateLink) {
                return res.status(404).json({
                    errCode: 2,
                    errMessage: 'Affiliate link not found'
                });
            }

            // Extract tracking information from request
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'] || null;
            const referrerUrl = req.headers['referer'] || null;

            // Create anonymized IP (remove last octet for IPv4 or equivalent for IPv6)
            const anonymizedIp = ipAddress ? ipAddress.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.$3.0') : null;

            // Create click tracking record
            const clickRecord = await db.AffiliateClick.create({
                linkId: affiliateLink.id,
                kolId: affiliateLink.kolId,
                productId: affiliateLink.productId,
                ipAddress: anonymizedIp,
                userAgent: userAgent,
                clickedAt: new Date(),
                referrerUrl: referrerUrl,
                geoLocation: null, // Could be populated with GeoIP service if available
                converted: false,
                conversionId: null
            });

            // Increment click count on the affiliate link
            await affiliateLink.update({
                clickCount: (affiliateLink.clickCount || 0) + 1
            });

            // Trigger real-time stats update
            if (global.socketIo) {
                const realtimeStatsService = require('../services/realtimeStatsService');
                await realtimeStatsService.triggerStatsUpdate(affiliateLink.kolId, 'click', global.socketIo);
            }

            return res.status(200).json({
                errCode: 0,
                errMessage: 'Click tracked successfully',
                data: {
                    originalUrl: affiliateLink.originalUrl
                }
            });
        } catch (error) {
            console.error('Error tracking affiliate click:', error);
            return res.status(500).json({
                errCode: -1,
                errMessage: 'Error from server'
            });
        }
    },

    /**
     * Export KOL's own performance data
     * GET /api/affiliate/export-performance
     */
    exportKolPerformanceData: async (req, res) => {
        try {
            const kolId = req.user.id;
            const { format = 'csv', startDate, endDate } = req.query;

            if (!kolId) {
                return res.status(401).json({
                    errCode: 1,
                    errMessage: 'User not authenticated'
                });
            }

            // Check if user is an approved KOL
            const user = await db.User.findOne({
                where: {
                    id: kolId,
                    is_kol: true,
                    kol_status: 'approved'
                }
            });

            if (!user) {
                return res.status(403).json({
                    errCode: 2,
                    errMessage: 'User is not an approved KOL'
                });
            }

            // Build date filter
            const dateFilter = {};
            if (startDate && endDate) {
                dateFilter[db.Sequelize.Op.between] = [new Date(startDate), new Date(endDate)];
            } else if (startDate || endDate) {
                if (startDate) dateFilter[db.Sequelize.Op.gte] = new Date(startDate);
                if (endDate) dateFilter[db.Sequelize.Op.lte] = new Date(endDate);
            }


            // Get affiliate links data for this KOL
            const linksData = await db.AffiliateLink.findAll({
                where: {
                    kolId: kolId,
                    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
                },
                include: [
                    {
                        model: db.Product,
                        as: 'product',
                        attributes: ['id', 'name'],
                        include: [
                            {
                                model: db.ProductDetail,
                                as: 'productDetailData',
                                attributes: ['id', 'originalPrice', 'discountPrice'],
                                limit: 1
                            }
                        ]
                    }
                ],
                order: [['created_At', 'DESC']]
            });

            if (format === 'csv') {
                // Create CSV content for commission transactions
                let csvContent = 'Export Type,Transaction Date,Product Name,Product ID,Order ID,Commission Amount,Commission Rate,Status,Link Clicks,Link Conversions,Link Revenue\n';

                commissionData.forEach(item => {
                    const productDetail = item.affiliateLink?.product?.productDetailData?.[0];
                    const price = productDetail?.discountPrice || productDetail?.originalPrice || 0;

                    const values = [
                        'Commission Transaction',
                        item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
                        item.affiliateLink?.product?.name || '',
                        item.affiliateLink?.product?.id || '',
                        item.order?.orderId || '',
                        parseFloat(item.amount || 0).toFixed(2),
                        item.rate ? `${(item.rate * 100).toFixed(1)}%` : '',
                        item.status || '',
                        '', // Will be filled from links data
                        '', // Will be filled from links data
                        ''  // Will be filled from links data
                    ];

                    // Escape commas and quotes
                    const escapedValues = values.map(value => {
                        const strValue = String(value);
                        return strValue.includes(',') || strValue.includes('"')
                            ? `"${strValue.replace(/"/g, '""')}"`
                            : strValue;
                    });

                    csvContent += escapedValues.join(',') + '\n';
                });

                // Add affiliate links data
                linksData.forEach(item => {
                    const productDetail = item.product?.productDetailData?.[0];
                    const price = productDetail?.discountPrice || productDetail?.originalPrice || 0;

                    const values = [
                        'Affiliate Link',
                        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
                        item.product?.name || '',
                        item.product?.id || '',
                        '', // No order ID for links
                        '', // No commission amount for individual links
                        '', // No commission rate for individual links
                        'Active', // Links are active by default
                        item.clickCount || 0,
                        item.conversions || 0,
                        parseFloat(item.revenue || 0).toFixed(2)
                    ];

                    // Escape commas and quotes
                    const escapedValues = values.map(value => {
                        const strValue = String(value);
                        return strValue.includes(',') || strValue.includes('"')
                            ? `"${strValue.replace(/"/g, '""')}"`
                            : strValue;
                    });

                    csvContent += escapedValues.join(',') + '\n';
                });

                // Set headers for download
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename=my_performance_data_${new Date().toISOString().split('T')[0]}.csv`);

                return res.send(csvContent);
            } else if (format === 'excel') {
                const XLSX = require('xlsx');

                // Prepare commission transactions data
                const commissionExportData = commissionData.map(item => ({
                    'Type': 'Commission Transaction',
                    'Date': item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
                    'Product Name': item.affiliateLink?.product?.name || '',
                    'Product ID': item.affiliateLink?.product?.id || '',
                    'Order ID': item.order?.orderId || '',
                    'Commission Amount': parseFloat(item.amount || 0).toFixed(2),
                    'Commission Rate': item.rate ? `${(item.rate * 100).toFixed(1)}%` : '',
                    'Status': item.status || ''
                }));

                // Prepare affiliate links data
                const linksExportData = linksData.map(item => ({
                    'Type': 'Affiliate Link',
                    'Date': item.created_At ? new Date(item.created_At).toLocaleDateString() : '',
                    'Product Name': item.product?.name || '',
                    'Product ID': item.product?.id || '',
                    'Short URL': item.short_url || '',
                    'Clicks': item.clickCount || 0,
                    'Conversions': item.conversions || 0,
                    'Revenue': parseFloat(item.revenue || 0).toFixed(2),
                    'Commission': parseFloat(item.commission || 0).toFixed(2)
                }));

                // Create Excel workbook with multiple sheets
                const workbook = XLSX.utils.book_new();

                // Add commission transactions sheet
                if (commissionExportData.length > 0) {
                    const commissionSheet = XLSX.utils.json_to_sheet(commissionExportData);
                    XLSX.utils.book_append_sheet(workbook, commissionSheet, 'Commission Transactions');
                }

                // Add affiliate links sheet
                if (linksExportData.length > 0) {
                    const linksSheet = XLSX.utils.json_to_sheet(linksExportData);
                    XLSX.utils.book_append_sheet(workbook, linksSheet, 'Affiliate Links');
                }

                // Generate Excel buffer
                const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

                // Set headers for download
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=my_performance_data_${new Date().toISOString().split('T')[0]}.xlsx`);

                return res.send(excelBuffer);
            } else {
                return res.status(400).json({
                    errCode: 3,
                    errMessage: 'Unsupported format. Use csv or excel.'
                });
            }
        } catch (error) {
            console.error('Error exporting KOL performance data:', error);
            return res.status(500).json({
                errCode: -1,
                errMessage: 'Error from server'
            });
        }
    },

    /**
     * Get order attribution summary
     * GET /api/affiliate/orders/:orderId/attribution
     */
    getOrderAttributionSummary: async (req, res) => {
        try {
            const { orderId } = req.params;
            const userId = req.user.id;

            if (!orderId) {
                return res.status(400).json({
                    errCode: 1,
                    errMessage: 'Order ID is required'
                });
            }

            // Check if user is authenticated
            if (!userId) {
                return res.status(401).json({
                    errCode: 2,
                    errMessage: 'User not authenticated'
                });
            }

            // Get attribution summary using the multi-product attribution service
            const summaryResult = await multiProductAttributionService.getOrderAttributionSummary(orderId);

            if (summaryResult.errCode !== 0) {
                return res.status(500).json({
                    errCode: summaryResult.errCode,
                    errMessage: summaryResult.errMessage
                });
            }

            // Check if user has permission to view this order's attribution
            // (Either they are the customer who placed the order, or they are a KOL involved in the attribution)
            const orderProduct = await db.OrderProduct.findByPk(orderId, {
                include: [{
                    model: db.AddressUser,
                    as: 'addressUserData'
                }]
            });

            if (!orderProduct) {
                return res.status(404).json({
                    errCode: 3,
                    errMessage: 'Order not found'
                });
            }

            // Check if user is the customer who placed the order
            const isCustomer = orderProduct.addressUserData && orderProduct.addressUserData.userId === userId;

            // Check if user is a KOL involved in the attribution
            const isInvolvedKol = summaryResult.data.kolsInvolved.includes(userId);

            // Check if user is admin/staff
            const user = await db.User.findByPk(userId);
            const isAdmin = user && (user.roleId === 'R1' || user.roleId === 'R2'); // Assuming R1 is admin, R2 is staff

            if (!isCustomer && !isInvolvedKol && !isAdmin) {
                return res.status(403).json({
                    errCode: 4,
                    errMessage: 'Access denied. You do not have permission to view this order attribution.'
                });
            }

            return res.status(200).json({
                errCode: 0,
                errMessage: 'Order attribution summary retrieved successfully',
                data: summaryResult.data
            });
        } catch (error) {
            console.error('Error getting order attribution summary:', error);
            return res.status(500).json({
                errCode: -1,
                errMessage: 'Error from server'
            });
        }
    },

    /**
     * Get KOL performance dashboard data
     * GET /api/affiliate/dashboard
     */
    getDashboard: async (req, res) => {
        try {
            const kolId = req.user.id;

            if (!kolId) {
                return res.status(401).json({
                    errCode: 1,
                    errMessage: 'User not authenticated'
                });
            }

            // Check if user is an approved KOL
            const user = await db.User.findOne({
                where: {
                    id: kolId,
                    is_kol: true,
                    kol_status: 'approved'
                }
            });

            if (!user) {
                return res.status(403).json({
                    errCode: 2,
                    errMessage: 'User is not an approved KOL'
                });
            }

            // Get query parameters for date filtering
            const {
                startDate,
                endDate,
                period = '30d' // Default to last 30 days
            } = req.query;

            // Calculate date range
            let dateFilter = {};
            const now = new Date();

            if (startDate && endDate) {
                dateFilter = {
                    [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
                };
            } else {
                // Default periods
                let daysBack = 30;
                switch (period) {
                    case '7d':
                        daysBack = 7;
                        break;
                    case '30d':
                        daysBack = 30;
                        break;
                    case '90d':
                        daysBack = 90;
                        break;
                    case '1y':
                        daysBack = 365;
                        break;
                }

                const startOfPeriod = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
                dateFilter = {
                    [db.Sequelize.Op.gte]: startOfPeriod
                };
            }

            // Get affiliate links summary
            let affiliateLinksStats = [];
            try {
                affiliateLinksStats = await db.AffiliateLink.findAll({
                    where: {
                        kolId: kolId,
                        createdAt: dateFilter
                    },
                    attributes: [
                        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalLinks'],
                        [db.Sequelize.fn('SUM', db.Sequelize.col('clickCount')), 'totalClicks'],
                        [db.Sequelize.fn('SUM', db.Sequelize.col('conversions')), 'totalConversions'],
                        [db.Sequelize.fn('SUM', db.Sequelize.col('revenue')), 'totalRevenue'],
                        [db.Sequelize.fn('SUM', db.Sequelize.col('commission')), 'totalCommission']
                    ],
                    raw: true
                });
            } catch (error) {
                console.error('Error fetching affiliate links stats:', error);
                affiliateLinksStats = [];
            }

            // Get commission stats from AffiliateOrders
            let commissionStats = [];
            try {
                commissionStats = await db.AffiliateOrders.findAll({
                    where: {
                        kolId: kolId,
                        confirmedAt: dateFilter
                    },
                    attributes: [
                        'status',
                        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
                        [db.Sequelize.fn('SUM', db.Sequelize.col('commission')), 'total_amount']
                    ],
                    group: ['status'],
                    raw: true
                });
            } catch (error) {
                console.error('Error fetching commission stats:', error);
                commissionStats = [];
            }

            // Get top performing links
            let topLinks = [];
            try {
                topLinks = await db.AffiliateLink.findAll({
                    where: {
                        kolId: kolId,
                        createdAt: dateFilter
                    },
                    order: [['revenue', 'DESC']],
                    limit: 10
                });
            } catch (error) {
                console.error('Error fetching top links:', error);
                topLinks = [];
            }

                        // Get product data for top links
            const productIds = topLinks.map(link => link.productId).filter(id => id);
            let products = [];
            if (productIds.length > 0) {
                try {
                    // Simple query to get basic product info first
                    products = await db.Product.findAll({
                        where: { id: productIds },
                        attributes: ['id', 'name'],
                        raw: true
                    });
                } catch (error) {
                    console.error('Error fetching products for top links:', error);
                    products = [];
                }
            }

            // Create product map for quick lookup
            const productMap = {};
            products.forEach(product => {
                productMap[product.id] = product;
            });

            // Get product details and images separately if needed
            let productDetails = [];
            if (productIds.length > 0) {
                try {
                    productDetails = await db.ProductDetail.findAll({
                        where: { productId: productIds },
                        attributes: ['id', 'productId', 'originalPrice', 'discountPrice'],
                        raw: true
                    });
                } catch (error) {
                    console.error('Error fetching product details:', error);
                    productDetails = [];
                }
            }

            // Create product detail map
            const productDetailMap = {};
            productDetails.forEach(detail => {
                if (!productDetailMap[detail.productId]) {
                    productDetailMap[detail.productId] = [];
                }
                productDetailMap[detail.productId].push(detail);
            });

            // Get product images if needed
            let productImages = [];
            const detailIds = productDetails.map(detail => detail.id);
            if (detailIds.length > 0) {
                try {
                    productImages = await db.ProductImage.findAll({
                        where: { productdetailId: detailIds },
                        attributes: ['id', 'productdetailId', 'image'],
                        raw: true
                    });
                } catch (error) {
                    console.error('Error fetching product images:', error);
                    productImages = [];
                }
            }

            // Create product image map
            const productImageMap = {};
            productImages.forEach(image => {
                if (!productImageMap[image.productdetailId]) {
                    productImageMap[image.productdetailId] = [];
                }
                productImageMap[image.productdetailId].push(image);
            });

            // Get recent activity (clicks and conversions)
            let recentClicks = [];
            try {
                recentClicks = await db.AffiliateClick.findAll({
                    where: {
                        kolId: kolId,
                        clickedAt: dateFilter
                    },
                    order: [['clickedAt', 'DESC']],
                    limit: 20
                });
            } catch (error) {
                console.error('Error fetching recent clicks:', error);
                recentClicks = [];
            }

            // Get product data for recent clicks
            const recentClickProductIds = recentClicks.map(click => click.productId).filter(id => id);
            let recentClickProducts = [];
            if (recentClickProductIds.length > 0) {
                try {
                    recentClickProducts = await db.Product.findAll({
                        where: { id: recentClickProductIds },
                        attributes: ['id', 'name']
                    });
                } catch (error) {
                    console.error('Error fetching products for recent clicks:', error);
                    recentClickProducts = [];
                }
            }

            // Create product map for recent clicks
            const recentClickProductMap = {};
            recentClickProducts.forEach(product => {
                recentClickProductMap[product.id] = product;
            });

            // Get daily performance data for charts
            let dailyStats = [];
            try {
                dailyStats = await db.AffiliateClick.findAll({
                    where: {
                        kolId: kolId,
                        clickedAt: dateFilter
                    },
                    attributes: [
                        [db.Sequelize.fn('DATE', db.Sequelize.col('clickedAt')), 'date'],
                        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'clicks'],
                        [db.Sequelize.fn('SUM', db.Sequelize.literal('CASE WHEN converted = true THEN 1 ELSE 0 END')), 'conversions']
                    ],
                    group: [db.Sequelize.fn('DATE', db.Sequelize.col('clickedAt'))],
                    order: [[db.Sequelize.fn('DATE', db.Sequelize.col('clickedAt')), 'ASC']],
                    raw: true
                });
            } catch (error) {
                console.error('Error fetching daily stats:', error);
                dailyStats = [];
            }

            // Get total commission earned from AffiliateOrders
            let totalCommissionEarned = [];
            try {
                totalCommissionEarned = await db.AffiliateOrders.findAll({
                    where: {
                        kolId: kolId,
                        status: 'completed',
                        confirmedAt: dateFilter
                    },
                    attributes: [
                        [db.Sequelize.fn('SUM', db.Sequelize.col('commission')), 'totalCommission']
                    ],
                    raw: true
                });
            } catch (error) {
                console.error('Error fetching total commission earned:', error);
                totalCommissionEarned = [];
            }

            // Get KOL tier information
            const totalSales = user.total_sales || 0;
            const currentCommissionRate = parseFloat(user.kol_commission_rate || 5.00);
            const currentTier = currentCommissionRate >= 10 ? 'high' : 'standard';
            const nextTierThreshold = currentTier === 'standard' ? 10000 : null;
            const salesUntilNextTier = currentTier === 'standard' ? Math.max(0, 10000 - totalSales) : 0;

            // Format response data
            const stats = affiliateLinksStats[0] || {};
            const commissionEarned = totalCommissionEarned[0] || {};
            const formattedStats = {
                totalLinks: parseInt(stats.totalLinks) || 0,
                totalClicks: parseInt(stats.totalClicks) || 0,
                totalConversions: parseInt(stats.totalConversions) || 0,
                totalRevenue: parseFloat(stats.totalRevenue) || 0,
                totalCommission: parseFloat(stats.totalCommission) || 0,
                totalCommissionEarned: parseFloat(commissionEarned.totalCommission) || 0,
                conversionRate: stats.totalClicks > 0 ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(2) : 0
            };



            // Format commission breakdown
            const commissionBreakdown = {
                pending: { count: 0, amount: 0 },
                completed: { count: 0, amount: 0 },
                cancelled: { count: 0, amount: 0 }
            };

            commissionStats.forEach(stat => {
                if (commissionBreakdown[stat.status]) {
                    commissionBreakdown[stat.status] = {
                        count: parseInt(stat.count) || 0,
                        amount: parseFloat(stat.total_amount) || 0
                    };
                }
            });

            // Format top performing links
            const formattedTopLinks = topLinks.map(link => {
                const product = productMap[link.productId];
                const details = productDetailMap[link.productId] || [];
                const firstDetail = details[0];
                const price = firstDetail ? (firstDetail.discountPrice || firstDetail.originalPrice || 0) : 0;
                
                // Get first image if available
                let image = null;
                if (firstDetail) {
                    const images = productImageMap[firstDetail.id] || [];
                    const firstImage = images[0];
                    image = new Buffer(firstImage.image, 'base64').toString('binary');
                }

                return {
                    id: link.id,
                    shortUrl: link.shortUrl,
                    clicks: link.clickCount || 0,
                    conversions: link.conversions || 0,
                    revenue: parseFloat(link.revenue || 0),
                    commission: parseFloat(link.commission || 0),
                    conversionRate: link.clickCount > 0 ? ((link.conversions / link.clickCount) * 100).toFixed(2) : 0,
                    createdAt: link.createdAt,
                    product: product ? {
                        id: product.id,
                        name: product.name,
                        image: image,
                        price: parseFloat(price)
                    } : null
                };
            });

            // Format recent activity
            const formattedRecentClicks = recentClicks.map(click => {
                const product = recentClickProductMap[click.productId];
                return {
                    id: click.id,
                    clickedAt: click.clickedAt,
                    converted: click.converted,
                    ipAddress: click.ipAddress,
                    referrerUrl: click.referrerUrl,
                    product: product ? {
                        id: product.id,
                        name: product.name
                    } : null
                };
            });

            return res.status(200).json({
                errCode: 0,
                errMessage: 'Dashboard data retrieved successfully',
                data: {
                    overview: formattedStats,
                    tierInfo: {
                        currentTier,
                        currentRate: currentCommissionRate,
                        totalSales,
                        nextTierThreshold,
                        salesUntilNextTier
                    },
                    commissions: commissionBreakdown,
                    topPerformingLinks: formattedTopLinks,
                    recentActivity: formattedRecentClicks,
                    dailyStats: dailyStats,
                    period: {
                        startDate: startDate || new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString(),
                        endDate: endDate || now.toISOString(),
                        period
                    }
                }
            });
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            console.error('Error stack:', error.stack);
            return res.status(500).json({
                errCode: -1,
                errMessage: 'Error from server'
            });
        }
    }
};

module.exports = affiliateController;